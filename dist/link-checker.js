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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LinkChecker_instances, _LinkChecker_config, _LinkChecker_akasha, _LinkChecker_options, _LinkChecker_errors, _LinkChecker_externalCache, _LinkChecker_checker, _LinkChecker_checkInternal, _LinkChecker_checkExternal, _LinkChecker_report;
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
/** The set of valid {@link LinkCheckMode} values. */
export const LINK_CHECK_MODES = ['ignore', 'warn', 'error', 'fatal'];
/**
 * Throw if `mode` is not a valid {@link LinkCheckMode}.
 *
 * @param mode The value to validate.
 * @param label A short label naming the option, for the error message.
 */
export function assertMode(mode, label = 'mode') {
    if (!LINK_CHECK_MODES.includes(mode)) {
        throw new Error(`checkLinks ${label} must be one of ${LINK_CHECK_MODES.join(', ')}, got ${JSON.stringify(mode)}`);
    }
}
/** Default option values. */
export const DEFAULT_LINK_CHECK_OPTIONS = {
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
export function isWhitelisted(url, whitelist) {
    if (!Array.isArray(whitelist) || whitelist.length === 0)
        return false;
    let host;
    try {
        host = new URL(url).host.toLowerCase();
    }
    catch {
        host = '';
    }
    for (const entry of whitelist) {
        if (entry instanceof RegExp) {
            if (entry.test(url))
                return true;
        }
        else if (typeof entry === 'string') {
            const e = entry.toLowerCase();
            if (host && (host === e || host.endsWith('.' + e)))
                return true;
            if (url.toLowerCase().startsWith(e))
                return true;
        }
    }
    return false;
}
/**
 * Classify an external HTTP status code into an {@link ExternalState}.
 *
 * @param status The HTTP status code (or `0` for a network-level failure).
 */
export function classifyStatus(status) {
    if (status >= 200 && status < 400)
        return 'OK';
    if (status === 404 || status === 410)
        return 'BROKEN';
    if (status === 401 || status === 403 || status === 405
        || status === 429 || status === 999)
        return 'WARN';
    if (status >= 500)
        return 'WARN';
    if (status === 0)
        return 'BROKEN';
    return 'WARN';
}
/**
 * The built-in `fetch`-based external checker.  Uses HEAD, falling back to GET
 * when the server mishandles HEAD, and never downloads the response body.
 */
export const fetchExternalChecker = async (url, opts) => {
    const headers = {
        'user-agent': opts.userAgent,
        'accept': '*/*',
        ...(opts.headers ?? {})
    };
    const request = async (method, extra) => {
        const ac = new AbortController();
        const signal = AbortSignal.any
            ? AbortSignal.any([ac.signal, AbortSignal.timeout(opts.timeoutMs)])
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
        }
        catch {
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
let _linkCheckModule;
/**
 * Lazily load the site-author-installed `link-check` package.  It is not a
 * dependency of AkashaRender; the module is resolved from the project's
 * `node_modules` only when the author opts in.
 */
async function loadLinkCheck() {
    if (_linkCheckModule)
        return _linkCheckModule;
    try {
        // The specifier is held in a variable so that TypeScript does not try
        // to resolve the optional `link-check` package at compile time; it is
        // an optional dependency the *site author* installs in their project.
        const specifier = 'link-check';
        const mod = await import(specifier);
        _linkCheckModule = mod.default ?? mod;
        return _linkCheckModule;
    }
    catch (err) {
        throw new Error(`checkLinks.externalChecker is 'link-check' but the 'link-check' `
            + `package is not installed in this project. Run `
            + `"npm install --save-dev link-check" or set externalChecker to `
            + `'fetch'. (${err.message})`);
    }
}
/**
 * Reset the memoized `link-check` module reference.  Intended for tests.
 */
export function _resetLinkCheckModule() {
    _linkCheckModule = undefined;
}
/**
 * An external checker that delegates to the `link-check` package, loaded on
 * demand via {@link loadLinkCheck}.
 */
export const linkCheckExternalChecker = async (url, opts) => {
    const linkCheck = await loadLinkCheck();
    const result = await new Promise((resolve, reject) => {
        linkCheck(url, {
            timeout: `${opts.timeoutMs}ms`,
            user_agent: opts.userAgent,
            headers: opts.headers,
            retryOn429: true,
            aliveStatusCodes: [200, 201, 202, 203, 204, /^3\d\d$/]
        }, (err, res) => err ? reject(err) : resolve(res));
    });
    const status = typeof result?.statusCode === 'number' ? result.statusCode : 0;
    if (result?.status === 'alive')
        return { state: 'OK', status };
    return { state: classifyStatus(status), status };
};
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
    /**
     * @param config The AkashaRender configuration.
     * @param akasha The akasha API object (provides `filecache`).
     * @param options The link-checking options (see {@link LinkCheckOptions}).
     */
    constructor(config, akasha, options) {
        _LinkChecker_instances.add(this);
        _LinkChecker_config.set(this, void 0);
        _LinkChecker_akasha.set(this, void 0);
        _LinkChecker_options.set(this, void 0);
        _LinkChecker_errors.set(this, []);
        _LinkChecker_externalCache.set(this, new Map());
        _LinkChecker_checker.set(this, void 0);
        __classPrivateFieldSet(this, _LinkChecker_config, config, "f");
        __classPrivateFieldSet(this, _LinkChecker_akasha, akasha, "f");
        __classPrivateFieldSet(this, _LinkChecker_options, LinkChecker.resolveOptions(options), "f");
        __classPrivateFieldSet(this, _LinkChecker_checker, LinkChecker.resolveChecker(__classPrivateFieldGet(this, _LinkChecker_options, "f").externalChecker), "f");
    }
    /**
     * Merge user options over the defaults, validating each mode.
     */
    static resolveOptions(options) {
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
    static resolveChecker(which) {
        if (typeof which === 'function')
            return which;
        if (which === 'link-check')
            return linkCheckExternalChecker;
        return fetchExternalChecker;
    }
    /** Whether any checking is enabled (i.e. not all classes are `ignore`). */
    get enabled() {
        return __classPrivateFieldGet(this, _LinkChecker_options, "f").internal !== 'ignore'
            || __classPrivateFieldGet(this, _LinkChecker_options, "f").external !== 'ignore'
            || __classPrivateFieldGet(this, _LinkChecker_options, "f").reportOtherSchemes !== 'ignore';
    }
    /** The resolved options (read-only view). */
    get options() { return __classPrivateFieldGet(this, _LinkChecker_options, "f"); }
    /** The collected link errors. */
    get errors() { return __classPrivateFieldGet(this, _LinkChecker_errors, "f"); }
    /**
     * Determine whether a link is same-page (a bare `#fragment`), a local path,
     * an external `http(s)` URL, or another scheme.
     *
     * @param href The raw href/src value.
     * @param baseVpath The vpath of the containing document (used to resolve
     *   relative links).  Optional.
     */
    classify(href, baseVpath) {
        const trimmed = (href ?? '').trim();
        if (trimmed === '' || trimmed === '#' || trimmed.startsWith('#')) {
            return { kind: 'anchor' };
        }
        let u;
        try {
            u = new URL(trimmed, LOCAL_BASE);
        }
        catch {
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
                let absolutePath;
                if (baseVpath && rawPath.length > 0) {
                    absolutePath = resolveVpath(baseVpath, rawPath);
                }
                else {
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
    async checkLink(href, source, baseVpath) {
        const c = this.classify(href, baseVpath);
        switch (c.kind) {
            case 'anchor':
                return;
            case 'other-scheme':
                if (__classPrivateFieldGet(this, _LinkChecker_options, "f").reportOtherSchemes !== 'ignore') {
                    __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_report).call(this, __classPrivateFieldGet(this, _LinkChecker_options, "f").reportOtherSchemes, 'other-scheme', href, source, `non-HTTP link (${c.scheme})`);
                }
                return;
            case 'internal':
                if (__classPrivateFieldGet(this, _LinkChecker_options, "f").internal === 'ignore')
                    return;
                await __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_checkInternal).call(this, href, c.absolutePath, source);
                return;
            case 'external':
                if (__classPrivateFieldGet(this, _LinkChecker_options, "f").external === 'ignore')
                    return;
                await __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_checkExternal).call(this, c.url, source);
                return;
        }
    }
    /**
     * Called after all links have been checked.  If any `error`-mode failures
     * were collected, throws a single Error summarizing them, which causes the
     * render run to fail.
     */
    finish() {
        if (__classPrivateFieldGet(this, _LinkChecker_errors, "f").length === 0)
            return;
        const lines = __classPrivateFieldGet(this, _LinkChecker_errors, "f").map(e => {
            const where = e.source ? ` in ${e.source}` : '';
            return `  - ${e.kind}: ${e.detail} — ${e.href}${where}`;
        });
        throw new Error(`Link check found ${__classPrivateFieldGet(this, _LinkChecker_errors, "f").length} bad link(s):\n${lines.join('\n')}`);
    }
}
_LinkChecker_config = new WeakMap(), _LinkChecker_akasha = new WeakMap(), _LinkChecker_options = new WeakMap(), _LinkChecker_errors = new WeakMap(), _LinkChecker_externalCache = new WeakMap(), _LinkChecker_checker = new WeakMap(), _LinkChecker_instances = new WeakSet(), _LinkChecker_checkInternal = 
/**
 * Resolve an internal link against the assets and documents caches.  This
 * mirrors the resolution logic in `AnchorCleanup` (lib/built-in.ts): a link
 * that resolves to an asset, a document, a directory index, or a path a
 * plugin claims via `askPluginsLegitLocalHref` is valid.
 */
async function _LinkChecker_checkInternal(href, absolutePath, source) {
    const assets = __classPrivateFieldGet(this, _LinkChecker_akasha, "f")?.filecache?.assetsCache;
    const documents = __classPrivateFieldGet(this, _LinkChecker_akasha, "f")?.filecache?.documentsCache;
    // Assets.
    try {
        if (assets && await assets.find(absolutePath))
            return;
    }
    catch { /* fall through */ }
    // Plugin-claimed local hrefs.
    if (typeof __classPrivateFieldGet(this, _LinkChecker_config, "f")?.askPluginsLegitLocalHref === 'function'
        && __classPrivateFieldGet(this, _LinkChecker_config, "f").askPluginsLegitLocalHref(absolutePath)) {
        return;
    }
    // Documents.  A root or directory link maps to its index.html.
    let lookup = absolutePath === '/' ? '/index.html' : absolutePath;
    try {
        let found = documents ? await documents.find(lookup) : undefined;
        if (found && found.isDirectory) {
            found = await documents.find(path.join(lookup, 'index.html'));
        }
        if (found)
            return;
    }
    catch { /* fall through */ }
    __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_report).call(this, __classPrivateFieldGet(this, _LinkChecker_options, "f").internal, 'internal', href, source, `internal link not found (${absolutePath})`);
}, _LinkChecker_checkExternal = 
/**
 * Check an external `http(s)` link over the network, honoring the whitelist,
 * deduplication, and the TTL cache.
 */
async function _LinkChecker_checkExternal(url, source) {
    if (isWhitelisted(url, __classPrivateFieldGet(this, _LinkChecker_options, "f").whitelist))
        return;
    // Deduplicate / TTL cache.
    const cached = __classPrivateFieldGet(this, _LinkChecker_externalCache, "f").get(url);
    const now = Date.now();
    let result;
    if (cached && (now - cached.at) < __classPrivateFieldGet(this, _LinkChecker_options, "f").cacheTTLms) {
        result = cached.result;
    }
    else {
        result = await __classPrivateFieldGet(this, _LinkChecker_checker, "f").call(this, url, {
            userAgent: __classPrivateFieldGet(this, _LinkChecker_options, "f").userAgent,
            timeoutMs: __classPrivateFieldGet(this, _LinkChecker_options, "f").timeoutMs,
            maxRedirects: __classPrivateFieldGet(this, _LinkChecker_options, "f").maxRedirects,
            headers: __classPrivateFieldGet(this, _LinkChecker_options, "f").headers
        });
        __classPrivateFieldGet(this, _LinkChecker_externalCache, "f").set(url, { result, at: now });
    }
    if (result.state === 'OK')
        return;
    // A WARN result never escalates above 'warn'; a BROKEN result uses the
    // configured external mode.
    const mode = result.state === 'WARN'
        ? (__classPrivateFieldGet(this, _LinkChecker_options, "f").external === 'ignore' ? 'ignore' : 'warn')
        : __classPrivateFieldGet(this, _LinkChecker_options, "f").external;
    __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_report).call(this, mode, 'external', url, source, `external link ${result.state.toLowerCase()} (HTTP ${result.status})`);
}, _LinkChecker_report = function _LinkChecker_report(mode, kind, href, source, detail) {
    if (mode === 'ignore')
        return;
    const where = source ? ` in ${source}` : '';
    const message = `Link check (${kind}): ${detail} — ${href}${where}`;
    if (mode === 'warn') {
        console.warn(`WARNING: ${message}`);
        return;
    }
    // error and fatal both record the failure.
    __classPrivateFieldGet(this, _LinkChecker_errors, "f").push({ kind, href, source, detail });
    if (mode === 'fatal') {
        console.error(`ERROR: ${message}`);
        throw new Error(message);
    }
    // error: log now, throw later in finish().
    console.error(`ERROR: ${message}`);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay1jaGVja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2xpbmstY2hlY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFlBQVksQ0FBQztBQWExQyxxREFBcUQ7QUFDckQsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQ3ZCLENBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFFLENBQUM7QUFFN0M7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLElBQVMsRUFBRSxRQUFnQixNQUFNO0lBQ3hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNuQyxNQUFNLElBQUksS0FBSyxDQUNYLGNBQWMsS0FBSyxtQkFBbUIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDbkcsQ0FBQztJQUNOLENBQUM7QUFDTCxDQUFDO0FBMEZELDZCQUE2QjtBQUM3QixNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBb0I7SUFDdkQsK0RBQStEO0lBQy9ELG9FQUFvRTtJQUNwRSx1RUFBdUU7SUFDdkUsOENBQThDO0lBQzlDLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLFFBQVEsRUFBRSxRQUFRO0lBQ2xCLGtCQUFrQixFQUFFLFFBQVE7SUFDNUIsU0FBUyxFQUFFLEVBQUU7SUFDYixTQUFTLEVBQUUsdUVBQXVFO0lBQ2xGLFNBQVMsRUFBRSxLQUFLO0lBQ2hCLFlBQVksRUFBRSxDQUFDO0lBQ2YsV0FBVyxFQUFFLEVBQUU7SUFDZixVQUFVLEVBQUUsT0FB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QUFBLElBQUksbURBQVEsTUFBWixJQUFJLEVBQVMsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUN0QyxpQkFBaUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsVUFBVSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUMvRSxDQUFDLHFEQU9PLElBQW1CLEVBQUUsSUFBYyxFQUFFLElBQVksRUFDakQsTUFBMEIsRUFBRSxNQUFjO0lBQzlDLElBQUksSUFBSSxLQUFLLFFBQVE7UUFBRSxPQUFPO0lBQzlCLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBQzVDLE1BQU0sT0FBTyxHQUFHLGVBQWUsSUFBSSxNQUFNLE1BQU0sTUFBTSxJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUM7SUFDcEUsSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFLENBQUM7UUFDbEIsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDcEMsT0FBTztJQUNYLENBQUM7SUFDRCwyQ0FBMkM7SUFDM0MsdUJBQUEsSUFBSSwyQkFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDbEQsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUM7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBQ0QsMkNBQTJDO0lBQzNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBMaW5rIENoZWNrZXJcbiAqXG4gKiBWYWxpZGF0ZXMgdGhlIGxpbmtzIGluIGEgcmVuZGVyZWQgQWthc2hhQ01TIHNpdGUuICBJbnRlcm5hbCAobG9jYWwpIGxpbmtzIGFyZVxuICogcmVzb2x2ZWQgYWdhaW5zdCB0aGUgZG9jdW1lbnRzIGFuZCBhc3NldHMgY2FjaGVzOyBleHRlcm5hbCBgaHR0cDpgL2BodHRwczpgXG4gKiBsaW5rcyBhcmUgdmFsaWRhdGVkIG92ZXIgdGhlIG5ldHdvcmsuICBFdmVyeSBvdGhlciBVUkkgc2NoZW1lIChgbWFpbHRvOmAsXG4gKiBgdGVsOmAsIC4uLikgaXMgdHJlYXRlZCBhcyBhIG5vbi1jaGVja2FibGUgXCJvdGhlciBzY2hlbWVcIiBsaW5rLlxuICpcbiAqIEVhY2ggY2xhc3Mgb2YgbGluayAoaW50ZXJuYWwsIGV4dGVybmFsLCBvdGhlci1zY2hlbWUpIGhhcyBhIHNldmVyaXR5XG4gKiB7QGxpbmsgTGlua0NoZWNrTW9kZX06IGBpZ25vcmVgIHR1cm5zIHRoYXQgY2xhc3Mgb2YgY2hlY2tpbmcgb2ZmIGVudGlyZWx5LFxuICogYHdhcm5gIGxvZ3MgYSBub3RpY2UsIGBlcnJvcmAgY29sbGVjdHMgZmFpbHVyZXMgYW5kIGZhaWxzIHRoZSBidWlsZCBhdCB0aGVcbiAqIGVuZCwgYW5kIGBmYXRhbGAgdGhyb3dzIGF0IHRoZSBmaXJzdCBiYWQgbGluay5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyB1c2VkIGJ5IHRoZSBCdWlsdC1pbiBQbHVnaW4gKGBsaWIvYnVpbHQtaW4udHNgKSwgd2hpY2ggb3ducyB0aGVcbiAqIGNvbmZpZ3VyYXRpb24gc3VyZmFjZSBhbmQgZHJpdmVzIHRoZSB3aG9sZS1zaXRlIHNjYW4gZnJvbSBgb25TaXRlUmVuZGVyZWRgLlxuICpcbiAqIEBtb2R1bGUgbGluay1jaGVja2VyXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHJlc29sdmVWcGF0aCB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5cbi8qKlxuICogU2V2ZXJpdHkgZm9yIGEgY2xhc3Mgb2YgbGluayBjaGVjay5cbiAqXG4gKiAtIGBpZ25vcmVgIOKAlCBkbyBub3QgY2hlY2sgdGhpcyBjbGFzcyBvZiBsaW5rIGF0IGFsbCAodGhlIG9mZiBzd2l0Y2gpLlxuICogLSBgd2FybmAgICDigJQgbG9nIGEgbm90aWNlIGFuZCBjb250aW51ZS5cbiAqIC0gYGVycm9yYCAg4oCUIGNvbGxlY3QgdGhlIGZhaWx1cmU7IHtAbGluayBMaW5rQ2hlY2tlci5maW5pc2h9IHRocm93cyBhdCB0aGUgZW5kLlxuICogLSBgZmF0YWxgICDigJQgdGhyb3cgaW1tZWRpYXRlbHkgYXQgdGhlIHBvaW50IG9mIGRldGVjdGlvbi5cbiAqL1xuZXhwb3J0IHR5cGUgTGlua0NoZWNrTW9kZSA9ICdpZ25vcmUnIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCc7XG5cbi8qKiBUaGUgc2V0IG9mIHZhbGlkIHtAbGluayBMaW5rQ2hlY2tNb2RlfSB2YWx1ZXMuICovXG5leHBvcnQgY29uc3QgTElOS19DSEVDS19NT0RFUzogUmVhZG9ubHlBcnJheTxMaW5rQ2hlY2tNb2RlPlxuICAgID0gWyAnaWdub3JlJywgJ3dhcm4nLCAnZXJyb3InLCAnZmF0YWwnIF07XG5cbi8qKlxuICogVGhyb3cgaWYgYG1vZGVgIGlzIG5vdCBhIHZhbGlkIHtAbGluayBMaW5rQ2hlY2tNb2RlfS5cbiAqXG4gKiBAcGFyYW0gbW9kZSBUaGUgdmFsdWUgdG8gdmFsaWRhdGUuXG4gKiBAcGFyYW0gbGFiZWwgQSBzaG9ydCBsYWJlbCBuYW1pbmcgdGhlIG9wdGlvbiwgZm9yIHRoZSBlcnJvciBtZXNzYWdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TW9kZShtb2RlOiBhbnksIGxhYmVsOiBzdHJpbmcgPSAnbW9kZScpOiBhc3NlcnRzIG1vZGUgaXMgTGlua0NoZWNrTW9kZSB7XG4gICAgaWYgKCFMSU5LX0NIRUNLX01PREVTLmluY2x1ZGVzKG1vZGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBjaGVja0xpbmtzICR7bGFiZWx9IG11c3QgYmUgb25lIG9mICR7TElOS19DSEVDS19NT0RFUy5qb2luKCcsICcpfSwgZ290ICR7SlNPTi5zdHJpbmdpZnkobW9kZSl9YFxuICAgICAgICApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBIHdoaXRlbGlzdCBlbnRyeTogYSBkb21haW4vVVJMIHByZWZpeCBzdHJpbmcsIG9yIGEgUmVnRXhwIG1hdGNoZWQgYWdhaW5zdCB0aGVcbiAqIGZ1bGwgVVJMLlxuICovXG5leHBvcnQgdHlwZSBXaGl0ZWxpc3RFbnRyeSA9IHN0cmluZyB8IFJlZ0V4cDtcblxuLyoqXG4gKiBUaGUgY2xhc3NpZmljYXRpb24gb2YgYW4gZXh0ZXJuYWwgVVJMIGNoZWNrLlxuICpcbiAqIC0gYE9LYCAgICAg4oCUIHRoZSBsaW5rIGlzIGFsaXZlLlxuICogLSBgQlJPS0VOYCDigJQgdGhlIGxpbmsgaXMgZGVhZCAoNDA0LzQxMCwgRE5TL1RMUy9jb25uZWN0aW9uIGZhaWx1cmUpLlxuICogLSBgV0FSTmAgICDigJQgYW1iaWd1b3VzICg0MDEvNDAzLzQwNS80MjkvOTk5LzV4eCk7IHRoZSByZXNvdXJjZSBsaWtlbHkgZXhpc3RzXG4gKiAgIGJ1dCB0aGUgY2hlY2tlciB3YXMgYmxvY2tlZCBvciB0aHJvdHRsZWQuXG4gKi9cbmV4cG9ydCB0eXBlIEV4dGVybmFsU3RhdGUgPSAnT0snIHwgJ0JST0tFTicgfCAnV0FSTic7XG5cbi8qKiBUaGUgcmVzdWx0IG9mIGFuIGV4dGVybmFsIHBlci1VUkwgY2hlY2suICovXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVybmFsUmVzdWx0IHtcbiAgICBzdGF0ZTogRXh0ZXJuYWxTdGF0ZTtcbiAgICAvKiogVGhlIEhUVFAgc3RhdHVzIGNvZGUsIG9yIGAwYCB3aGVuIG5vIEhUVFAgcmVzcG9uc2Ugd2FzIG9idGFpbmVkLiAqL1xuICAgIHN0YXR1czogbnVtYmVyO1xufVxuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gYW4ge0BsaW5rIEV4dGVybmFsQ2hlY2tlcn0uICovXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVybmFsQ2hlY2tPcHRpb25zIHtcbiAgICB1c2VyQWdlbnQ6IHN0cmluZztcbiAgICB0aW1lb3V0TXM6IG51bWJlcjtcbiAgICBtYXhSZWRpcmVjdHM6IG51bWJlcjtcbiAgICAvKiogRXh0cmEgSFRUUCBoZWFkZXJzIChlLmcuIGF1dGhvcml6YXRpb24pLiAqL1xuICAgIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG4vKipcbiAqIEEgcGVyLVVSTCBleHRlcm5hbCBjaGVja2VyLiAgQm90aCB0aGUgYnVpbHQtaW4gYGZldGNoYCBpbXBsZW1lbnRhdGlvbiBhbmQgdGhlXG4gKiBvcHRpb25hbCBgbGluay1jaGVja2AgYWRhcHRlciBzYXRpc2Z5IHRoaXMgc2lnbmF0dXJlLCBzbyB0aGUgc3Vycm91bmRpbmdcbiAqIGhhcm5lc3MgaXMgaW5kZXBlbmRlbnQgb2Ygd2hpY2ggb25lIGlzIGFjdGl2ZS5cbiAqL1xuZXhwb3J0IHR5cGUgRXh0ZXJuYWxDaGVja2VyXG4gICAgPSAodXJsOiBzdHJpbmcsIG9wdHM6IEV4dGVybmFsQ2hlY2tPcHRpb25zKSA9PiBQcm9taXNlPEV4dGVybmFsUmVzdWx0PjtcblxuLyoqIFRoZSBraW5kIG9mIGxpbmsgYSByZXBvcnQgY29uY2VybnMuICovXG5leHBvcnQgdHlwZSBMaW5rS2luZCA9ICdpbnRlcm5hbCcgfCAnZXh0ZXJuYWwnIHwgJ290aGVyLXNjaGVtZSc7XG5cbi8qKiBBIHNpbmdsZSByZWNvcmRlZCBsaW5rIHByb2JsZW0uICovXG5leHBvcnQgaW50ZXJmYWNlIExpbmtFcnJvciB7XG4gICAga2luZDogTGlua0tpbmQ7XG4gICAgaHJlZjogc3RyaW5nO1xuICAgIC8qKiBUaGUgcmVuZGVyZWQgZG9jdW1lbnQgKHJlbmRlclBhdGgpIHRoZSBsaW5rIHdhcyBmb3VuZCBpbiwgaWYga25vd24uICovXG4gICAgc291cmNlPzogc3RyaW5nO1xuICAgIGRldGFpbDogc3RyaW5nO1xufVxuXG4vKiogQ29uZmlndXJhdGlvbiBmb3IgdGhlIHtAbGluayBMaW5rQ2hlY2tlcn0uICovXG5leHBvcnQgaW50ZXJmYWNlIExpbmtDaGVja09wdGlvbnMge1xuICAgIGludGVybmFsPzogTGlua0NoZWNrTW9kZTtcbiAgICBleHRlcm5hbD86IExpbmtDaGVja01vZGU7XG4gICAgcmVwb3J0T3RoZXJTY2hlbWVzPzogTGlua0NoZWNrTW9kZTtcbiAgICB3aGl0ZWxpc3Q/OiBXaGl0ZWxpc3RFbnRyeVtdO1xuICAgIHVzZXJBZ2VudD86IHN0cmluZztcbiAgICB0aW1lb3V0TXM/OiBudW1iZXI7XG4gICAgbWF4UmVkaXJlY3RzPzogbnVtYmVyO1xuICAgIGNvbmN1cnJlbmN5PzogbnVtYmVyO1xuICAgIGNhY2hlVFRMbXM/OiBudW1iZXI7XG4gICAgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgLyoqXG4gICAgICogV2hpY2ggZXh0ZXJuYWwgY2hlY2tlciB0byB1c2U6IGAnZmV0Y2gnYCAoZGVmYXVsdCwgemVybyBkZXBlbmRlbmN5KSBvclxuICAgICAqIGAnbGluay1jaGVjaydgIChsYXp5LWxvYWRzIHRoZSBzaXRlLWF1dGhvci1pbnN0YWxsZWQgYGxpbmstY2hlY2tgXG4gICAgICogcGFja2FnZSkuICBBbHRlcm5hdGl2ZWx5LCBhIGN1c3RvbSB7QGxpbmsgRXh0ZXJuYWxDaGVja2VyfSBmdW5jdGlvbiBtYXlcbiAgICAgKiBiZSBzdXBwbGllZCBkaXJlY3RseSAodXNlZCBieSB0ZXN0cykuXG4gICAgICovXG4gICAgZXh0ZXJuYWxDaGVja2VyPzogJ2ZldGNoJyB8ICdsaW5rLWNoZWNrJyB8IEV4dGVybmFsQ2hlY2tlcjtcbn1cblxuLyoqIFRoZSBmdWxseS1yZXNvbHZlZCBvcHRpb25zIGFmdGVyIGRlZmF1bHRzIGFyZSBhcHBsaWVkLiAqL1xuaW50ZXJmYWNlIFJlc29sdmVkT3B0aW9ucyB7XG4gICAgaW50ZXJuYWw6IExpbmtDaGVja01vZGU7XG4gICAgZXh0ZXJuYWw6IExpbmtDaGVja01vZGU7XG4gICAgcmVwb3J0T3RoZXJTY2hlbWVzOiBMaW5rQ2hlY2tNb2RlO1xuICAgIHdoaXRlbGlzdDogV2hpdGVsaXN0RW50cnlbXTtcbiAgICB1c2VyQWdlbnQ6IHN0cmluZztcbiAgICB0aW1lb3V0TXM6IG51bWJlcjtcbiAgICBtYXhSZWRpcmVjdHM6IG51bWJlcjtcbiAgICBjb25jdXJyZW5jeTogbnVtYmVyO1xuICAgIGNhY2hlVFRMbXM6IG51bWJlcjtcbiAgICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBleHRlcm5hbENoZWNrZXI6ICdmZXRjaCcgfCAnbGluay1jaGVjaycgfCBFeHRlcm5hbENoZWNrZXI7XG59XG5cbi8qKiBEZWZhdWx0IG9wdGlvbiB2YWx1ZXMuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9MSU5LX0NIRUNLX09QVElPTlM6IFJlc29sdmVkT3B0aW9ucyA9IHtcbiAgICAvLyAnaWdub3JlJyBtZWFucyBcImRvIG5vdCBjaGVja1wiLCBzbyBpdCBpcyBhbHNvIHRoZSBvZmYgc3dpdGNoOlxuICAgIC8vIGludGVybmFsOidpZ25vcmUnICsgZXh0ZXJuYWw6J2lnbm9yZScgZGlzYWJsZXMgdGhlIHdob2xlIGZlYXR1cmUuXG4gICAgLy8gRXh0ZXJuYWwgZGVmYXVsdHMgdG8gJ2lnbm9yZScgYmVjYXVzZSBpdCBpcyBzbG93IGFuZCBmbGFreSAob3B0LWluKTtcbiAgICAvLyBpbnRlcm5hbCBpcyBjaGVhcCBzbyBpdCBkZWZhdWx0cyB0byAnd2FybicuXG4gICAgaW50ZXJuYWw6ICd3YXJuJyxcbiAgICBleHRlcm5hbDogJ2lnbm9yZScsXG4gICAgcmVwb3J0T3RoZXJTY2hlbWVzOiAnaWdub3JlJyxcbiAgICB3aGl0ZWxpc3Q6IFtdLFxuICAgIHVzZXJBZ2VudDogJ01vemlsbGEvNS4wIChjb21wYXRpYmxlOyBBa2FzaGFMaW5rQ2hlY2svMS4wOyAraHR0cHM6Ly9ha2FzaGFjbXMuY29tKScsXG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBtYXhSZWRpcmVjdHM6IDgsXG4gICAgY29uY3VycmVuY3k6IDEwLFxuICAgIGNhY2hlVFRMbXM6IDM2MDAwMDAsXG4gICAgZXh0ZXJuYWxDaGVja2VyOiAnZmV0Y2gnLFxufTtcblxuLyoqXG4gKiBBIGR1bW15IG9yaWdpbiB1c2VkIHRvIGRldGVjdCB3aGV0aGVyIGEgVVJMIGlzIGxvY2FsLiAgYG5ldyBVUkwoaHJlZiwgYmFzZSlgXG4gKiB5aWVsZHMgdGhpcyBvcmlnaW4gb25seSB3aGVuIGBocmVmYCBpcyBhIHNhbWUtc2l0ZSBwYXRoLlxuICovXG5jb25zdCBMT0NBTF9CQVNFID0gJ2h0dHA6Ly9leGFtcGxlLmNvbSc7XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBVUkwgbWF0Y2hlcyBhIHdoaXRlbGlzdCBlbnRyeS5cbiAqXG4gKiBBIHN0cmluZyBlbnRyeSBtYXRjaGVzIHdoZW4gdGhlIFVSTCdzIGhvc3QgZXF1YWxzIGl0IG9yIGVuZHMgd2l0aCBgLmVudHJ5YFxuICogKHN1YmRvbWFpbiBtYXRjaCksIG9yIHdoZW4gdGhlIHdob2xlIFVSTCBzdGFydHMgd2l0aCB0aGUgZW50cnkgKHByZWZpeC9leGFjdFxuICogVVJMIG1hdGNoKS4gIEEgUmVnRXhwIGVudHJ5IGlzIHRlc3RlZCBhZ2FpbnN0IHRoZSBmdWxsIFVSTC5cbiAqXG4gKiBAcGFyYW0gdXJsIFRoZSBleHRlcm5hbCBVUkwgdW5kZXIgY29uc2lkZXJhdGlvbi5cbiAqIEBwYXJhbSB3aGl0ZWxpc3QgVGhlIGNvbmZpZ3VyZWQgd2hpdGVsaXN0IGVudHJpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1doaXRlbGlzdGVkKHVybDogc3RyaW5nLCB3aGl0ZWxpc3Q6IFdoaXRlbGlzdEVudHJ5W10pOiBib29sZWFuIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkod2hpdGVsaXN0KSB8fCB3aGl0ZWxpc3QubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgbGV0IGhvc3Q6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgICBob3N0ID0gbmV3IFVSTCh1cmwpLmhvc3QudG9Mb3dlckNhc2UoKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgaG9zdCA9ICcnO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHdoaXRlbGlzdCkge1xuICAgICAgICBpZiAoZW50cnkgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIGlmIChlbnRyeS50ZXN0KHVybCkpIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IGUgPSBlbnRyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGhvc3QgJiYgKGhvc3QgPT09IGUgfHwgaG9zdC5lbmRzV2l0aCgnLicgKyBlKSkpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYgKHVybC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoZSkpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDbGFzc2lmeSBhbiBleHRlcm5hbCBIVFRQIHN0YXR1cyBjb2RlIGludG8gYW4ge0BsaW5rIEV4dGVybmFsU3RhdGV9LlxuICpcbiAqIEBwYXJhbSBzdGF0dXMgVGhlIEhUVFAgc3RhdHVzIGNvZGUgKG9yIGAwYCBmb3IgYSBuZXR3b3JrLWxldmVsIGZhaWx1cmUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnlTdGF0dXMoc3RhdHVzOiBudW1iZXIpOiBFeHRlcm5hbFN0YXRlIHtcbiAgICBpZiAoc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCA0MDApIHJldHVybiAnT0snO1xuICAgIGlmIChzdGF0dXMgPT09IDQwNCB8fCBzdGF0dXMgPT09IDQxMCkgcmV0dXJuICdCUk9LRU4nO1xuICAgIGlmIChzdGF0dXMgPT09IDQwMSB8fCBzdGF0dXMgPT09IDQwMyB8fCBzdGF0dXMgPT09IDQwNVxuICAgICB8fCBzdGF0dXMgPT09IDQyOSB8fCBzdGF0dXMgPT09IDk5OSkgcmV0dXJuICdXQVJOJztcbiAgICBpZiAoc3RhdHVzID49IDUwMCkgcmV0dXJuICdXQVJOJztcbiAgICBpZiAoc3RhdHVzID09PSAwKSByZXR1cm4gJ0JST0tFTic7XG4gICAgcmV0dXJuICdXQVJOJztcbn1cblxuLyoqXG4gKiBUaGUgYnVpbHQtaW4gYGZldGNoYC1iYXNlZCBleHRlcm5hbCBjaGVja2VyLiAgVXNlcyBIRUFELCBmYWxsaW5nIGJhY2sgdG8gR0VUXG4gKiB3aGVuIHRoZSBzZXJ2ZXIgbWlzaGFuZGxlcyBIRUFELCBhbmQgbmV2ZXIgZG93bmxvYWRzIHRoZSByZXNwb25zZSBib2R5LlxuICovXG5leHBvcnQgY29uc3QgZmV0Y2hFeHRlcm5hbENoZWNrZXI6IEV4dGVybmFsQ2hlY2tlciA9IGFzeW5jICh1cmwsIG9wdHMpID0+IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICAndXNlci1hZ2VudCc6IG9wdHMudXNlckFnZW50LFxuICAgICAgICAnYWNjZXB0JzogJyovKicsXG4gICAgICAgIC4uLihvcHRzLmhlYWRlcnMgPz8ge30pXG4gICAgfTtcblxuICAgIGNvbnN0IHJlcXVlc3QgPSBhc3luYyAobWV0aG9kOiBzdHJpbmcsIGV4dHJhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IFByb21pc2U8bnVtYmVyPiA9PiB7XG4gICAgICAgIGNvbnN0IGFjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICBjb25zdCBzaWduYWwgPSAoQWJvcnRTaWduYWwgYXMgYW55KS5hbnlcbiAgICAgICAgICAgID8gKEFib3J0U2lnbmFsIGFzIGFueSkuYW55KFsgYWMuc2lnbmFsLCBBYm9ydFNpZ25hbC50aW1lb3V0KG9wdHMudGltZW91dE1zKSBdKVxuICAgICAgICAgICAgOiBBYm9ydFNpZ25hbC50aW1lb3V0KG9wdHMudGltZW91dE1zKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmhlYWRlcnMsIC4uLihleHRyYSA/PyB7fSkgfSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsXG4gICAgICAgICAgICAgICAgc2lnbmFsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgbmVlZCB0aGUgc3RhdHVzOyBuZXZlciBkb3dubG9hZCB0aGUgYm9keS5cbiAgICAgICAgICAgIGFjLmFib3J0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cztcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBETlMvVExTL3RpbWVvdXQvY29ubmVjdGlvbiBmYWlsdXJlLlxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IHN0YXR1cyA9IGF3YWl0IHJlcXVlc3QoJ0hFQUQnKTtcbiAgICAvLyBNYW55IHNlcnZlcnMgbWlzaGFuZGxlIEhFQUQ7IHJldHJ5IHdpdGggYSBjaGVhcCByYW5nZWQgR0VULlxuICAgIGlmIChzdGF0dXMgPT09IDAgfHwgc3RhdHVzID09PSA0MDAgfHwgc3RhdHVzID09PSA0MDNcbiAgICAgfHwgc3RhdHVzID09PSA0MDUgfHwgc3RhdHVzID09PSA1MDEpIHtcbiAgICAgICAgc3RhdHVzID0gYXdhaXQgcmVxdWVzdCgnR0VUJywgeyByYW5nZTogJ2J5dGVzPTAtMCcgfSk7XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXRlOiBjbGFzc2lmeVN0YXR1cyhzdGF0dXMpLCBzdGF0dXMgfTtcbn07XG5cbi8vIE1lbW9pemVkIHJlZmVyZW5jZSB0byB0aGUgbGF6aWx5LWltcG9ydGVkIGBsaW5rLWNoZWNrYCBwYWNrYWdlLlxubGV0IF9saW5rQ2hlY2tNb2R1bGU6IGFueTtcblxuLyoqXG4gKiBMYXppbHkgbG9hZCB0aGUgc2l0ZS1hdXRob3ItaW5zdGFsbGVkIGBsaW5rLWNoZWNrYCBwYWNrYWdlLiAgSXQgaXMgbm90IGFcbiAqIGRlcGVuZGVuY3kgb2YgQWthc2hhUmVuZGVyOyB0aGUgbW9kdWxlIGlzIHJlc29sdmVkIGZyb20gdGhlIHByb2plY3Qnc1xuICogYG5vZGVfbW9kdWxlc2Agb25seSB3aGVuIHRoZSBhdXRob3Igb3B0cyBpbi5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZExpbmtDaGVjaygpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmIChfbGlua0NoZWNrTW9kdWxlKSByZXR1cm4gX2xpbmtDaGVja01vZHVsZTtcbiAgICB0cnkge1xuICAgICAgICAvLyBUaGUgc3BlY2lmaWVyIGlzIGhlbGQgaW4gYSB2YXJpYWJsZSBzbyB0aGF0IFR5cGVTY3JpcHQgZG9lcyBub3QgdHJ5XG4gICAgICAgIC8vIHRvIHJlc29sdmUgdGhlIG9wdGlvbmFsIGBsaW5rLWNoZWNrYCBwYWNrYWdlIGF0IGNvbXBpbGUgdGltZTsgaXQgaXNcbiAgICAgICAgLy8gYW4gb3B0aW9uYWwgZGVwZW5kZW5jeSB0aGUgKnNpdGUgYXV0aG9yKiBpbnN0YWxscyBpbiB0aGVpciBwcm9qZWN0LlxuICAgICAgICBjb25zdCBzcGVjaWZpZXIgPSAnbGluay1jaGVjayc7XG4gICAgICAgIGNvbnN0IG1vZDogYW55ID0gYXdhaXQgaW1wb3J0KHNwZWNpZmllcik7XG4gICAgICAgIF9saW5rQ2hlY2tNb2R1bGUgPSBtb2QuZGVmYXVsdCA/PyBtb2Q7XG4gICAgICAgIHJldHVybiBfbGlua0NoZWNrTW9kdWxlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgY2hlY2tMaW5rcy5leHRlcm5hbENoZWNrZXIgaXMgJ2xpbmstY2hlY2snIGJ1dCB0aGUgJ2xpbmstY2hlY2snIGBcbiAgICAgICAgICArIGBwYWNrYWdlIGlzIG5vdCBpbnN0YWxsZWQgaW4gdGhpcyBwcm9qZWN0LiBSdW4gYFxuICAgICAgICAgICsgYFwibnBtIGluc3RhbGwgLS1zYXZlLWRldiBsaW5rLWNoZWNrXCIgb3Igc2V0IGV4dGVybmFsQ2hlY2tlciB0byBgXG4gICAgICAgICAgKyBgJ2ZldGNoJy4gKCR7KGVyciBhcyBFcnJvcikubWVzc2FnZX0pYFxuICAgICAgICApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXNldCB0aGUgbWVtb2l6ZWQgYGxpbmstY2hlY2tgIG1vZHVsZSByZWZlcmVuY2UuICBJbnRlbmRlZCBmb3IgdGVzdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfcmVzZXRMaW5rQ2hlY2tNb2R1bGUoKTogdm9pZCB7XG4gICAgX2xpbmtDaGVja01vZHVsZSA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBBbiBleHRlcm5hbCBjaGVja2VyIHRoYXQgZGVsZWdhdGVzIHRvIHRoZSBgbGluay1jaGVja2AgcGFja2FnZSwgbG9hZGVkIG9uXG4gKiBkZW1hbmQgdmlhIHtAbGluayBsb2FkTGlua0NoZWNrfS5cbiAqL1xuZXhwb3J0IGNvbnN0IGxpbmtDaGVja0V4dGVybmFsQ2hlY2tlcjogRXh0ZXJuYWxDaGVja2VyID0gYXN5bmMgKHVybCwgb3B0cykgPT4ge1xuICAgIGNvbnN0IGxpbmtDaGVjayA9IGF3YWl0IGxvYWRMaW5rQ2hlY2soKTtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGlua0NoZWNrKHVybCwge1xuICAgICAgICAgICAgdGltZW91dDogYCR7b3B0cy50aW1lb3V0TXN9bXNgLFxuICAgICAgICAgICAgdXNlcl9hZ2VudDogb3B0cy51c2VyQWdlbnQsXG4gICAgICAgICAgICBoZWFkZXJzOiBvcHRzLmhlYWRlcnMsXG4gICAgICAgICAgICByZXRyeU9uNDI5OiB0cnVlLFxuICAgICAgICAgICAgYWxpdmVTdGF0dXNDb2RlczogWyAyMDAsIDIwMSwgMjAyLCAyMDMsIDIwNCwgL14zXFxkXFxkJC8gXVxuICAgICAgICB9LCAoZXJyOiBhbnksIHJlczogYW55KSA9PiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUocmVzKSk7XG4gICAgfSk7XG4gICAgY29uc3Qgc3RhdHVzID0gdHlwZW9mIHJlc3VsdD8uc3RhdHVzQ29kZSA9PT0gJ251bWJlcicgPyByZXN1bHQuc3RhdHVzQ29kZSA6IDA7XG4gICAgaWYgKHJlc3VsdD8uc3RhdHVzID09PSAnYWxpdmUnKSByZXR1cm4geyBzdGF0ZTogJ09LJywgc3RhdHVzIH07XG4gICAgcmV0dXJuIHsgc3RhdGU6IGNsYXNzaWZ5U3RhdHVzKHN0YXR1cyksIHN0YXR1cyB9O1xufTtcblxuLyoqXG4gKiBSZXNvbHZlcyBhbiBpbnRlcm5hbCAobG9jYWwpIGxpbmsgYWdhaW5zdCB0aGUgY2FjaGVzIHRvIGRldGVybWluZSB3aGV0aGVyIGl0XG4gKiByZWZlcnMgdG8gYW4gZXhpc3RpbmcgcmVuZGVyZWQgZG9jdW1lbnQgb3IgYXNzZXQuXG4gKlxuICogUmV0dXJucyBgdHJ1ZWAgd2hlbiB0aGUgbGluayByZXNvbHZlcywgYGZhbHNlYCB3aGVuIGl0IGlzIGJyb2tlbi5cbiAqL1xuZXhwb3J0IHR5cGUgSW50ZXJuYWxSZXNvbHZlciA9IChhYnNvbHV0ZVBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxib29sZWFuPjtcblxuLyoqXG4gKiBDaGVja3MgdGhlIGxpbmtzIGZvdW5kIGluIGEgcmVuZGVyZWQgQWthc2hhQ01TIHNpdGUuXG4gKlxuICogVHlwaWNhbCB1c2FnZSBmcm9tIHRoZSBCdWlsdC1pbiBQbHVnaW4ncyBgb25TaXRlUmVuZGVyZWRgOlxuICogYGBgdHNcbiAqIGNvbnN0IGNoZWNrZXIgPSBuZXcgTGlua0NoZWNrZXIoY29uZmlnLCBha2FzaGEsIG9wdGlvbnMuY2hlY2tMaW5rcyk7XG4gKiBmb3IgKGNvbnN0IHsgaHJlZiwgc291cmNlIH0gb2YgZGlzY292ZXJlZExpbmtzKSB7XG4gKiAgICAgYXdhaXQgY2hlY2tlci5jaGVja0xpbmsoaHJlZiwgc291cmNlKTtcbiAqIH1cbiAqIGNoZWNrZXIuZmluaXNoKCk7ICAvLyB0aHJvd3MgaWYgYW55ICdlcnJvcictbW9kZSBmYWlsdXJlcyB3ZXJlIGNvbGxlY3RlZFxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBMaW5rQ2hlY2tlciB7XG4gICAgI2NvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgICAjYWthc2hhOiBhbnk7XG4gICAgI29wdGlvbnM6IFJlc29sdmVkT3B0aW9ucztcbiAgICAjZXJyb3JzOiBMaW5rRXJyb3JbXSA9IFtdO1xuICAgICNleHRlcm5hbENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHsgcmVzdWx0OiBFeHRlcm5hbFJlc3VsdCwgYXQ6IG51bWJlciB9PigpO1xuICAgICNjaGVja2VyOiBFeHRlcm5hbENoZWNrZXI7XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gY29uZmlnIFRoZSBBa2FzaGFSZW5kZXIgY29uZmlndXJhdGlvbi5cbiAgICAgKiBAcGFyYW0gYWthc2hhIFRoZSBha2FzaGEgQVBJIG9iamVjdCAocHJvdmlkZXMgYGZpbGVjYWNoZWApLlxuICAgICAqIEBwYXJhbSBvcHRpb25zIFRoZSBsaW5rLWNoZWNraW5nIG9wdGlvbnMgKHNlZSB7QGxpbmsgTGlua0NoZWNrT3B0aW9uc30pLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogQ29uZmlndXJhdGlvbiwgYWthc2hhOiBhbnksIG9wdGlvbnM/OiBMaW5rQ2hlY2tPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy4jYWthc2hhID0gYWthc2hhO1xuICAgICAgICB0aGlzLiNvcHRpb25zID0gTGlua0NoZWNrZXIucmVzb2x2ZU9wdGlvbnMob3B0aW9ucyk7XG4gICAgICAgIHRoaXMuI2NoZWNrZXIgPSBMaW5rQ2hlY2tlci5yZXNvbHZlQ2hlY2tlcih0aGlzLiNvcHRpb25zLmV4dGVybmFsQ2hlY2tlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWVyZ2UgdXNlciBvcHRpb25zIG92ZXIgdGhlIGRlZmF1bHRzLCB2YWxpZGF0aW5nIGVhY2ggbW9kZS5cbiAgICAgKi9cbiAgICBzdGF0aWMgcmVzb2x2ZU9wdGlvbnMob3B0aW9ucz86IExpbmtDaGVja09wdGlvbnMpOiBSZXNvbHZlZE9wdGlvbnMge1xuICAgICAgICBjb25zdCBvID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9MSU5LX0NIRUNLX09QVElPTlMsIG9wdGlvbnMgPz8ge30pO1xuICAgICAgICBhc3NlcnRNb2RlKG8uaW50ZXJuYWwsICdpbnRlcm5hbCcpO1xuICAgICAgICBhc3NlcnRNb2RlKG8uZXh0ZXJuYWwsICdleHRlcm5hbCcpO1xuICAgICAgICBhc3NlcnRNb2RlKG8ucmVwb3J0T3RoZXJTY2hlbWVzLCAncmVwb3J0T3RoZXJTY2hlbWVzJyk7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShvLndoaXRlbGlzdCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY2hlY2tMaW5rcyB3aGl0ZWxpc3QgbXVzdCBiZSBhbiBhcnJheWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1hcCBhbiBgZXh0ZXJuYWxDaGVja2VyYCBvcHRpb24gdmFsdWUgdG8gYW4ge0BsaW5rIEV4dGVybmFsQ2hlY2tlcn0uXG4gICAgICovXG4gICAgc3RhdGljIHJlc29sdmVDaGVja2VyKFxuICAgICAgICB3aGljaDogJ2ZldGNoJyB8ICdsaW5rLWNoZWNrJyB8IEV4dGVybmFsQ2hlY2tlclxuICAgICk6IEV4dGVybmFsQ2hlY2tlciB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2hpY2ggPT09ICdmdW5jdGlvbicpIHJldHVybiB3aGljaDtcbiAgICAgICAgaWYgKHdoaWNoID09PSAnbGluay1jaGVjaycpIHJldHVybiBsaW5rQ2hlY2tFeHRlcm5hbENoZWNrZXI7XG4gICAgICAgIHJldHVybiBmZXRjaEV4dGVybmFsQ2hlY2tlcjtcbiAgICB9XG5cbiAgICAvKiogV2hldGhlciBhbnkgY2hlY2tpbmcgaXMgZW5hYmxlZCAoaS5lLiBub3QgYWxsIGNsYXNzZXMgYXJlIGBpZ25vcmVgKS4gKi9cbiAgICBnZXQgZW5hYmxlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI29wdGlvbnMuaW50ZXJuYWwgIT09ICdpZ25vcmUnXG4gICAgICAgICAgICB8fCB0aGlzLiNvcHRpb25zLmV4dGVybmFsICE9PSAnaWdub3JlJ1xuICAgICAgICAgICAgfHwgdGhpcy4jb3B0aW9ucy5yZXBvcnRPdGhlclNjaGVtZXMgIT09ICdpZ25vcmUnO1xuICAgIH1cblxuICAgIC8qKiBUaGUgcmVzb2x2ZWQgb3B0aW9ucyAocmVhZC1vbmx5IHZpZXcpLiAqL1xuICAgIGdldCBvcHRpb25zKCk6IFJlYWRvbmx5PFJlc29sdmVkT3B0aW9ucz4geyByZXR1cm4gdGhpcy4jb3B0aW9uczsgfVxuXG4gICAgLyoqIFRoZSBjb2xsZWN0ZWQgbGluayBlcnJvcnMuICovXG4gICAgZ2V0IGVycm9ycygpOiBSZWFkb25seUFycmF5PExpbmtFcnJvcj4geyByZXR1cm4gdGhpcy4jZXJyb3JzOyB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciBhIGxpbmsgaXMgc2FtZS1wYWdlIChhIGJhcmUgYCNmcmFnbWVudGApLCBhIGxvY2FsIHBhdGgsXG4gICAgICogYW4gZXh0ZXJuYWwgYGh0dHAocylgIFVSTCwgb3IgYW5vdGhlciBzY2hlbWUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaHJlZiBUaGUgcmF3IGhyZWYvc3JjIHZhbHVlLlxuICAgICAqIEBwYXJhbSBiYXNlVnBhdGggVGhlIHZwYXRoIG9mIHRoZSBjb250YWluaW5nIGRvY3VtZW50ICh1c2VkIHRvIHJlc29sdmVcbiAgICAgKiAgIHJlbGF0aXZlIGxpbmtzKS4gIE9wdGlvbmFsLlxuICAgICAqL1xuICAgIGNsYXNzaWZ5KGhyZWY6IHN0cmluZywgYmFzZVZwYXRoPzogc3RyaW5nKToge1xuICAgICAgICBraW5kOiAnYW5jaG9yJyB8ICdpbnRlcm5hbCcgfCAnZXh0ZXJuYWwnIHwgJ290aGVyLXNjaGVtZSc7XG4gICAgICAgIC8qKiBGb3IgaW50ZXJuYWwgbGlua3MsIHRoZSBhYnNvbHV0ZSBzaXRlIHBhdGguICovXG4gICAgICAgIGFic29sdXRlUGF0aD86IHN0cmluZztcbiAgICAgICAgLyoqIEZvciBleHRlcm5hbCBsaW5rcywgdGhlIG5vcm1hbGl6ZWQgVVJMLiAqL1xuICAgICAgICB1cmw/OiBzdHJpbmc7XG4gICAgICAgIC8qKiBGb3Igb3RoZXItc2NoZW1lIGxpbmtzLCB0aGUgc2NoZW1lIChlLmcuIGBtYWlsdG86YCkuICovXG4gICAgICAgIHNjaGVtZT86IHN0cmluZztcbiAgICB9IHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IChocmVmID8/ICcnKS50cmltKCk7XG4gICAgICAgIGlmICh0cmltbWVkID09PSAnJyB8fCB0cmltbWVkID09PSAnIycgfHwgdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICAgIHJldHVybiB7IGtpbmQ6ICdhbmNob3InIH07XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdTogVVJMO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdSA9IG5ldyBVUkwodHJpbW1lZCwgTE9DQUxfQkFTRSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gVW5wYXJzZWFibGU7IHRyZWF0IGFzIGFuIG90aGVyLXNjaGVtZSBsaW5rIHNvIGl0IGNhbiBiZSBsb2dnZWQuXG4gICAgICAgICAgICByZXR1cm4geyBraW5kOiAnb3RoZXItc2NoZW1lJywgc2NoZW1lOiAnKHVucGFyc2VhYmxlKScgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1LnByb3RvY29sID09PSAnaHR0cDonIHx8IHUucHJvdG9jb2wgPT09ICdodHRwczonKSB7XG4gICAgICAgICAgICBpZiAodS5vcmlnaW4gPT09IExPQ0FMX0JBU0UpIHtcbiAgICAgICAgICAgICAgICAvLyBMb2NhbCBsaW5rLiAgUmVzb2x2ZSB0aGUgKHBvc3NpYmx5IHJlbGF0aXZlKSBocmVmIGFnYWluc3QgdGhlXG4gICAgICAgICAgICAgICAgLy8gY29udGFpbmluZyBkb2N1bWVudCdzIHZwYXRoLCBtaXJyb3JpbmcgQW5jaG9yQ2xlYW51cCB3aGljaFxuICAgICAgICAgICAgICAgIC8vIGNhbGxzIHJlc29sdmVWcGF0aChtZXRhZGF0YS5kb2N1bWVudC5wYXRoLCBocmVmKS4gIFN0cmlwIGFueVxuICAgICAgICAgICAgICAgIC8vIHF1ZXJ5L2ZyYWdtZW50IGZpcnN0IHZpYSB0aGUgcGFyc2VkIHBhdGhuYW1lLlxuICAgICAgICAgICAgICAgIGNvbnN0IHJhd1BhdGggPSB0cmltbWVkLnNwbGl0KCcjJylbMF0uc3BsaXQoJz8nKVswXTtcbiAgICAgICAgICAgICAgICBsZXQgYWJzb2x1dGVQYXRoOiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgaWYgKGJhc2VWcGF0aCAmJiByYXdQYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcmVzb2x2ZVZwYXRoKGJhc2VWcGF0aCwgcmF3UGF0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gdS5wYXRobmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsga2luZDogJ2ludGVybmFsJywgYWJzb2x1dGVQYXRoIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBBIHJlYWwgZXh0ZXJuYWwgaHR0cChzKSBVUkwuICBTdHJpcCB0aGUgZnJhZ21lbnQgZm9yIGNoZWNraW5nLlxuICAgICAgICAgICAgdS5oYXNoID0gJyc7XG4gICAgICAgICAgICByZXR1cm4geyBraW5kOiAnZXh0ZXJuYWwnLCB1cmw6IHUudG9TdHJpbmcoKSB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW55IG90aGVyIHNjaGVtZSAobWFpbHRvOiwgdGVsOiwgc21zOiwgZnRwOiwgamF2YXNjcmlwdDosIC4uLikuXG4gICAgICAgIHJldHVybiB7IGtpbmQ6ICdvdGhlci1zY2hlbWUnLCBzY2hlbWU6IHUucHJvdG9jb2wgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBhIHNpbmdsZSBsaW5rIGRpc2NvdmVyZWQgaW4gYSByZW5kZXJlZCBkb2N1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBocmVmIFRoZSByYXcgaHJlZi9zcmMgdmFsdWUuXG4gICAgICogQHBhcmFtIHNvdXJjZSBUaGUgcmVuZGVyZWQgZG9jdW1lbnQgKHJlbmRlclBhdGgpIHRoZSBsaW5rIHdhcyBmb3VuZCBpbi5cbiAgICAgKiBAcGFyYW0gYmFzZVZwYXRoIFRoZSB2cGF0aCBvZiB0aGUgY29udGFpbmluZyBkb2N1bWVudCwgdXNlZCB0byByZXNvbHZlXG4gICAgICogICByZWxhdGl2ZSBpbnRlcm5hbCBsaW5rcy4gIE9wdGlvbmFsLlxuICAgICAqL1xuICAgIGFzeW5jIGNoZWNrTGluayhocmVmOiBzdHJpbmcsIHNvdXJjZT86IHN0cmluZywgYmFzZVZwYXRoPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGMgPSB0aGlzLmNsYXNzaWZ5KGhyZWYsIGJhc2VWcGF0aCk7XG4gICAgICAgIHN3aXRjaCAoYy5raW5kKSB7XG4gICAgICAgICAgICBjYXNlICdhbmNob3InOlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ290aGVyLXNjaGVtZSc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuI29wdGlvbnMucmVwb3J0T3RoZXJTY2hlbWVzICE9PSAnaWdub3JlJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNyZXBvcnQodGhpcy4jb3B0aW9ucy5yZXBvcnRPdGhlclNjaGVtZXMsICdvdGhlci1zY2hlbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZiwgc291cmNlLCBgbm9uLUhUVFAgbGluayAoJHtjLnNjaGVtZX0pYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ2ludGVybmFsJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy4jb3B0aW9ucy5pbnRlcm5hbCA9PT0gJ2lnbm9yZScpIHJldHVybjtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLiNjaGVja0ludGVybmFsKGhyZWYsIGMuYWJzb2x1dGVQYXRoLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy4jb3B0aW9ucy5leHRlcm5hbCA9PT0gJ2lnbm9yZScpIHJldHVybjtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLiNjaGVja0V4dGVybmFsKGMudXJsLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc29sdmUgYW4gaW50ZXJuYWwgbGluayBhZ2FpbnN0IHRoZSBhc3NldHMgYW5kIGRvY3VtZW50cyBjYWNoZXMuICBUaGlzXG4gICAgICogbWlycm9ycyB0aGUgcmVzb2x1dGlvbiBsb2dpYyBpbiBgQW5jaG9yQ2xlYW51cGAgKGxpYi9idWlsdC1pbi50cyk6IGEgbGlua1xuICAgICAqIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXNzZXQsIGEgZG9jdW1lbnQsIGEgZGlyZWN0b3J5IGluZGV4LCBvciBhIHBhdGggYVxuICAgICAqIHBsdWdpbiBjbGFpbXMgdmlhIGBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWZgIGlzIHZhbGlkLlxuICAgICAqL1xuICAgIGFzeW5jICNjaGVja0ludGVybmFsKGhyZWY6IHN0cmluZywgYWJzb2x1dGVQYXRoOiBzdHJpbmcsIHNvdXJjZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLiNha2FzaGE/LmZpbGVjYWNoZT8uYXNzZXRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuI2FrYXNoYT8uZmlsZWNhY2hlPy5kb2N1bWVudHNDYWNoZTtcblxuICAgICAgICAvLyBBc3NldHMuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoYXNzZXRzICYmIGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCkpIHJldHVybjtcbiAgICAgICAgfSBjYXRjaCB7IC8qIGZhbGwgdGhyb3VnaCAqLyB9XG5cbiAgICAgICAgLy8gUGx1Z2luLWNsYWltZWQgbG9jYWwgaHJlZnMuXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy4jY29uZmlnPy5hc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICYmIHRoaXMuI2NvbmZpZy5hc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoYWJzb2x1dGVQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRG9jdW1lbnRzLiAgQSByb290IG9yIGRpcmVjdG9yeSBsaW5rIG1hcHMgdG8gaXRzIGluZGV4Lmh0bWwuXG4gICAgICAgIGxldCBsb29rdXAgPSBhYnNvbHV0ZVBhdGggPT09ICcvJyA/ICcvaW5kZXguaHRtbCcgOiBhYnNvbHV0ZVBhdGg7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgZm91bmQgPSBkb2N1bWVudHMgPyBhd2FpdCBkb2N1bWVudHMuZmluZChsb29rdXApIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGZvdW5kICYmIGZvdW5kLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoLmpvaW4obG9va3VwLCAnaW5kZXguaHRtbCcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZCkgcmV0dXJuO1xuICAgICAgICB9IGNhdGNoIHsgLyogZmFsbCB0aHJvdWdoICovIH1cblxuICAgICAgICB0aGlzLiNyZXBvcnQodGhpcy4jb3B0aW9ucy5pbnRlcm5hbCwgJ2ludGVybmFsJywgaHJlZiwgc291cmNlLFxuICAgICAgICAgICAgYGludGVybmFsIGxpbmsgbm90IGZvdW5kICgke2Fic29sdXRlUGF0aH0pYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgYW4gZXh0ZXJuYWwgYGh0dHAocylgIGxpbmsgb3ZlciB0aGUgbmV0d29yaywgaG9ub3JpbmcgdGhlIHdoaXRlbGlzdCxcbiAgICAgKiBkZWR1cGxpY2F0aW9uLCBhbmQgdGhlIFRUTCBjYWNoZS5cbiAgICAgKi9cbiAgICBhc3luYyAjY2hlY2tFeHRlcm5hbCh1cmw6IHN0cmluZywgc291cmNlPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmIChpc1doaXRlbGlzdGVkKHVybCwgdGhpcy4jb3B0aW9ucy53aGl0ZWxpc3QpKSByZXR1cm47XG5cbiAgICAgICAgLy8gRGVkdXBsaWNhdGUgLyBUVEwgY2FjaGUuXG4gICAgICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuI2V4dGVybmFsQ2FjaGUuZ2V0KHVybCk7XG4gICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgICAgIGxldCByZXN1bHQ6IEV4dGVybmFsUmVzdWx0O1xuICAgICAgICBpZiAoY2FjaGVkICYmIChub3cgLSBjYWNoZWQuYXQpIDwgdGhpcy4jb3B0aW9ucy5jYWNoZVRUTG1zKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBjYWNoZWQucmVzdWx0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy4jY2hlY2tlcih1cmwsIHtcbiAgICAgICAgICAgICAgICB1c2VyQWdlbnQ6IHRoaXMuI29wdGlvbnMudXNlckFnZW50LFxuICAgICAgICAgICAgICAgIHRpbWVvdXRNczogdGhpcy4jb3B0aW9ucy50aW1lb3V0TXMsXG4gICAgICAgICAgICAgICAgbWF4UmVkaXJlY3RzOiB0aGlzLiNvcHRpb25zLm1heFJlZGlyZWN0cyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB0aGlzLiNvcHRpb25zLmhlYWRlcnNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy4jZXh0ZXJuYWxDYWNoZS5zZXQodXJsLCB7IHJlc3VsdCwgYXQ6IG5vdyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQuc3RhdGUgPT09ICdPSycpIHJldHVybjtcbiAgICAgICAgLy8gQSBXQVJOIHJlc3VsdCBuZXZlciBlc2NhbGF0ZXMgYWJvdmUgJ3dhcm4nOyBhIEJST0tFTiByZXN1bHQgdXNlcyB0aGVcbiAgICAgICAgLy8gY29uZmlndXJlZCBleHRlcm5hbCBtb2RlLlxuICAgICAgICBjb25zdCBtb2RlID0gcmVzdWx0LnN0YXRlID09PSAnV0FSTidcbiAgICAgICAgICAgID8gKHRoaXMuI29wdGlvbnMuZXh0ZXJuYWwgPT09ICdpZ25vcmUnID8gJ2lnbm9yZScgOiAnd2FybicpXG4gICAgICAgICAgICA6IHRoaXMuI29wdGlvbnMuZXh0ZXJuYWw7XG4gICAgICAgIHRoaXMuI3JlcG9ydChtb2RlLCAnZXh0ZXJuYWwnLCB1cmwsIHNvdXJjZSxcbiAgICAgICAgICAgIGBleHRlcm5hbCBsaW5rICR7cmVzdWx0LnN0YXRlLnRvTG93ZXJDYXNlKCl9IChIVFRQICR7cmVzdWx0LnN0YXR1c30pYCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2VudHJhbCBzZXZlcml0eSBoYW5kbGVyLiAgYGlnbm9yZWAgZG9lcyBub3RoaW5nOyBgd2FybmAgbG9nczsgYGVycm9yYFxuICAgICAqIGxvZ3MgYW5kIGNvbGxlY3RzIHRoZSBmYWlsdXJlIGZvciB7QGxpbmsgZmluaXNofTsgYGZhdGFsYCBsb2dzIGFuZCB0aHJvd3NcbiAgICAgKiBpbW1lZGlhdGVseS5cbiAgICAgKi9cbiAgICAjcmVwb3J0KG1vZGU6IExpbmtDaGVja01vZGUsIGtpbmQ6IExpbmtLaW5kLCBocmVmOiBzdHJpbmcsXG4gICAgICAgICAgICBzb3VyY2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgZGV0YWlsOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgaWYgKG1vZGUgPT09ICdpZ25vcmUnKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHdoZXJlID0gc291cmNlID8gYCBpbiAke3NvdXJjZX1gIDogJyc7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgTGluayBjaGVjayAoJHtraW5kfSk6ICR7ZGV0YWlsfSDigJQgJHtocmVmfSR7d2hlcmV9YDtcbiAgICAgICAgaWYgKG1vZGUgPT09ICd3YXJuJykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBXQVJOSU5HOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXJyb3IgYW5kIGZhdGFsIGJvdGggcmVjb3JkIHRoZSBmYWlsdXJlLlxuICAgICAgICB0aGlzLiNlcnJvcnMucHVzaCh7IGtpbmQsIGhyZWYsIHNvdXJjZSwgZGV0YWlsIH0pO1xuICAgICAgICBpZiAobW9kZSA9PT0gJ2ZhdGFsJykge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRVJST1I6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlcnJvcjogbG9nIG5vdywgdGhyb3cgbGF0ZXIgaW4gZmluaXNoKCkuXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVSUk9SOiAke21lc3NhZ2V9YCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2FsbGVkIGFmdGVyIGFsbCBsaW5rcyBoYXZlIGJlZW4gY2hlY2tlZC4gIElmIGFueSBgZXJyb3JgLW1vZGUgZmFpbHVyZXNcbiAgICAgKiB3ZXJlIGNvbGxlY3RlZCwgdGhyb3dzIGEgc2luZ2xlIEVycm9yIHN1bW1hcml6aW5nIHRoZW0sIHdoaWNoIGNhdXNlcyB0aGVcbiAgICAgKiByZW5kZXIgcnVuIHRvIGZhaWwuXG4gICAgICovXG4gICAgZmluaXNoKCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy4jZXJyb3JzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBsaW5lcyA9IHRoaXMuI2Vycm9ycy5tYXAoZSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZSA9IGUuc291cmNlID8gYCBpbiAke2Uuc291cmNlfWAgOiAnJztcbiAgICAgICAgICAgIHJldHVybiBgICAtICR7ZS5raW5kfTogJHtlLmRldGFpbH0g4oCUICR7ZS5ocmVmfSR7d2hlcmV9YDtcbiAgICAgICAgfSk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBMaW5rIGNoZWNrIGZvdW5kICR7dGhpcy4jZXJyb3JzLmxlbmd0aH0gYmFkIGxpbmsocyk6XFxuJHtsaW5lcy5qb2luKCdcXG4nKX1gXG4gICAgICAgICk7XG4gICAgfVxufVxuIl19