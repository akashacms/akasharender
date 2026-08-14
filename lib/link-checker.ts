/**
 *
 * Copyright 2014-2025 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * Link Checker
 *
 * Validates the links in a rendered AkashaCMS site.  Internal (local) links are
 * resolved against the documents and assets caches; external `http:`/`https:`
 * links are validated over the network.  Every other URI scheme (`mailto:`,
 * `tel:`, ...) is treated as a non-checkable "other scheme" link.
 *
 * Each class of link (internal, external, other-scheme) has a severity
 * {@link LinkCheckMode}: `ignore` turns that class of checking off entirely,
 * `warn` logs a notice, `error` collects failures and fails the build at the
 * end, and `fatal` throws at the first bad link.
 *
 * This module is used by the Built-in Plugin (`lib/built-in.ts`), which owns the
 * configuration surface and drives the whole-site scan from `onSiteRendered`.
 *
 * @module link-checker
 */

import path from 'node:path';
import { resolveVpath } from './index.js';
import type { Configuration } from './index.js';

/**
 * Severity for a class of link check.
 *
 * - `ignore` — do not check this class of link at all (the off switch).
 * - `warn`   — log a notice and continue.
 * - `error`  — collect the failure; {@link LinkChecker.finish} throws at the end.
 * - `fatal`  — throw immediately at the point of detection.
 */
export type LinkCheckMode = 'ignore' | 'warn' | 'error' | 'fatal';

/** The set of valid {@link LinkCheckMode} values. */
export const LINK_CHECK_MODES: ReadonlyArray<LinkCheckMode>
    = [ 'ignore', 'warn', 'error', 'fatal' ];

/**
 * Throw if `mode` is not a valid {@link LinkCheckMode}.
 *
 * @param mode The value to validate.
 * @param label A short label naming the option, for the error message.
 */
export function assertMode(mode: any, label: string = 'mode'): asserts mode is LinkCheckMode {
    if (!LINK_CHECK_MODES.includes(mode)) {
        throw new Error(
            `checkLinks ${label} must be one of ${LINK_CHECK_MODES.join(', ')}, got ${JSON.stringify(mode)}`
        );
    }
}

/**
 * A whitelist entry: a domain/URL prefix string, or a RegExp matched against the
 * full URL.
 */
export type WhitelistEntry = string | RegExp;

/**
 * The classification of an external URL check.
 *
 * - `OK`     — the link is alive.
 * - `BROKEN` — the link is dead (404/410, DNS/TLS/connection failure).
 * - `WARN`   — ambiguous (401/403/405/429/999/5xx); the resource likely exists
 *   but the checker was blocked or throttled.
 */
export type ExternalState = 'OK' | 'BROKEN' | 'WARN';

/** The result of an external per-URL check. */
export interface ExternalResult {
    state: ExternalState;
    /** The HTTP status code, or `0` when no HTTP response was obtained. */
    status: number;
}

/** Options passed to an {@link ExternalChecker}. */
export interface ExternalCheckOptions {
    userAgent: string;
    timeoutMs: number;
    maxRedirects: number;
    /** Extra HTTP headers (e.g. authorization). */
    headers?: Record<string, string>;
}

/**
 * A per-URL external checker.  Both the built-in `fetch` implementation and the
 * optional `link-check` adapter satisfy this signature, so the surrounding
 * harness is independent of which one is active.
 */
export type ExternalChecker
    = (url: string, opts: ExternalCheckOptions) => Promise<ExternalResult>;

/** The kind of link a report concerns. */
export type LinkKind = 'internal' | 'external' | 'other-scheme';

/** A single recorded link problem. */
export interface LinkError {
    kind: LinkKind;
    href: string;
    /** The rendered document (renderPath) the link was found in, if known. */
    source?: string;
    detail: string;
}

/** Configuration for the {@link LinkChecker}. */
export interface LinkCheckOptions {
    internal?: LinkCheckMode;
    external?: LinkCheckMode;
    reportOtherSchemes?: LinkCheckMode;
    whitelist?: WhitelistEntry[];
    userAgent?: string;
    timeoutMs?: number;
    maxRedirects?: number;
    concurrency?: number;
    cacheTTLms?: number;
    headers?: Record<string, string>;
    /**
     * Which external checker to use: `'fetch'` (default, zero dependency) or
     * `'link-check'` (lazy-loads the site-author-installed `link-check`
     * package).  Alternatively, a custom {@link ExternalChecker} function may
     * be supplied directly (used by tests).
     */
    externalChecker?: 'fetch' | 'link-check' | ExternalChecker;
}

/** The fully-resolved options after defaults are applied. */
interface ResolvedOptions {
    internal: LinkCheckMode;
    external: LinkCheckMode;
    reportOtherSchemes: LinkCheckMode;
    whitelist: WhitelistEntry[];
    userAgent: string;
    timeoutMs: number;
    maxRedirects: number;
    concurrency: number;
    cacheTTLms: number;
    headers?: Record<string, string>;
    externalChecker: 'fetch' | 'link-check' | ExternalChecker;
}

/** Default option values. */
export const DEFAULT_LINK_CHECK_OPTIONS: ResolvedOptions = {
    // 'ignore' means "do not check", so it is also the off switch:
    // internal:'ignore' + external:'ignore' disables the whole feature.
    // External defaults to 'ignore' because it is slow and flaky (opt-in);
    // internal is cheap so it defaults to 'warn'.
    internal: 'warn',
    external: 'ignore',
    reportOtherSchemes: 'ignore',
    whitelist: [],
    userAgent: 'Mozilla/5.0 (compatible; AkashaLinkCheck/1.0; +https://akashacms.com)',
    timeoutMs: 10000,
    maxRedirects: 8,
    concurrency: 10,
    cacheTTLms: 3600000,
    externalChecker: 'fetch',
};

/**
 * A dummy origin used to detect whether a URL is local.  `new URL(href, base)`
 * yields this origin only when `href` is a same-site path.
 */
const LOCAL_BASE = 'http://example.com';

/**
 * Determine whether a URL matches a whitelist entry.
 *
 * A string entry matches when the URL's host equals it or ends with `.entry`
 * (subdomain match), or when the whole URL starts with the entry (prefix/exact
 * URL match).  A RegExp entry is tested against the full URL.
 *
 * @param url The external URL under consideration.
 * @param whitelist The configured whitelist entries.
 */
export function isWhitelisted(url: string, whitelist: WhitelistEntry[]): boolean {
    if (!Array.isArray(whitelist) || whitelist.length === 0) return false;
    let host: string;
    try {
        host = new URL(url).host.toLowerCase();
    } catch {
        host = '';
    }
    for (const entry of whitelist) {
        if (entry instanceof RegExp) {
            if (entry.test(url)) return true;
        } else if (typeof entry === 'string') {
            const e = entry.toLowerCase();
            if (host && (host === e || host.endsWith('.' + e))) return true;
            if (url.toLowerCase().startsWith(e)) return true;
        }
    }
    return false;
}

/**
 * Classify an external HTTP status code into an {@link ExternalState}.
 *
 * @param status The HTTP status code (or `0` for a network-level failure).
 */
export function classifyStatus(status: number): ExternalState {
    if (status >= 200 && status < 400) return 'OK';
    if (status === 404 || status === 410) return 'BROKEN';
    if (status === 401 || status === 403 || status === 405
     || status === 429 || status === 999) return 'WARN';
    if (status >= 500) return 'WARN';
    if (status === 0) return 'BROKEN';
    return 'WARN';
}

/**
 * The built-in `fetch`-based external checker.  Uses HEAD, falling back to GET
 * when the server mishandles HEAD, and never downloads the response body.
 */
export const fetchExternalChecker: ExternalChecker = async (url, opts) => {
    const headers: Record<string, string> = {
        'user-agent': opts.userAgent,
        'accept': '*/*',
        ...(opts.headers ?? {})
    };

    const request = async (method: string, extra?: Record<string, string>): Promise<number> => {
        const ac = new AbortController();
        const signal = (AbortSignal as any).any
            ? (AbortSignal as any).any([ ac.signal, AbortSignal.timeout(opts.timeoutMs) ])
            : AbortSignal.timeout(opts.timeoutMs);
        try {
            const res = await fetch(url, {
                method,
                headers: { ...headers, ...(extra ?? {}) },
                redirect: 'follow',
                signal
            });
            // We only need the status; never download the body.
            ac.abort();
            return res.status;
        } catch {
            // DNS/TLS/timeout/connection failure.
            return 0;
        }
    };

    let status = await request('HEAD');
    // Many servers mishandle HEAD; retry with a cheap ranged GET.
    if (status === 0 || status === 400 || status === 403
     || status === 405 || status === 501) {
        status = await request('GET', { range: 'bytes=0-0' });
    }
    return { state: classifyStatus(status), status };
};

// Memoized reference to the lazily-imported `link-check` package.
let _linkCheckModule: any;

/**
 * Lazily load the site-author-installed `link-check` package.  It is not a
 * dependency of AkashaRender; the module is resolved from the project's
 * `node_modules` only when the author opts in.
 */
async function loadLinkCheck(): Promise<any> {
    if (_linkCheckModule) return _linkCheckModule;
    try {
        // The specifier is held in a variable so that TypeScript does not try
        // to resolve the optional `link-check` package at compile time; it is
        // an optional dependency the *site author* installs in their project.
        const specifier = 'link-check';
        const mod: any = await import(specifier);
        _linkCheckModule = mod.default ?? mod;
        return _linkCheckModule;
    } catch (err) {
        throw new Error(
            `checkLinks.externalChecker is 'link-check' but the 'link-check' `
          + `package is not installed in this project. Run `
          + `"npm install --save-dev link-check" or set externalChecker to `
          + `'fetch'. (${(err as Error).message})`
        );
    }
}

/**
 * Reset the memoized `link-check` module reference.  Intended for tests.
 */
export function _resetLinkCheckModule(): void {
    _linkCheckModule = undefined;
}

/**
 * An external checker that delegates to the `link-check` package, loaded on
 * demand via {@link loadLinkCheck}.
 */
export const linkCheckExternalChecker: ExternalChecker = async (url, opts) => {
    const linkCheck = await loadLinkCheck();
    const result: any = await new Promise((resolve, reject) => {
        linkCheck(url, {
            timeout: `${opts.timeoutMs}ms`,
            user_agent: opts.userAgent,
            headers: opts.headers,
            retryOn429: true,
            aliveStatusCodes: [ 200, 201, 202, 203, 204, /^3\d\d$/ ]
        }, (err: any, res: any) => err ? reject(err) : resolve(res));
    });
    const status = typeof result?.statusCode === 'number' ? result.statusCode : 0;
    if (result?.status === 'alive') return { state: 'OK', status };
    return { state: classifyStatus(status), status };
};

/**
 * Resolves an internal (local) link against the caches to determine whether it
 * refers to an existing rendered document or asset.
 *
 * Returns `true` when the link resolves, `false` when it is broken.
 */
export type InternalResolver = (absolutePath: string) => Promise<boolean>;

/**
 * Checks the links found in a rendered AkashaCMS site.
 *
 * Typical usage from the Built-in Plugin's `onSiteRendered`:
 * ```ts
 * const checker = new LinkChecker(config, akasha, options.checkLinks);
 * for (const { href, source } of discoveredLinks) {
 *     await checker.checkLink(href, source);
 * }
 * checker.finish();  // throws if any 'error'-mode failures were collected
 * ```
 */
export class LinkChecker {
    #config: Configuration;
    #akasha: any;
    #options: ResolvedOptions;
    #errors: LinkError[] = [];
    #externalCache = new Map<string, { result: ExternalResult, at: number }>();
    #checker: ExternalChecker;

    /**
     * @param config The AkashaRender configuration.
     * @param akasha The akasha API object (provides `filecache`).
     * @param options The link-checking options (see {@link LinkCheckOptions}).
     */
    constructor(config: Configuration, akasha: any, options?: LinkCheckOptions) {
        this.#config = config;
        this.#akasha = akasha;
        this.#options = LinkChecker.resolveOptions(options);
        this.#checker = LinkChecker.resolveChecker(this.#options.externalChecker);
    }

    /**
     * Merge user options over the defaults, validating each mode.
     */
    static resolveOptions(options?: LinkCheckOptions): ResolvedOptions {
        const o = Object.assign({}, DEFAULT_LINK_CHECK_OPTIONS, options ?? {});
        assertMode(o.internal, 'internal');
        assertMode(o.external, 'external');
        assertMode(o.reportOtherSchemes, 'reportOtherSchemes');
        if (!Array.isArray(o.whitelist)) {
            throw new Error(`checkLinks whitelist must be an array`);
        }
        return o;
    }

    /**
     * Map an `externalChecker` option value to an {@link ExternalChecker}.
     */
    static resolveChecker(
        which: 'fetch' | 'link-check' | ExternalChecker
    ): ExternalChecker {
        if (typeof which === 'function') return which;
        if (which === 'link-check') return linkCheckExternalChecker;
        return fetchExternalChecker;
    }

    /** Whether any checking is enabled (i.e. not all classes are `ignore`). */
    get enabled(): boolean {
        return this.#options.internal !== 'ignore'
            || this.#options.external !== 'ignore'
            || this.#options.reportOtherSchemes !== 'ignore';
    }

    /** The resolved options (read-only view). */
    get options(): Readonly<ResolvedOptions> { return this.#options; }

    /** The collected link errors. */
    get errors(): ReadonlyArray<LinkError> { return this.#errors; }

    /**
     * Determine whether a link is same-page (a bare `#fragment`), a local path,
     * an external `http(s)` URL, or another scheme.
     *
     * @param href The raw href/src value.
     * @param baseVpath The vpath of the containing document (used to resolve
     *   relative links).  Optional.
     */
    classify(href: string, baseVpath?: string): {
        kind: 'anchor' | 'internal' | 'external' | 'other-scheme';
        /** For internal links, the absolute site path. */
        absolutePath?: string;
        /** For external links, the normalized URL. */
        url?: string;
        /** For other-scheme links, the scheme (e.g. `mailto:`). */
        scheme?: string;
    } {
        const trimmed = (href ?? '').trim();
        if (trimmed === '' || trimmed === '#' || trimmed.startsWith('#')) {
            return { kind: 'anchor' };
        }

        let u: URL;
        try {
            u = new URL(trimmed, LOCAL_BASE);
        } catch {
            // Unparseable; treat as an other-scheme link so it can be logged.
            return { kind: 'other-scheme', scheme: '(unparseable)' };
        }

        if (u.protocol === 'http:' || u.protocol === 'https:') {
            if (u.origin === LOCAL_BASE) {
                // Local link.  Resolve the (possibly relative) href against the
                // containing document's vpath, mirroring AnchorCleanup which
                // calls resolveVpath(metadata.document.path, href).  Strip any
                // query/fragment first via the parsed pathname.
                const rawPath = trimmed.split('#')[0].split('?')[0];
                let absolutePath: string;
                if (baseVpath && rawPath.length > 0) {
                    absolutePath = resolveVpath(baseVpath, rawPath);
                } else {
                    absolutePath = u.pathname;
                }
                return { kind: 'internal', absolutePath };
            }
            // A real external http(s) URL.  Strip the fragment for checking.
            u.hash = '';
            return { kind: 'external', url: u.toString() };
        }

        // Any other scheme (mailto:, tel:, sms:, ftp:, javascript:, ...).
        return { kind: 'other-scheme', scheme: u.protocol };
    }

    /**
     * Check a single link discovered in a rendered document.
     *
     * @param href The raw href/src value.
     * @param source The rendered document (renderPath) the link was found in.
     * @param baseVpath The vpath of the containing document, used to resolve
     *   relative internal links.  Optional.
     */
    async checkLink(href: string, source?: string, baseVpath?: string): Promise<void> {
        const c = this.classify(href, baseVpath);
        switch (c.kind) {
            case 'anchor':
                return;
            case 'other-scheme':
                if (this.#options.reportOtherSchemes !== 'ignore') {
                    this.#report(this.#options.reportOtherSchemes, 'other-scheme',
                        href, source, `non-HTTP link (${c.scheme})`);
                }
                return;
            case 'internal':
                if (this.#options.internal === 'ignore') return;
                await this.#checkInternal(href, c.absolutePath, source);
                return;
            case 'external':
                if (this.#options.external === 'ignore') return;
                await this.#checkExternal(c.url, source);
                return;
        }
    }

    /**
     * Resolve an internal link against the assets and documents caches.  This
     * mirrors the resolution logic in `AnchorCleanup` (lib/built-in.ts): a link
     * that resolves to an asset, a document, a directory index, or a path a
     * plugin claims via `askPluginsLegitLocalHref` is valid.
     */
    async #checkInternal(href: string, absolutePath: string, source?: string): Promise<void> {
        const assets = this.#akasha?.filecache?.assetsCache;
        const documents = this.#akasha?.filecache?.documentsCache;

        // Assets.
        try {
            if (assets && await assets.find(absolutePath)) return;
        } catch { /* fall through */ }

        // Plugin-claimed local hrefs.
        if (typeof this.#config?.askPluginsLegitLocalHref === 'function'
         && this.#config.askPluginsLegitLocalHref(absolutePath)) {
            return;
        }

        // Documents.  A root or directory link maps to its index.html.
        let lookup = absolutePath === '/' ? '/index.html' : absolutePath;
        try {
            let found = documents ? await documents.find(lookup) : undefined;
            if (found && found.isDirectory) {
                found = await documents.find(path.join(lookup, 'index.html'));
            }
            if (found) return;
        } catch { /* fall through */ }

        this.#report(this.#options.internal, 'internal', href, source,
            `internal link not found (${absolutePath})`);
    }

    /**
     * Check an external `http(s)` link over the network, honoring the whitelist,
     * deduplication, and the TTL cache.
     */
    async #checkExternal(url: string, source?: string): Promise<void> {
        if (isWhitelisted(url, this.#options.whitelist)) return;

        // Deduplicate / TTL cache.
        const cached = this.#externalCache.get(url);
        const now = Date.now();
        let result: ExternalResult;
        if (cached && (now - cached.at) < this.#options.cacheTTLms) {
            result = cached.result;
        } else {
            result = await this.#checker(url, {
                userAgent: this.#options.userAgent,
                timeoutMs: this.#options.timeoutMs,
                maxRedirects: this.#options.maxRedirects,
                headers: this.#options.headers
            });
            this.#externalCache.set(url, { result, at: now });
        }

        if (result.state === 'OK') return;
        // A WARN result never escalates above 'warn'; a BROKEN result uses the
        // configured external mode.
        const mode = result.state === 'WARN'
            ? (this.#options.external === 'ignore' ? 'ignore' : 'warn')
            : this.#options.external;
        this.#report(mode, 'external', url, source,
            `external link ${result.state.toLowerCase()} (HTTP ${result.status})`);
    }

    /**
     * Central severity handler.  `ignore` does nothing; `warn` logs; `error`
     * logs and collects the failure for {@link finish}; `fatal` logs and throws
     * immediately.
     */
    #report(mode: LinkCheckMode, kind: LinkKind, href: string,
            source: string | undefined, detail: string): void {
        if (mode === 'ignore') return;
        const where = source ? ` in ${source}` : '';
        const message = `Link check (${kind}): ${detail} — ${href}${where}`;
        if (mode === 'warn') {
            console.warn(`WARNING: ${message}`);
            return;
        }
        // error and fatal both record the failure.
        this.#errors.push({ kind, href, source, detail });
        if (mode === 'fatal') {
            console.error(`ERROR: ${message}`);
            throw new Error(message);
        }
        // error: log now, throw later in finish().
        console.error(`ERROR: ${message}`);
    }

    /**
     * Called after all links have been checked.  If any `error`-mode failures
     * were collected, throws a single Error summarizing them, which causes the
     * render run to fail.
     */
    finish(): void {
        if (this.#errors.length === 0) return;
        const lines = this.#errors.map(e => {
            const where = e.source ? ` in ${e.source}` : '';
            return `  - ${e.kind}: ${e.detail} — ${e.href}${where}`;
        });
        throw new Error(
            `Link check found ${this.#errors.length} bad link(s):\n${lines.join('\n')}`
        );
    }
}
