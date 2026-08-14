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
export declare const LINK_CHECK_MODES: ReadonlyArray<LinkCheckMode>;
/**
 * Throw if `mode` is not a valid {@link LinkCheckMode}.
 *
 * @param mode The value to validate.
 * @param label A short label naming the option, for the error message.
 */
export declare function assertMode(mode: any, label?: string): asserts mode is LinkCheckMode;
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
export type ExternalChecker = (url: string, opts: ExternalCheckOptions) => Promise<ExternalResult>;
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
export declare const DEFAULT_LINK_CHECK_OPTIONS: ResolvedOptions;
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
export declare function isWhitelisted(url: string, whitelist: WhitelistEntry[]): boolean;
/**
 * Classify an external HTTP status code into an {@link ExternalState}.
 *
 * @param status The HTTP status code (or `0` for a network-level failure).
 */
export declare function classifyStatus(status: number): ExternalState;
/**
 * The built-in `fetch`-based external checker.  Uses HEAD, falling back to GET
 * when the server mishandles HEAD, and never downloads the response body.
 */
export declare const fetchExternalChecker: ExternalChecker;
/**
 * Reset the memoized `link-check` module reference.  Intended for tests.
 */
export declare function _resetLinkCheckModule(): void;
/**
 * An external checker that delegates to the `link-check` package, loaded on
 * demand via {@link loadLinkCheck}.
 */
export declare const linkCheckExternalChecker: ExternalChecker;
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
export declare class LinkChecker {
    #private;
    /**
     * @param config The AkashaRender configuration.
     * @param akasha The akasha API object (provides `filecache`).
     * @param options The link-checking options (see {@link LinkCheckOptions}).
     */
    constructor(config: Configuration, akasha: any, options?: LinkCheckOptions);
    /**
     * Merge user options over the defaults, validating each mode.
     */
    static resolveOptions(options?: LinkCheckOptions): ResolvedOptions;
    /**
     * Map an `externalChecker` option value to an {@link ExternalChecker}.
     */
    static resolveChecker(which: 'fetch' | 'link-check' | ExternalChecker): ExternalChecker;
    /** Whether any checking is enabled (i.e. not all classes are `ignore`). */
    get enabled(): boolean;
    /** The resolved options (read-only view). */
    get options(): Readonly<ResolvedOptions>;
    /** The collected link errors. */
    get errors(): ReadonlyArray<LinkError>;
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
    };
    /**
     * Check a single link discovered in a rendered document.
     *
     * @param href The raw href/src value.
     * @param source The rendered document (renderPath) the link was found in.
     * @param baseVpath The vpath of the containing document, used to resolve
     *   relative internal links.  Optional.
     */
    checkLink(href: string, source?: string, baseVpath?: string): Promise<void>;
    /**
     * Called after all links have been checked.  If any `error`-mode failures
     * were collected, throws a single Error summarizing them, which causes the
     * render run to fail.
     */
    finish(): void;
}
export {};
//# sourceMappingURL=link-checker.d.ts.map