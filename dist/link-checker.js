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
var _LinkChecker_instances, _LinkChecker_config, _LinkChecker_akasha, _LinkChecker_options, _LinkChecker_errors, _LinkChecker_externalCache, _LinkChecker_checker, _LinkChecker_renderDestFsCache, _LinkChecker_checkInternal, _LinkChecker_existsInRenderDestination, _LinkChecker_checkExternal, _LinkChecker_report;
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
import { promises as fsp } from 'node:fs';
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
 * A leading URI scheme (RFC 3986: `ALPHA *( ALPHA / DIGIT / "+" / "-" /
 * "." ) ":"`), e.g. `http:`, `mailto:`, `tel:`.
 */
const URL_SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
/**
 * Whether the string begins with a URI scheme (e.g. `http:` or `mailto:`),
 * making it an absolute URL rather than a site-relative reference.
 */
export function hasUrlScheme(s) {
    return URL_SCHEME_RE.test(s);
}
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
        /**
         * Memoize the results of the render-destination filesystem fallback
         * in {@link LinkChecker.checkInternal}.  Values: `true` = a regular
         * file exists at that site-absolute path in `renderDestination`;
         * `false` = it does not (or is not a regular file, or escapes the
         * render tree).  Absent = not yet checked.
         */
        _LinkChecker_renderDestFsCache.set(this, new Map());
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
        // An href carrying a URL scheme is an absolute URL and can never be
        // a local site path.  This must be tested BEFORE resolving against
        // LOCAL_BASE: that sentinel is itself the real URL
        // http://example.com, so an outbound link to exactly that origin
        // would otherwise be misclassified as internal and "resolved" to a
        // nonsense path like /http:/example.com/.
        if (hasUrlScheme(trimmed)) {
            let u;
            try {
                u = new URL(trimmed);
            }
            catch {
                return { kind: 'other-scheme', scheme: '(unparseable)' };
            }
            if (u.protocol === 'http:' || u.protocol === 'https:') {
                // A real external http(s) URL.  Strip the fragment for
                // checking.
                u.hash = '';
                return { kind: 'external', url: u.toString() };
            }
            // Any other scheme (mailto:, tel:, sms:, ftp:, javascript:, ...).
            return { kind: 'other-scheme', scheme: u.protocol };
        }
        // A protocol-relative URL (//host/path) lacks only the scheme; it
        // is external, inheriting http: for classification purposes.
        if (trimmed.startsWith('//')) {
            let u;
            try {
                u = new URL('http:' + trimmed);
            }
            catch {
                return { kind: 'other-scheme', scheme: '(unparseable)' };
            }
            u.hash = '';
            return { kind: 'external', url: u.toString() };
        }
        // No scheme: a relative reference, therefore local.  Resolve the
        // (possibly relative) href against the containing document's vpath,
        // mirroring AnchorCleanup which calls
        // resolveVpath(metadata.document.path, href).  Strip any
        // query/fragment first.
        const rawPath = trimmed.split('#')[0].split('?')[0];
        if (baseVpath && rawPath.length > 0) {
            return { kind: 'internal', absolutePath: resolveVpath(baseVpath, rawPath) };
        }
        let u;
        try {
            u = new URL(trimmed, LOCAL_BASE);
        }
        catch {
            // Unparseable; treat as an other-scheme link so it can be logged.
            return { kind: 'other-scheme', scheme: '(unparseable)' };
        }
        return { kind: 'internal', absolutePath: u.pathname };
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
_LinkChecker_config = new WeakMap(), _LinkChecker_akasha = new WeakMap(), _LinkChecker_options = new WeakMap(), _LinkChecker_errors = new WeakMap(), _LinkChecker_externalCache = new WeakMap(), _LinkChecker_checker = new WeakMap(), _LinkChecker_renderDestFsCache = new WeakMap(), _LinkChecker_instances = new WeakSet(), _LinkChecker_checkInternal = 
/**
 * Resolve an internal link against the assets and documents caches.  This
 * mirrors the resolution logic in `AnchorCleanup` (lib/built-in.ts): a link
 * that resolves to an asset, a document, a directory index, or a path a
 * plugin claims via `askPluginsLegitLocalHref` is valid.
 *
 * As a final fallback, the render-destination directory on disk is
 * consulted (see {@link LinkChecker.existsInRenderDestination}).
 * This lets the checker recognize files written directly to the
 * output tree by Mahafuncs — for example the diagram images
 * produced by `@akashacms/diagram-makers`'s
 * `<diagrams-plantuml output-file="…">`.  Such files are not
 * tracked in any AkashaRender cache, but they *are* present on
 * disk by the time the link check runs (which is from the
 * built-in plugin's `onSiteRendered`, after all documents have
 * been rendered).
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
    // Render-destination filesystem fallback.  Handles files that
    // Mahafuncs wrote directly to `config.renderDestination` and
    // that therefore appear in neither the assets nor documents
    // cache (diagram images, etc.).
    if (await __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_existsInRenderDestination).call(this, absolutePath)) {
        return;
    }
    __classPrivateFieldGet(this, _LinkChecker_instances, "m", _LinkChecker_report).call(this, __classPrivateFieldGet(this, _LinkChecker_options, "f").internal, 'internal', href, source, `internal link not found (${absolutePath})`);
}, _LinkChecker_existsInRenderDestination = 
/**
 * Return `true` when a regular file exists at `absolutePath` (a
 * site-relative, `/`-rooted path) underneath the configured
 * {@link Configuration.renderDestination}.  The result is memoized
 * in {@link LinkChecker.renderDestFsCache} to keep repeat lookups
 * cheap during a full-site scan.
 *
 * Guards against path traversal: a path that resolves outside
 * `renderDestination` is treated as not found.
 *
 * A directory match returns `false` because a bare directory URL
 * is served (if at all) by a co-located `index.html`, and the
 * document-cache check above already handled the `index.html`
 * lookup.  Only regular files count here.
 */
async function _LinkChecker_existsInRenderDestination(absolutePath) {
    const renderDestination = __classPrivateFieldGet(this, _LinkChecker_config, "f")?.renderDestination;
    if (typeof renderDestination !== 'string' || renderDestination.length === 0) {
        return false;
    }
    if (typeof absolutePath !== 'string' || absolutePath.length === 0) {
        return false;
    }
    const cached = __classPrivateFieldGet(this, _LinkChecker_renderDestFsCache, "f").get(absolutePath);
    if (cached !== undefined)
        return cached;
    // Strip a leading `/` before joining so `path.join` (which does
    // not treat `/x` as absolute-relative-to-renderDestination in a
    // reliable way across platforms) composes what we mean.
    const rel = absolutePath.startsWith('/')
        ? absolutePath.substring(1)
        : absolutePath;
    const candidate = path.resolve(renderDestination, rel);
    // Containment guard: the resolved path must be inside
    // renderDestination.  This protects against a crafted `..` href
    // reaching files outside the output tree.
    const rootWithSep = path.resolve(renderDestination) + path.sep;
    if (candidate !== path.resolve(renderDestination)
        && !candidate.startsWith(rootWithSep)) {
        __classPrivateFieldGet(this, _LinkChecker_renderDestFsCache, "f").set(absolutePath, false);
        return false;
    }
    let ok = false;
    try {
        const st = await fsp.stat(candidate);
        ok = st.isFile();
    }
    catch {
        ok = false;
    }
    __classPrivateFieldGet(this, _LinkChecker_renderDestFsCache, "f").set(absolutePath, ok);
    return ok;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay1jaGVja2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2xpbmstY2hlY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSDs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSCxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxFQUFFLFFBQVEsSUFBSSxHQUFHLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDMUMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFlBQVksQ0FBQztBQWExQyxxREFBcUQ7QUFDckQsTUFBTSxDQUFDLE1BQU0sZ0JBQWdCLEdBQ3ZCLENBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFFLENBQUM7QUFFN0M7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFDLElBQVMsRUFBRSxRQUFnQixNQUFNO0lBQ3hELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNuQyxNQUFNLElBQUksS0FBSyxDQUNYLGNBQWMsS0FBSyxtQkFBbUIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FDbkcsQ0FBQztJQUNOLENBQUM7QUFDTCxDQUFDO0FBMEZELDZCQUE2QjtBQUM3QixNQUFNLENBQUMsTUFBTSwwQkFBMEIsR0FBb0I7SUFDdkQsK0RBQStEO0lBQy9ELG9FQUFvRTtJQUNwRSx1RUFBdUU7SUFDdkUsOENBQThDO0lBQzlDLFFBQVEsRUFBRSxNQUFNO0lBQ2hCLFFBQVEsRUFBRSxRQUFRO0lBQ2xCLGtCQUFrQixFQUFFLFFBQVE7SUFDNUIsU0FBUyxFQUFFLEVBQUU7SUFDYixTQUFTLEVBQUUsdUVBQXVFO0lBQ2xGLFNBQVMsRUFBRSxLQUFLO0lBQ2hCLFlB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O0lBQ3BFLElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRSxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE9BQU87SUFDWCxDQUFDO0lBQ0QsMkNBQTJDO0lBQzNDLHVCQUFBLElBQUksMkJBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDO1FBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsVUFBVSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNELDJDQUEyQztJQUMzQyxPQUFPLENBQUMsS0FBSyxDQUFDLFVBQVUsT0FBTyxFQUFFLENBQUMsQ0FBQztBQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8qKlxuICogTGluayBDaGVja2VyXG4gKlxuICogVmFsaWRhdGVzIHRoZSBsaW5rcyBpbiBhIHJlbmRlcmVkIEFrYXNoYUNNUyBzaXRlLiAgSW50ZXJuYWwgKGxvY2FsKSBsaW5rcyBhcmVcbiAqIHJlc29sdmVkIGFnYWluc3QgdGhlIGRvY3VtZW50cyBhbmQgYXNzZXRzIGNhY2hlczsgZXh0ZXJuYWwgYGh0dHA6YC9gaHR0cHM6YFxuICogbGlua3MgYXJlIHZhbGlkYXRlZCBvdmVyIHRoZSBuZXR3b3JrLiAgRXZlcnkgb3RoZXIgVVJJIHNjaGVtZSAoYG1haWx0bzpgLFxuICogYHRlbDpgLCAuLi4pIGlzIHRyZWF0ZWQgYXMgYSBub24tY2hlY2thYmxlIFwib3RoZXIgc2NoZW1lXCIgbGluay5cbiAqXG4gKiBFYWNoIGNsYXNzIG9mIGxpbmsgKGludGVybmFsLCBleHRlcm5hbCwgb3RoZXItc2NoZW1lKSBoYXMgYSBzZXZlcml0eVxuICoge0BsaW5rIExpbmtDaGVja01vZGV9OiBgaWdub3JlYCB0dXJucyB0aGF0IGNsYXNzIG9mIGNoZWNraW5nIG9mZiBlbnRpcmVseSxcbiAqIGB3YXJuYCBsb2dzIGEgbm90aWNlLCBgZXJyb3JgIGNvbGxlY3RzIGZhaWx1cmVzIGFuZCBmYWlscyB0aGUgYnVpbGQgYXQgdGhlXG4gKiBlbmQsIGFuZCBgZmF0YWxgIHRocm93cyBhdCB0aGUgZmlyc3QgYmFkIGxpbmsuXG4gKlxuICogVGhpcyBtb2R1bGUgaXMgdXNlZCBieSB0aGUgQnVpbHQtaW4gUGx1Z2luIChgbGliL2J1aWx0LWluLnRzYCksIHdoaWNoIG93bnMgdGhlXG4gKiBjb25maWd1cmF0aW9uIHN1cmZhY2UgYW5kIGRyaXZlcyB0aGUgd2hvbGUtc2l0ZSBzY2FuIGZyb20gYG9uU2l0ZVJlbmRlcmVkYC5cbiAqXG4gKiBAbW9kdWxlIGxpbmstY2hlY2tlclxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AgfSBmcm9tICdub2RlOmZzJztcbmltcG9ydCB7IHJlc29sdmVWcGF0aCB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHR5cGUgeyBDb25maWd1cmF0aW9uIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5cbi8qKlxuICogU2V2ZXJpdHkgZm9yIGEgY2xhc3Mgb2YgbGluayBjaGVjay5cbiAqXG4gKiAtIGBpZ25vcmVgIOKAlCBkbyBub3QgY2hlY2sgdGhpcyBjbGFzcyBvZiBsaW5rIGF0IGFsbCAodGhlIG9mZiBzd2l0Y2gpLlxuICogLSBgd2FybmAgICDigJQgbG9nIGEgbm90aWNlIGFuZCBjb250aW51ZS5cbiAqIC0gYGVycm9yYCAg4oCUIGNvbGxlY3QgdGhlIGZhaWx1cmU7IHtAbGluayBMaW5rQ2hlY2tlci5maW5pc2h9IHRocm93cyBhdCB0aGUgZW5kLlxuICogLSBgZmF0YWxgICDigJQgdGhyb3cgaW1tZWRpYXRlbHkgYXQgdGhlIHBvaW50IG9mIGRldGVjdGlvbi5cbiAqL1xuZXhwb3J0IHR5cGUgTGlua0NoZWNrTW9kZSA9ICdpZ25vcmUnIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCc7XG5cbi8qKiBUaGUgc2V0IG9mIHZhbGlkIHtAbGluayBMaW5rQ2hlY2tNb2RlfSB2YWx1ZXMuICovXG5leHBvcnQgY29uc3QgTElOS19DSEVDS19NT0RFUzogUmVhZG9ubHlBcnJheTxMaW5rQ2hlY2tNb2RlPlxuICAgID0gWyAnaWdub3JlJywgJ3dhcm4nLCAnZXJyb3InLCAnZmF0YWwnIF07XG5cbi8qKlxuICogVGhyb3cgaWYgYG1vZGVgIGlzIG5vdCBhIHZhbGlkIHtAbGluayBMaW5rQ2hlY2tNb2RlfS5cbiAqXG4gKiBAcGFyYW0gbW9kZSBUaGUgdmFsdWUgdG8gdmFsaWRhdGUuXG4gKiBAcGFyYW0gbGFiZWwgQSBzaG9ydCBsYWJlbCBuYW1pbmcgdGhlIG9wdGlvbiwgZm9yIHRoZSBlcnJvciBtZXNzYWdlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TW9kZShtb2RlOiBhbnksIGxhYmVsOiBzdHJpbmcgPSAnbW9kZScpOiBhc3NlcnRzIG1vZGUgaXMgTGlua0NoZWNrTW9kZSB7XG4gICAgaWYgKCFMSU5LX0NIRUNLX01PREVTLmluY2x1ZGVzKG1vZGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBjaGVja0xpbmtzICR7bGFiZWx9IG11c3QgYmUgb25lIG9mICR7TElOS19DSEVDS19NT0RFUy5qb2luKCcsICcpfSwgZ290ICR7SlNPTi5zdHJpbmdpZnkobW9kZSl9YFxuICAgICAgICApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBIHdoaXRlbGlzdCBlbnRyeTogYSBkb21haW4vVVJMIHByZWZpeCBzdHJpbmcsIG9yIGEgUmVnRXhwIG1hdGNoZWQgYWdhaW5zdCB0aGVcbiAqIGZ1bGwgVVJMLlxuICovXG5leHBvcnQgdHlwZSBXaGl0ZWxpc3RFbnRyeSA9IHN0cmluZyB8IFJlZ0V4cDtcblxuLyoqXG4gKiBUaGUgY2xhc3NpZmljYXRpb24gb2YgYW4gZXh0ZXJuYWwgVVJMIGNoZWNrLlxuICpcbiAqIC0gYE9LYCAgICAg4oCUIHRoZSBsaW5rIGlzIGFsaXZlLlxuICogLSBgQlJPS0VOYCDigJQgdGhlIGxpbmsgaXMgZGVhZCAoNDA0LzQxMCwgRE5TL1RMUy9jb25uZWN0aW9uIGZhaWx1cmUpLlxuICogLSBgV0FSTmAgICDigJQgYW1iaWd1b3VzICg0MDEvNDAzLzQwNS80MjkvOTk5LzV4eCk7IHRoZSByZXNvdXJjZSBsaWtlbHkgZXhpc3RzXG4gKiAgIGJ1dCB0aGUgY2hlY2tlciB3YXMgYmxvY2tlZCBvciB0aHJvdHRsZWQuXG4gKi9cbmV4cG9ydCB0eXBlIEV4dGVybmFsU3RhdGUgPSAnT0snIHwgJ0JST0tFTicgfCAnV0FSTic7XG5cbi8qKiBUaGUgcmVzdWx0IG9mIGFuIGV4dGVybmFsIHBlci1VUkwgY2hlY2suICovXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVybmFsUmVzdWx0IHtcbiAgICBzdGF0ZTogRXh0ZXJuYWxTdGF0ZTtcbiAgICAvKiogVGhlIEhUVFAgc3RhdHVzIGNvZGUsIG9yIGAwYCB3aGVuIG5vIEhUVFAgcmVzcG9uc2Ugd2FzIG9idGFpbmVkLiAqL1xuICAgIHN0YXR1czogbnVtYmVyO1xufVxuXG4vKiogT3B0aW9ucyBwYXNzZWQgdG8gYW4ge0BsaW5rIEV4dGVybmFsQ2hlY2tlcn0uICovXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVybmFsQ2hlY2tPcHRpb25zIHtcbiAgICB1c2VyQWdlbnQ6IHN0cmluZztcbiAgICB0aW1lb3V0TXM6IG51bWJlcjtcbiAgICBtYXhSZWRpcmVjdHM6IG51bWJlcjtcbiAgICAvKiogRXh0cmEgSFRUUCBoZWFkZXJzIChlLmcuIGF1dGhvcml6YXRpb24pLiAqL1xuICAgIGhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG4vKipcbiAqIEEgcGVyLVVSTCBleHRlcm5hbCBjaGVja2VyLiAgQm90aCB0aGUgYnVpbHQtaW4gYGZldGNoYCBpbXBsZW1lbnRhdGlvbiBhbmQgdGhlXG4gKiBvcHRpb25hbCBgbGluay1jaGVja2AgYWRhcHRlciBzYXRpc2Z5IHRoaXMgc2lnbmF0dXJlLCBzbyB0aGUgc3Vycm91bmRpbmdcbiAqIGhhcm5lc3MgaXMgaW5kZXBlbmRlbnQgb2Ygd2hpY2ggb25lIGlzIGFjdGl2ZS5cbiAqL1xuZXhwb3J0IHR5cGUgRXh0ZXJuYWxDaGVja2VyXG4gICAgPSAodXJsOiBzdHJpbmcsIG9wdHM6IEV4dGVybmFsQ2hlY2tPcHRpb25zKSA9PiBQcm9taXNlPEV4dGVybmFsUmVzdWx0PjtcblxuLyoqIFRoZSBraW5kIG9mIGxpbmsgYSByZXBvcnQgY29uY2VybnMuICovXG5leHBvcnQgdHlwZSBMaW5rS2luZCA9ICdpbnRlcm5hbCcgfCAnZXh0ZXJuYWwnIHwgJ290aGVyLXNjaGVtZSc7XG5cbi8qKiBBIHNpbmdsZSByZWNvcmRlZCBsaW5rIHByb2JsZW0uICovXG5leHBvcnQgaW50ZXJmYWNlIExpbmtFcnJvciB7XG4gICAga2luZDogTGlua0tpbmQ7XG4gICAgaHJlZjogc3RyaW5nO1xuICAgIC8qKiBUaGUgcmVuZGVyZWQgZG9jdW1lbnQgKHJlbmRlclBhdGgpIHRoZSBsaW5rIHdhcyBmb3VuZCBpbiwgaWYga25vd24uICovXG4gICAgc291cmNlPzogc3RyaW5nO1xuICAgIGRldGFpbDogc3RyaW5nO1xufVxuXG4vKiogQ29uZmlndXJhdGlvbiBmb3IgdGhlIHtAbGluayBMaW5rQ2hlY2tlcn0uICovXG5leHBvcnQgaW50ZXJmYWNlIExpbmtDaGVja09wdGlvbnMge1xuICAgIGludGVybmFsPzogTGlua0NoZWNrTW9kZTtcbiAgICBleHRlcm5hbD86IExpbmtDaGVja01vZGU7XG4gICAgcmVwb3J0T3RoZXJTY2hlbWVzPzogTGlua0NoZWNrTW9kZTtcbiAgICB3aGl0ZWxpc3Q/OiBXaGl0ZWxpc3RFbnRyeVtdO1xuICAgIHVzZXJBZ2VudD86IHN0cmluZztcbiAgICB0aW1lb3V0TXM/OiBudW1iZXI7XG4gICAgbWF4UmVkaXJlY3RzPzogbnVtYmVyO1xuICAgIGNvbmN1cnJlbmN5PzogbnVtYmVyO1xuICAgIGNhY2hlVFRMbXM/OiBudW1iZXI7XG4gICAgaGVhZGVycz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgLyoqXG4gICAgICogV2hpY2ggZXh0ZXJuYWwgY2hlY2tlciB0byB1c2U6IGAnZmV0Y2gnYCAoZGVmYXVsdCwgemVybyBkZXBlbmRlbmN5KSBvclxuICAgICAqIGAnbGluay1jaGVjaydgIChsYXp5LWxvYWRzIHRoZSBzaXRlLWF1dGhvci1pbnN0YWxsZWQgYGxpbmstY2hlY2tgXG4gICAgICogcGFja2FnZSkuICBBbHRlcm5hdGl2ZWx5LCBhIGN1c3RvbSB7QGxpbmsgRXh0ZXJuYWxDaGVja2VyfSBmdW5jdGlvbiBtYXlcbiAgICAgKiBiZSBzdXBwbGllZCBkaXJlY3RseSAodXNlZCBieSB0ZXN0cykuXG4gICAgICovXG4gICAgZXh0ZXJuYWxDaGVja2VyPzogJ2ZldGNoJyB8ICdsaW5rLWNoZWNrJyB8IEV4dGVybmFsQ2hlY2tlcjtcbn1cblxuLyoqIFRoZSBmdWxseS1yZXNvbHZlZCBvcHRpb25zIGFmdGVyIGRlZmF1bHRzIGFyZSBhcHBsaWVkLiAqL1xuaW50ZXJmYWNlIFJlc29sdmVkT3B0aW9ucyB7XG4gICAgaW50ZXJuYWw6IExpbmtDaGVja01vZGU7XG4gICAgZXh0ZXJuYWw6IExpbmtDaGVja01vZGU7XG4gICAgcmVwb3J0T3RoZXJTY2hlbWVzOiBMaW5rQ2hlY2tNb2RlO1xuICAgIHdoaXRlbGlzdDogV2hpdGVsaXN0RW50cnlbXTtcbiAgICB1c2VyQWdlbnQ6IHN0cmluZztcbiAgICB0aW1lb3V0TXM6IG51bWJlcjtcbiAgICBtYXhSZWRpcmVjdHM6IG51bWJlcjtcbiAgICBjb25jdXJyZW5jeTogbnVtYmVyO1xuICAgIGNhY2hlVFRMbXM6IG51bWJlcjtcbiAgICBoZWFkZXJzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBleHRlcm5hbENoZWNrZXI6ICdmZXRjaCcgfCAnbGluay1jaGVjaycgfCBFeHRlcm5hbENoZWNrZXI7XG59XG5cbi8qKiBEZWZhdWx0IG9wdGlvbiB2YWx1ZXMuICovXG5leHBvcnQgY29uc3QgREVGQVVMVF9MSU5LX0NIRUNLX09QVElPTlM6IFJlc29sdmVkT3B0aW9ucyA9IHtcbiAgICAvLyAnaWdub3JlJyBtZWFucyBcImRvIG5vdCBjaGVja1wiLCBzbyBpdCBpcyBhbHNvIHRoZSBvZmYgc3dpdGNoOlxuICAgIC8vIGludGVybmFsOidpZ25vcmUnICsgZXh0ZXJuYWw6J2lnbm9yZScgZGlzYWJsZXMgdGhlIHdob2xlIGZlYXR1cmUuXG4gICAgLy8gRXh0ZXJuYWwgZGVmYXVsdHMgdG8gJ2lnbm9yZScgYmVjYXVzZSBpdCBpcyBzbG93IGFuZCBmbGFreSAob3B0LWluKTtcbiAgICAvLyBpbnRlcm5hbCBpcyBjaGVhcCBzbyBpdCBkZWZhdWx0cyB0byAnd2FybicuXG4gICAgaW50ZXJuYWw6ICd3YXJuJyxcbiAgICBleHRlcm5hbDogJ2lnbm9yZScsXG4gICAgcmVwb3J0T3RoZXJTY2hlbWVzOiAnaWdub3JlJyxcbiAgICB3aGl0ZWxpc3Q6IFtdLFxuICAgIHVzZXJBZ2VudDogJ01vemlsbGEvNS4wIChjb21wYXRpYmxlOyBBa2FzaGFMaW5rQ2hlY2svMS4wOyAraHR0cHM6Ly9ha2FzaGFjbXMuY29tKScsXG4gICAgdGltZW91dE1zOiAxMDAwMCxcbiAgICBtYXhSZWRpcmVjdHM6IDgsXG4gICAgY29uY3VycmVuY3k6IDEwLFxuICAgIGNhY2hlVFRMbXM6IDM2MDAwMDAsXG4gICAgZXh0ZXJuYWxDaGVja2VyOiAnZmV0Y2gnLFxufTtcblxuLyoqXG4gKiBBIGR1bW15IG9yaWdpbiB1c2VkIHRvIGRldGVjdCB3aGV0aGVyIGEgVVJMIGlzIGxvY2FsLiAgYG5ldyBVUkwoaHJlZiwgYmFzZSlgXG4gKiB5aWVsZHMgdGhpcyBvcmlnaW4gb25seSB3aGVuIGBocmVmYCBpcyBhIHNhbWUtc2l0ZSBwYXRoLlxuICovXG5jb25zdCBMT0NBTF9CQVNFID0gJ2h0dHA6Ly9leGFtcGxlLmNvbSc7XG5cbi8qKlxuICogQSBsZWFkaW5nIFVSSSBzY2hlbWUgKFJGQyAzOTg2OiBgQUxQSEEgKiggQUxQSEEgLyBESUdJVCAvIFwiK1wiIC8gXCItXCIgL1xuICogXCIuXCIgKSBcIjpcImApLCBlLmcuIGBodHRwOmAsIGBtYWlsdG86YCwgYHRlbDpgLlxuICovXG5jb25zdCBVUkxfU0NIRU1FX1JFID0gL15bYS16QS1aXVthLXpBLVowLTkrLi1dKjovO1xuXG4vKipcbiAqIFdoZXRoZXIgdGhlIHN0cmluZyBiZWdpbnMgd2l0aCBhIFVSSSBzY2hlbWUgKGUuZy4gYGh0dHA6YCBvciBgbWFpbHRvOmApLFxuICogbWFraW5nIGl0IGFuIGFic29sdXRlIFVSTCByYXRoZXIgdGhhbiBhIHNpdGUtcmVsYXRpdmUgcmVmZXJlbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFzVXJsU2NoZW1lKHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBVUkxfU0NIRU1FX1JFLnRlc3Qocyk7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBVUkwgbWF0Y2hlcyBhIHdoaXRlbGlzdCBlbnRyeS5cbiAqXG4gKiBBIHN0cmluZyBlbnRyeSBtYXRjaGVzIHdoZW4gdGhlIFVSTCdzIGhvc3QgZXF1YWxzIGl0IG9yIGVuZHMgd2l0aCBgLmVudHJ5YFxuICogKHN1YmRvbWFpbiBtYXRjaCksIG9yIHdoZW4gdGhlIHdob2xlIFVSTCBzdGFydHMgd2l0aCB0aGUgZW50cnkgKHByZWZpeC9leGFjdFxuICogVVJMIG1hdGNoKS4gIEEgUmVnRXhwIGVudHJ5IGlzIHRlc3RlZCBhZ2FpbnN0IHRoZSBmdWxsIFVSTC5cbiAqXG4gKiBAcGFyYW0gdXJsIFRoZSBleHRlcm5hbCBVUkwgdW5kZXIgY29uc2lkZXJhdGlvbi5cbiAqIEBwYXJhbSB3aGl0ZWxpc3QgVGhlIGNvbmZpZ3VyZWQgd2hpdGVsaXN0IGVudHJpZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1doaXRlbGlzdGVkKHVybDogc3RyaW5nLCB3aGl0ZWxpc3Q6IFdoaXRlbGlzdEVudHJ5W10pOiBib29sZWFuIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkod2hpdGVsaXN0KSB8fCB3aGl0ZWxpc3QubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgbGV0IGhvc3Q6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgICBob3N0ID0gbmV3IFVSTCh1cmwpLmhvc3QudG9Mb3dlckNhc2UoKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgaG9zdCA9ICcnO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHdoaXRlbGlzdCkge1xuICAgICAgICBpZiAoZW50cnkgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIGlmIChlbnRyeS50ZXN0KHVybCkpIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IGUgPSBlbnRyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGhvc3QgJiYgKGhvc3QgPT09IGUgfHwgaG9zdC5lbmRzV2l0aCgnLicgKyBlKSkpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgaWYgKHVybC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoZSkpIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBDbGFzc2lmeSBhbiBleHRlcm5hbCBIVFRQIHN0YXR1cyBjb2RlIGludG8gYW4ge0BsaW5rIEV4dGVybmFsU3RhdGV9LlxuICpcbiAqIEBwYXJhbSBzdGF0dXMgVGhlIEhUVFAgc3RhdHVzIGNvZGUgKG9yIGAwYCBmb3IgYSBuZXR3b3JrLWxldmVsIGZhaWx1cmUpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnlTdGF0dXMoc3RhdHVzOiBudW1iZXIpOiBFeHRlcm5hbFN0YXRlIHtcbiAgICBpZiAoc3RhdHVzID49IDIwMCAmJiBzdGF0dXMgPCA0MDApIHJldHVybiAnT0snO1xuICAgIGlmIChzdGF0dXMgPT09IDQwNCB8fCBzdGF0dXMgPT09IDQxMCkgcmV0dXJuICdCUk9LRU4nO1xuICAgIGlmIChzdGF0dXMgPT09IDQwMSB8fCBzdGF0dXMgPT09IDQwMyB8fCBzdGF0dXMgPT09IDQwNVxuICAgICB8fCBzdGF0dXMgPT09IDQyOSB8fCBzdGF0dXMgPT09IDk5OSkgcmV0dXJuICdXQVJOJztcbiAgICBpZiAoc3RhdHVzID49IDUwMCkgcmV0dXJuICdXQVJOJztcbiAgICBpZiAoc3RhdHVzID09PSAwKSByZXR1cm4gJ0JST0tFTic7XG4gICAgcmV0dXJuICdXQVJOJztcbn1cblxuLyoqXG4gKiBUaGUgYnVpbHQtaW4gYGZldGNoYC1iYXNlZCBleHRlcm5hbCBjaGVja2VyLiAgVXNlcyBIRUFELCBmYWxsaW5nIGJhY2sgdG8gR0VUXG4gKiB3aGVuIHRoZSBzZXJ2ZXIgbWlzaGFuZGxlcyBIRUFELCBhbmQgbmV2ZXIgZG93bmxvYWRzIHRoZSByZXNwb25zZSBib2R5LlxuICovXG5leHBvcnQgY29uc3QgZmV0Y2hFeHRlcm5hbENoZWNrZXI6IEV4dGVybmFsQ2hlY2tlciA9IGFzeW5jICh1cmwsIG9wdHMpID0+IHtcbiAgICBjb25zdCBoZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICAgICAgICAndXNlci1hZ2VudCc6IG9wdHMudXNlckFnZW50LFxuICAgICAgICAnYWNjZXB0JzogJyovKicsXG4gICAgICAgIC4uLihvcHRzLmhlYWRlcnMgPz8ge30pXG4gICAgfTtcblxuICAgIGNvbnN0IHJlcXVlc3QgPSBhc3luYyAobWV0aG9kOiBzdHJpbmcsIGV4dHJhPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IFByb21pc2U8bnVtYmVyPiA9PiB7XG4gICAgICAgIGNvbnN0IGFjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICBjb25zdCBzaWduYWwgPSAoQWJvcnRTaWduYWwgYXMgYW55KS5hbnlcbiAgICAgICAgICAgID8gKEFib3J0U2lnbmFsIGFzIGFueSkuYW55KFsgYWMuc2lnbmFsLCBBYm9ydFNpZ25hbC50aW1lb3V0KG9wdHMudGltZW91dE1zKSBdKVxuICAgICAgICAgICAgOiBBYm9ydFNpZ25hbC50aW1lb3V0KG9wdHMudGltZW91dE1zKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICAgICAgICAgIG1ldGhvZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7IC4uLmhlYWRlcnMsIC4uLihleHRyYSA/PyB7fSkgfSxcbiAgICAgICAgICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsXG4gICAgICAgICAgICAgICAgc2lnbmFsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgbmVlZCB0aGUgc3RhdHVzOyBuZXZlciBkb3dubG9hZCB0aGUgYm9keS5cbiAgICAgICAgICAgIGFjLmFib3J0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cztcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBETlMvVExTL3RpbWVvdXQvY29ubmVjdGlvbiBmYWlsdXJlLlxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IHN0YXR1cyA9IGF3YWl0IHJlcXVlc3QoJ0hFQUQnKTtcbiAgICAvLyBNYW55IHNlcnZlcnMgbWlzaGFuZGxlIEhFQUQ7IHJldHJ5IHdpdGggYSBjaGVhcCByYW5nZWQgR0VULlxuICAgIGlmIChzdGF0dXMgPT09IDAgfHwgc3RhdHVzID09PSA0MDAgfHwgc3RhdHVzID09PSA0MDNcbiAgICAgfHwgc3RhdHVzID09PSA0MDUgfHwgc3RhdHVzID09PSA1MDEpIHtcbiAgICAgICAgc3RhdHVzID0gYXdhaXQgcmVxdWVzdCgnR0VUJywgeyByYW5nZTogJ2J5dGVzPTAtMCcgfSk7XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXRlOiBjbGFzc2lmeVN0YXR1cyhzdGF0dXMpLCBzdGF0dXMgfTtcbn07XG5cbi8vIE1lbW9pemVkIHJlZmVyZW5jZSB0byB0aGUgbGF6aWx5LWltcG9ydGVkIGBsaW5rLWNoZWNrYCBwYWNrYWdlLlxubGV0IF9saW5rQ2hlY2tNb2R1bGU6IGFueTtcblxuLyoqXG4gKiBMYXppbHkgbG9hZCB0aGUgc2l0ZS1hdXRob3ItaW5zdGFsbGVkIGBsaW5rLWNoZWNrYCBwYWNrYWdlLiAgSXQgaXMgbm90IGFcbiAqIGRlcGVuZGVuY3kgb2YgQWthc2hhUmVuZGVyOyB0aGUgbW9kdWxlIGlzIHJlc29sdmVkIGZyb20gdGhlIHByb2plY3Qnc1xuICogYG5vZGVfbW9kdWxlc2Agb25seSB3aGVuIHRoZSBhdXRob3Igb3B0cyBpbi5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gbG9hZExpbmtDaGVjaygpOiBQcm9taXNlPGFueT4ge1xuICAgIGlmIChfbGlua0NoZWNrTW9kdWxlKSByZXR1cm4gX2xpbmtDaGVja01vZHVsZTtcbiAgICB0cnkge1xuICAgICAgICAvLyBUaGUgc3BlY2lmaWVyIGlzIGhlbGQgaW4gYSB2YXJpYWJsZSBzbyB0aGF0IFR5cGVTY3JpcHQgZG9lcyBub3QgdHJ5XG4gICAgICAgIC8vIHRvIHJlc29sdmUgdGhlIG9wdGlvbmFsIGBsaW5rLWNoZWNrYCBwYWNrYWdlIGF0IGNvbXBpbGUgdGltZTsgaXQgaXNcbiAgICAgICAgLy8gYW4gb3B0aW9uYWwgZGVwZW5kZW5jeSB0aGUgKnNpdGUgYXV0aG9yKiBpbnN0YWxscyBpbiB0aGVpciBwcm9qZWN0LlxuICAgICAgICBjb25zdCBzcGVjaWZpZXIgPSAnbGluay1jaGVjayc7XG4gICAgICAgIGNvbnN0IG1vZDogYW55ID0gYXdhaXQgaW1wb3J0KHNwZWNpZmllcik7XG4gICAgICAgIF9saW5rQ2hlY2tNb2R1bGUgPSBtb2QuZGVmYXVsdCA/PyBtb2Q7XG4gICAgICAgIHJldHVybiBfbGlua0NoZWNrTW9kdWxlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgY2hlY2tMaW5rcy5leHRlcm5hbENoZWNrZXIgaXMgJ2xpbmstY2hlY2snIGJ1dCB0aGUgJ2xpbmstY2hlY2snIGBcbiAgICAgICAgICArIGBwYWNrYWdlIGlzIG5vdCBpbnN0YWxsZWQgaW4gdGhpcyBwcm9qZWN0LiBSdW4gYFxuICAgICAgICAgICsgYFwibnBtIGluc3RhbGwgLS1zYXZlLWRldiBsaW5rLWNoZWNrXCIgb3Igc2V0IGV4dGVybmFsQ2hlY2tlciB0byBgXG4gICAgICAgICAgKyBgJ2ZldGNoJy4gKCR7KGVyciBhcyBFcnJvcikubWVzc2FnZX0pYFxuICAgICAgICApO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXNldCB0aGUgbWVtb2l6ZWQgYGxpbmstY2hlY2tgIG1vZHVsZSByZWZlcmVuY2UuICBJbnRlbmRlZCBmb3IgdGVzdHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfcmVzZXRMaW5rQ2hlY2tNb2R1bGUoKTogdm9pZCB7XG4gICAgX2xpbmtDaGVja01vZHVsZSA9IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBBbiBleHRlcm5hbCBjaGVja2VyIHRoYXQgZGVsZWdhdGVzIHRvIHRoZSBgbGluay1jaGVja2AgcGFja2FnZSwgbG9hZGVkIG9uXG4gKiBkZW1hbmQgdmlhIHtAbGluayBsb2FkTGlua0NoZWNrfS5cbiAqL1xuZXhwb3J0IGNvbnN0IGxpbmtDaGVja0V4dGVybmFsQ2hlY2tlcjogRXh0ZXJuYWxDaGVja2VyID0gYXN5bmMgKHVybCwgb3B0cykgPT4ge1xuICAgIGNvbnN0IGxpbmtDaGVjayA9IGF3YWl0IGxvYWRMaW5rQ2hlY2soKTtcbiAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGlua0NoZWNrKHVybCwge1xuICAgICAgICAgICAgdGltZW91dDogYCR7b3B0cy50aW1lb3V0TXN9bXNgLFxuICAgICAgICAgICAgdXNlcl9hZ2VudDogb3B0cy51c2VyQWdlbnQsXG4gICAgICAgICAgICBoZWFkZXJzOiBvcHRzLmhlYWRlcnMsXG4gICAgICAgICAgICByZXRyeU9uNDI5OiB0cnVlLFxuICAgICAgICAgICAgYWxpdmVTdGF0dXNDb2RlczogWyAyMDAsIDIwMSwgMjAyLCAyMDMsIDIwNCwgL14zXFxkXFxkJC8gXVxuICAgICAgICB9LCAoZXJyOiBhbnksIHJlczogYW55KSA9PiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUocmVzKSk7XG4gICAgfSk7XG4gICAgY29uc3Qgc3RhdHVzID0gdHlwZW9mIHJlc3VsdD8uc3RhdHVzQ29kZSA9PT0gJ251bWJlcicgPyByZXN1bHQuc3RhdHVzQ29kZSA6IDA7XG4gICAgaWYgKHJlc3VsdD8uc3RhdHVzID09PSAnYWxpdmUnKSByZXR1cm4geyBzdGF0ZTogJ09LJywgc3RhdHVzIH07XG4gICAgcmV0dXJuIHsgc3RhdGU6IGNsYXNzaWZ5U3RhdHVzKHN0YXR1cyksIHN0YXR1cyB9O1xufTtcblxuLyoqXG4gKiBSZXNvbHZlcyBhbiBpbnRlcm5hbCAobG9jYWwpIGxpbmsgYWdhaW5zdCB0aGUgY2FjaGVzIHRvIGRldGVybWluZSB3aGV0aGVyIGl0XG4gKiByZWZlcnMgdG8gYW4gZXhpc3RpbmcgcmVuZGVyZWQgZG9jdW1lbnQgb3IgYXNzZXQuXG4gKlxuICogUmV0dXJucyBgdHJ1ZWAgd2hlbiB0aGUgbGluayByZXNvbHZlcywgYGZhbHNlYCB3aGVuIGl0IGlzIGJyb2tlbi5cbiAqL1xuZXhwb3J0IHR5cGUgSW50ZXJuYWxSZXNvbHZlciA9IChhYnNvbHV0ZVBhdGg6IHN0cmluZykgPT4gUHJvbWlzZTxib29sZWFuPjtcblxuLyoqXG4gKiBDaGVja3MgdGhlIGxpbmtzIGZvdW5kIGluIGEgcmVuZGVyZWQgQWthc2hhQ01TIHNpdGUuXG4gKlxuICogVHlwaWNhbCB1c2FnZSBmcm9tIHRoZSBCdWlsdC1pbiBQbHVnaW4ncyBgb25TaXRlUmVuZGVyZWRgOlxuICogYGBgdHNcbiAqIGNvbnN0IGNoZWNrZXIgPSBuZXcgTGlua0NoZWNrZXIoY29uZmlnLCBha2FzaGEsIG9wdGlvbnMuY2hlY2tMaW5rcyk7XG4gKiBmb3IgKGNvbnN0IHsgaHJlZiwgc291cmNlIH0gb2YgZGlzY292ZXJlZExpbmtzKSB7XG4gKiAgICAgYXdhaXQgY2hlY2tlci5jaGVja0xpbmsoaHJlZiwgc291cmNlKTtcbiAqIH1cbiAqIGNoZWNrZXIuZmluaXNoKCk7ICAvLyB0aHJvd3MgaWYgYW55ICdlcnJvcictbW9kZSBmYWlsdXJlcyB3ZXJlIGNvbGxlY3RlZFxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBMaW5rQ2hlY2tlciB7XG4gICAgI2NvbmZpZzogQ29uZmlndXJhdGlvbjtcbiAgICAjYWthc2hhOiBhbnk7XG4gICAgI29wdGlvbnM6IFJlc29sdmVkT3B0aW9ucztcbiAgICAjZXJyb3JzOiBMaW5rRXJyb3JbXSA9IFtdO1xuICAgICNleHRlcm5hbENhY2hlID0gbmV3IE1hcDxzdHJpbmcsIHsgcmVzdWx0OiBFeHRlcm5hbFJlc3VsdCwgYXQ6IG51bWJlciB9PigpO1xuICAgICNjaGVja2VyOiBFeHRlcm5hbENoZWNrZXI7XG4gICAgLyoqXG4gICAgICogTWVtb2l6ZSB0aGUgcmVzdWx0cyBvZiB0aGUgcmVuZGVyLWRlc3RpbmF0aW9uIGZpbGVzeXN0ZW0gZmFsbGJhY2tcbiAgICAgKiBpbiB7QGxpbmsgTGlua0NoZWNrZXIuY2hlY2tJbnRlcm5hbH0uICBWYWx1ZXM6IGB0cnVlYCA9IGEgcmVndWxhclxuICAgICAqIGZpbGUgZXhpc3RzIGF0IHRoYXQgc2l0ZS1hYnNvbHV0ZSBwYXRoIGluIGByZW5kZXJEZXN0aW5hdGlvbmA7XG4gICAgICogYGZhbHNlYCA9IGl0IGRvZXMgbm90IChvciBpcyBub3QgYSByZWd1bGFyIGZpbGUsIG9yIGVzY2FwZXMgdGhlXG4gICAgICogcmVuZGVyIHRyZWUpLiAgQWJzZW50ID0gbm90IHlldCBjaGVja2VkLlxuICAgICAqL1xuICAgICNyZW5kZXJEZXN0RnNDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBib29sZWFuPigpO1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIGNvbmZpZyBUaGUgQWthc2hhUmVuZGVyIGNvbmZpZ3VyYXRpb24uXG4gICAgICogQHBhcmFtIGFrYXNoYSBUaGUgYWthc2hhIEFQSSBvYmplY3QgKHByb3ZpZGVzIGBmaWxlY2FjaGVgKS5cbiAgICAgKiBAcGFyYW0gb3B0aW9ucyBUaGUgbGluay1jaGVja2luZyBvcHRpb25zIChzZWUge0BsaW5rIExpbmtDaGVja09wdGlvbnN9KS5cbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZ3VyYXRpb24sIGFrYXNoYTogYW55LCBvcHRpb25zPzogTGlua0NoZWNrT3B0aW9ucykge1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuI2FrYXNoYSA9IGFrYXNoYTtcbiAgICAgICAgdGhpcy4jb3B0aW9ucyA9IExpbmtDaGVja2VyLnJlc29sdmVPcHRpb25zKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLiNjaGVja2VyID0gTGlua0NoZWNrZXIucmVzb2x2ZUNoZWNrZXIodGhpcy4jb3B0aW9ucy5leHRlcm5hbENoZWNrZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1lcmdlIHVzZXIgb3B0aW9ucyBvdmVyIHRoZSBkZWZhdWx0cywgdmFsaWRhdGluZyBlYWNoIG1vZGUuXG4gICAgICovXG4gICAgc3RhdGljIHJlc29sdmVPcHRpb25zKG9wdGlvbnM/OiBMaW5rQ2hlY2tPcHRpb25zKTogUmVzb2x2ZWRPcHRpb25zIHtcbiAgICAgICAgY29uc3QgbyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfTElOS19DSEVDS19PUFRJT05TLCBvcHRpb25zID8/IHt9KTtcbiAgICAgICAgYXNzZXJ0TW9kZShvLmludGVybmFsLCAnaW50ZXJuYWwnKTtcbiAgICAgICAgYXNzZXJ0TW9kZShvLmV4dGVybmFsLCAnZXh0ZXJuYWwnKTtcbiAgICAgICAgYXNzZXJ0TW9kZShvLnJlcG9ydE90aGVyU2NoZW1lcywgJ3JlcG9ydE90aGVyU2NoZW1lcycpO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoby53aGl0ZWxpc3QpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNoZWNrTGlua3Mgd2hpdGVsaXN0IG11c3QgYmUgYW4gYXJyYXlgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBNYXAgYW4gYGV4dGVybmFsQ2hlY2tlcmAgb3B0aW9uIHZhbHVlIHRvIGFuIHtAbGluayBFeHRlcm5hbENoZWNrZXJ9LlxuICAgICAqL1xuICAgIHN0YXRpYyByZXNvbHZlQ2hlY2tlcihcbiAgICAgICAgd2hpY2g6ICdmZXRjaCcgfCAnbGluay1jaGVjaycgfCBFeHRlcm5hbENoZWNrZXJcbiAgICApOiBFeHRlcm5hbENoZWNrZXIge1xuICAgICAgICBpZiAodHlwZW9mIHdoaWNoID09PSAnZnVuY3Rpb24nKSByZXR1cm4gd2hpY2g7XG4gICAgICAgIGlmICh3aGljaCA9PT0gJ2xpbmstY2hlY2snKSByZXR1cm4gbGlua0NoZWNrRXh0ZXJuYWxDaGVja2VyO1xuICAgICAgICByZXR1cm4gZmV0Y2hFeHRlcm5hbENoZWNrZXI7XG4gICAgfVxuXG4gICAgLyoqIFdoZXRoZXIgYW55IGNoZWNraW5nIGlzIGVuYWJsZWQgKGkuZS4gbm90IGFsbCBjbGFzc2VzIGFyZSBgaWdub3JlYCkuICovXG4gICAgZ2V0IGVuYWJsZWQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLiNvcHRpb25zLmludGVybmFsICE9PSAnaWdub3JlJ1xuICAgICAgICAgICAgfHwgdGhpcy4jb3B0aW9ucy5leHRlcm5hbCAhPT0gJ2lnbm9yZSdcbiAgICAgICAgICAgIHx8IHRoaXMuI29wdGlvbnMucmVwb3J0T3RoZXJTY2hlbWVzICE9PSAnaWdub3JlJztcbiAgICB9XG5cbiAgICAvKiogVGhlIHJlc29sdmVkIG9wdGlvbnMgKHJlYWQtb25seSB2aWV3KS4gKi9cbiAgICBnZXQgb3B0aW9ucygpOiBSZWFkb25seTxSZXNvbHZlZE9wdGlvbnM+IHsgcmV0dXJuIHRoaXMuI29wdGlvbnM7IH1cblxuICAgIC8qKiBUaGUgY29sbGVjdGVkIGxpbmsgZXJyb3JzLiAqL1xuICAgIGdldCBlcnJvcnMoKTogUmVhZG9ubHlBcnJheTxMaW5rRXJyb3I+IHsgcmV0dXJuIHRoaXMuI2Vycm9yczsgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBsaW5rIGlzIHNhbWUtcGFnZSAoYSBiYXJlIGAjZnJhZ21lbnRgKSwgYSBsb2NhbCBwYXRoLFxuICAgICAqIGFuIGV4dGVybmFsIGBodHRwKHMpYCBVUkwsIG9yIGFub3RoZXIgc2NoZW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIGhyZWYgVGhlIHJhdyBocmVmL3NyYyB2YWx1ZS5cbiAgICAgKiBAcGFyYW0gYmFzZVZwYXRoIFRoZSB2cGF0aCBvZiB0aGUgY29udGFpbmluZyBkb2N1bWVudCAodXNlZCB0byByZXNvbHZlXG4gICAgICogICByZWxhdGl2ZSBsaW5rcykuICBPcHRpb25hbC5cbiAgICAgKi9cbiAgICBjbGFzc2lmeShocmVmOiBzdHJpbmcsIGJhc2VWcGF0aD86IHN0cmluZyk6IHtcbiAgICAgICAga2luZDogJ2FuY2hvcicgfCAnaW50ZXJuYWwnIHwgJ2V4dGVybmFsJyB8ICdvdGhlci1zY2hlbWUnO1xuICAgICAgICAvKiogRm9yIGludGVybmFsIGxpbmtzLCB0aGUgYWJzb2x1dGUgc2l0ZSBwYXRoLiAqL1xuICAgICAgICBhYnNvbHV0ZVBhdGg/OiBzdHJpbmc7XG4gICAgICAgIC8qKiBGb3IgZXh0ZXJuYWwgbGlua3MsIHRoZSBub3JtYWxpemVkIFVSTC4gKi9cbiAgICAgICAgdXJsPzogc3RyaW5nO1xuICAgICAgICAvKiogRm9yIG90aGVyLXNjaGVtZSBsaW5rcywgdGhlIHNjaGVtZSAoZS5nLiBgbWFpbHRvOmApLiAqL1xuICAgICAgICBzY2hlbWU/OiBzdHJpbmc7XG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSAoaHJlZiA/PyAnJykudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCA9PT0gJycgfHwgdHJpbW1lZCA9PT0gJyMnIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICAgICAgICByZXR1cm4geyBraW5kOiAnYW5jaG9yJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQW4gaHJlZiBjYXJyeWluZyBhIFVSTCBzY2hlbWUgaXMgYW4gYWJzb2x1dGUgVVJMIGFuZCBjYW4gbmV2ZXIgYmVcbiAgICAgICAgLy8gYSBsb2NhbCBzaXRlIHBhdGguICBUaGlzIG11c3QgYmUgdGVzdGVkIEJFRk9SRSByZXNvbHZpbmcgYWdhaW5zdFxuICAgICAgICAvLyBMT0NBTF9CQVNFOiB0aGF0IHNlbnRpbmVsIGlzIGl0c2VsZiB0aGUgcmVhbCBVUkxcbiAgICAgICAgLy8gaHR0cDovL2V4YW1wbGUuY29tLCBzbyBhbiBvdXRib3VuZCBsaW5rIHRvIGV4YWN0bHkgdGhhdCBvcmlnaW5cbiAgICAgICAgLy8gd291bGQgb3RoZXJ3aXNlIGJlIG1pc2NsYXNzaWZpZWQgYXMgaW50ZXJuYWwgYW5kIFwicmVzb2x2ZWRcIiB0byBhXG4gICAgICAgIC8vIG5vbnNlbnNlIHBhdGggbGlrZSAvaHR0cDovZXhhbXBsZS5jb20vLlxuICAgICAgICBpZiAoaGFzVXJsU2NoZW1lKHRyaW1tZWQpKSB7XG4gICAgICAgICAgICBsZXQgdTogVVJMO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB1ID0gbmV3IFVSTCh0cmltbWVkKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGtpbmQ6ICdvdGhlci1zY2hlbWUnLCBzY2hlbWU6ICcodW5wYXJzZWFibGUpJyB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHUucHJvdG9jb2wgPT09ICdodHRwOicgfHwgdS5wcm90b2NvbCA9PT0gJ2h0dHBzOicpIHtcbiAgICAgICAgICAgICAgICAvLyBBIHJlYWwgZXh0ZXJuYWwgaHR0cChzKSBVUkwuICBTdHJpcCB0aGUgZnJhZ21lbnQgZm9yXG4gICAgICAgICAgICAgICAgLy8gY2hlY2tpbmcuXG4gICAgICAgICAgICAgICAgdS5oYXNoID0gJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsga2luZDogJ2V4dGVybmFsJywgdXJsOiB1LnRvU3RyaW5nKCkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEFueSBvdGhlciBzY2hlbWUgKG1haWx0bzosIHRlbDosIHNtczosIGZ0cDosIGphdmFzY3JpcHQ6LCAuLi4pLlxuICAgICAgICAgICAgcmV0dXJuIHsga2luZDogJ290aGVyLXNjaGVtZScsIHNjaGVtZTogdS5wcm90b2NvbCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgKC8vaG9zdC9wYXRoKSBsYWNrcyBvbmx5IHRoZSBzY2hlbWU7IGl0XG4gICAgICAgIC8vIGlzIGV4dGVybmFsLCBpbmhlcml0aW5nIGh0dHA6IGZvciBjbGFzc2lmaWNhdGlvbiBwdXJwb3Nlcy5cbiAgICAgICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnLy8nKSkge1xuICAgICAgICAgICAgbGV0IHU6IFVSTDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdSA9IG5ldyBVUkwoJ2h0dHA6JyArIHRyaW1tZWQpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsga2luZDogJ290aGVyLXNjaGVtZScsIHNjaGVtZTogJyh1bnBhcnNlYWJsZSknIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB1Lmhhc2ggPSAnJztcbiAgICAgICAgICAgIHJldHVybiB7IGtpbmQ6ICdleHRlcm5hbCcsIHVybDogdS50b1N0cmluZygpIH07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBObyBzY2hlbWU6IGEgcmVsYXRpdmUgcmVmZXJlbmNlLCB0aGVyZWZvcmUgbG9jYWwuICBSZXNvbHZlIHRoZVxuICAgICAgICAvLyAocG9zc2libHkgcmVsYXRpdmUpIGhyZWYgYWdhaW5zdCB0aGUgY29udGFpbmluZyBkb2N1bWVudCdzIHZwYXRoLFxuICAgICAgICAvLyBtaXJyb3JpbmcgQW5jaG9yQ2xlYW51cCB3aGljaCBjYWxsc1xuICAgICAgICAvLyByZXNvbHZlVnBhdGgobWV0YWRhdGEuZG9jdW1lbnQucGF0aCwgaHJlZikuICBTdHJpcCBhbnlcbiAgICAgICAgLy8gcXVlcnkvZnJhZ21lbnQgZmlyc3QuXG4gICAgICAgIGNvbnN0IHJhd1BhdGggPSB0cmltbWVkLnNwbGl0KCcjJylbMF0uc3BsaXQoJz8nKVswXTtcbiAgICAgICAgaWYgKGJhc2VWcGF0aCAmJiByYXdQYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB7IGtpbmQ6ICdpbnRlcm5hbCcsIGFic29sdXRlUGF0aDogcmVzb2x2ZVZwYXRoKGJhc2VWcGF0aCwgcmF3UGF0aCkgfTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdTogVVJMO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdSA9IG5ldyBVUkwodHJpbW1lZCwgTE9DQUxfQkFTRSk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgLy8gVW5wYXJzZWFibGU7IHRyZWF0IGFzIGFuIG90aGVyLXNjaGVtZSBsaW5rIHNvIGl0IGNhbiBiZSBsb2dnZWQuXG4gICAgICAgICAgICByZXR1cm4geyBraW5kOiAnb3RoZXItc2NoZW1lJywgc2NoZW1lOiAnKHVucGFyc2VhYmxlKScgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBraW5kOiAnaW50ZXJuYWwnLCBhYnNvbHV0ZVBhdGg6IHUucGF0aG5hbWUgfTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBhIHNpbmdsZSBsaW5rIGRpc2NvdmVyZWQgaW4gYSByZW5kZXJlZCBkb2N1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBocmVmIFRoZSByYXcgaHJlZi9zcmMgdmFsdWUuXG4gICAgICogQHBhcmFtIHNvdXJjZSBUaGUgcmVuZGVyZWQgZG9jdW1lbnQgKHJlbmRlclBhdGgpIHRoZSBsaW5rIHdhcyBmb3VuZCBpbi5cbiAgICAgKiBAcGFyYW0gYmFzZVZwYXRoIFRoZSB2cGF0aCBvZiB0aGUgY29udGFpbmluZyBkb2N1bWVudCwgdXNlZCB0byByZXNvbHZlXG4gICAgICogICByZWxhdGl2ZSBpbnRlcm5hbCBsaW5rcy4gIE9wdGlvbmFsLlxuICAgICAqL1xuICAgIGFzeW5jIGNoZWNrTGluayhocmVmOiBzdHJpbmcsIHNvdXJjZT86IHN0cmluZywgYmFzZVZwYXRoPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGMgPSB0aGlzLmNsYXNzaWZ5KGhyZWYsIGJhc2VWcGF0aCk7XG4gICAgICAgIHN3aXRjaCAoYy5raW5kKSB7XG4gICAgICAgICAgICBjYXNlICdhbmNob3InOlxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ290aGVyLXNjaGVtZSc6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuI29wdGlvbnMucmVwb3J0T3RoZXJTY2hlbWVzICE9PSAnaWdub3JlJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiNyZXBvcnQodGhpcy4jb3B0aW9ucy5yZXBvcnRPdGhlclNjaGVtZXMsICdvdGhlci1zY2hlbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZiwgc291cmNlLCBgbm9uLUhUVFAgbGluayAoJHtjLnNjaGVtZX0pYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ2ludGVybmFsJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy4jb3B0aW9ucy5pbnRlcm5hbCA9PT0gJ2lnbm9yZScpIHJldHVybjtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLiNjaGVja0ludGVybmFsKGhyZWYsIGMuYWJzb2x1dGVQYXRoLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgJ2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy4jb3B0aW9ucy5leHRlcm5hbCA9PT0gJ2lnbm9yZScpIHJldHVybjtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLiNjaGVja0V4dGVybmFsKGMudXJsLCBzb3VyY2UpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlc29sdmUgYW4gaW50ZXJuYWwgbGluayBhZ2FpbnN0IHRoZSBhc3NldHMgYW5kIGRvY3VtZW50cyBjYWNoZXMuICBUaGlzXG4gICAgICogbWlycm9ycyB0aGUgcmVzb2x1dGlvbiBsb2dpYyBpbiBgQW5jaG9yQ2xlYW51cGAgKGxpYi9idWlsdC1pbi50cyk6IGEgbGlua1xuICAgICAqIHRoYXQgcmVzb2x2ZXMgdG8gYW4gYXNzZXQsIGEgZG9jdW1lbnQsIGEgZGlyZWN0b3J5IGluZGV4LCBvciBhIHBhdGggYVxuICAgICAqIHBsdWdpbiBjbGFpbXMgdmlhIGBhc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWZgIGlzIHZhbGlkLlxuICAgICAqXG4gICAgICogQXMgYSBmaW5hbCBmYWxsYmFjaywgdGhlIHJlbmRlci1kZXN0aW5hdGlvbiBkaXJlY3Rvcnkgb24gZGlzayBpc1xuICAgICAqIGNvbnN1bHRlZCAoc2VlIHtAbGluayBMaW5rQ2hlY2tlci5leGlzdHNJblJlbmRlckRlc3RpbmF0aW9ufSkuXG4gICAgICogVGhpcyBsZXRzIHRoZSBjaGVja2VyIHJlY29nbml6ZSBmaWxlcyB3cml0dGVuIGRpcmVjdGx5IHRvIHRoZVxuICAgICAqIG91dHB1dCB0cmVlIGJ5IE1haGFmdW5jcyDigJQgZm9yIGV4YW1wbGUgdGhlIGRpYWdyYW0gaW1hZ2VzXG4gICAgICogcHJvZHVjZWQgYnkgYEBha2FzaGFjbXMvZGlhZ3JhbS1tYWtlcnNgJ3NcbiAgICAgKiBgPGRpYWdyYW1zLXBsYW50dW1sIG91dHB1dC1maWxlPVwi4oCmXCI+YC4gIFN1Y2ggZmlsZXMgYXJlIG5vdFxuICAgICAqIHRyYWNrZWQgaW4gYW55IEFrYXNoYVJlbmRlciBjYWNoZSwgYnV0IHRoZXkgKmFyZSogcHJlc2VudCBvblxuICAgICAqIGRpc2sgYnkgdGhlIHRpbWUgdGhlIGxpbmsgY2hlY2sgcnVucyAod2hpY2ggaXMgZnJvbSB0aGVcbiAgICAgKiBidWlsdC1pbiBwbHVnaW4ncyBgb25TaXRlUmVuZGVyZWRgLCBhZnRlciBhbGwgZG9jdW1lbnRzIGhhdmVcbiAgICAgKiBiZWVuIHJlbmRlcmVkKS5cbiAgICAgKi9cbiAgICBhc3luYyAjY2hlY2tJbnRlcm5hbChocmVmOiBzdHJpbmcsIGFic29sdXRlUGF0aDogc3RyaW5nLCBzb3VyY2U/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy4jYWthc2hhPy5maWxlY2FjaGU/LmFzc2V0c0NhY2hlO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLiNha2FzaGE/LmZpbGVjYWNoZT8uZG9jdW1lbnRzQ2FjaGU7XG5cbiAgICAgICAgLy8gQXNzZXRzLlxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGFzc2V0cyAmJiBhd2FpdCBhc3NldHMuZmluZChhYnNvbHV0ZVBhdGgpKSByZXR1cm47XG4gICAgICAgIH0gY2F0Y2ggeyAvKiBmYWxsIHRocm91Z2ggKi8gfVxuXG4gICAgICAgIC8vIFBsdWdpbi1jbGFpbWVkIGxvY2FsIGhyZWZzLlxuICAgICAgICBpZiAodHlwZW9mIHRoaXMuI2NvbmZpZz8uYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAmJiB0aGlzLiNjb25maWcuYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmKGFic29sdXRlUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERvY3VtZW50cy4gIEEgcm9vdCBvciBkaXJlY3RvcnkgbGluayBtYXBzIHRvIGl0cyBpbmRleC5odG1sLlxuICAgICAgICBsZXQgbG9va3VwID0gYWJzb2x1dGVQYXRoID09PSAnLycgPyAnL2luZGV4Lmh0bWwnIDogYWJzb2x1dGVQYXRoO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGZvdW5kID0gZG9jdW1lbnRzID8gYXdhaXQgZG9jdW1lbnRzLmZpbmQobG9va3VwKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChmb3VuZCAmJiBmb3VuZC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aC5qb2luKGxvb2t1cCwgJ2luZGV4Lmh0bWwnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybjtcbiAgICAgICAgfSBjYXRjaCB7IC8qIGZhbGwgdGhyb3VnaCAqLyB9XG5cbiAgICAgICAgLy8gUmVuZGVyLWRlc3RpbmF0aW9uIGZpbGVzeXN0ZW0gZmFsbGJhY2suICBIYW5kbGVzIGZpbGVzIHRoYXRcbiAgICAgICAgLy8gTWFoYWZ1bmNzIHdyb3RlIGRpcmVjdGx5IHRvIGBjb25maWcucmVuZGVyRGVzdGluYXRpb25gIGFuZFxuICAgICAgICAvLyB0aGF0IHRoZXJlZm9yZSBhcHBlYXIgaW4gbmVpdGhlciB0aGUgYXNzZXRzIG5vciBkb2N1bWVudHNcbiAgICAgICAgLy8gY2FjaGUgKGRpYWdyYW0gaW1hZ2VzLCBldGMuKS5cbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuI2V4aXN0c0luUmVuZGVyRGVzdGluYXRpb24oYWJzb2x1dGVQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4jcmVwb3J0KHRoaXMuI29wdGlvbnMuaW50ZXJuYWwsICdpbnRlcm5hbCcsIGhyZWYsIHNvdXJjZSxcbiAgICAgICAgICAgIGBpbnRlcm5hbCBsaW5rIG5vdCBmb3VuZCAoJHthYnNvbHV0ZVBhdGh9KWApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBgdHJ1ZWAgd2hlbiBhIHJlZ3VsYXIgZmlsZSBleGlzdHMgYXQgYGFic29sdXRlUGF0aGAgKGFcbiAgICAgKiBzaXRlLXJlbGF0aXZlLCBgL2Atcm9vdGVkIHBhdGgpIHVuZGVybmVhdGggdGhlIGNvbmZpZ3VyZWRcbiAgICAgKiB7QGxpbmsgQ29uZmlndXJhdGlvbi5yZW5kZXJEZXN0aW5hdGlvbn0uICBUaGUgcmVzdWx0IGlzIG1lbW9pemVkXG4gICAgICogaW4ge0BsaW5rIExpbmtDaGVja2VyLnJlbmRlckRlc3RGc0NhY2hlfSB0byBrZWVwIHJlcGVhdCBsb29rdXBzXG4gICAgICogY2hlYXAgZHVyaW5nIGEgZnVsbC1zaXRlIHNjYW4uXG4gICAgICpcbiAgICAgKiBHdWFyZHMgYWdhaW5zdCBwYXRoIHRyYXZlcnNhbDogYSBwYXRoIHRoYXQgcmVzb2x2ZXMgb3V0c2lkZVxuICAgICAqIGByZW5kZXJEZXN0aW5hdGlvbmAgaXMgdHJlYXRlZCBhcyBub3QgZm91bmQuXG4gICAgICpcbiAgICAgKiBBIGRpcmVjdG9yeSBtYXRjaCByZXR1cm5zIGBmYWxzZWAgYmVjYXVzZSBhIGJhcmUgZGlyZWN0b3J5IFVSTFxuICAgICAqIGlzIHNlcnZlZCAoaWYgYXQgYWxsKSBieSBhIGNvLWxvY2F0ZWQgYGluZGV4Lmh0bWxgLCBhbmQgdGhlXG4gICAgICogZG9jdW1lbnQtY2FjaGUgY2hlY2sgYWJvdmUgYWxyZWFkeSBoYW5kbGVkIHRoZSBgaW5kZXguaHRtbGBcbiAgICAgKiBsb29rdXAuICBPbmx5IHJlZ3VsYXIgZmlsZXMgY291bnQgaGVyZS5cbiAgICAgKi9cbiAgICBhc3luYyAjZXhpc3RzSW5SZW5kZXJEZXN0aW5hdGlvbihhYnNvbHV0ZVBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBjb25zdCByZW5kZXJEZXN0aW5hdGlvbiA9IHRoaXMuI2NvbmZpZz8ucmVuZGVyRGVzdGluYXRpb247XG4gICAgICAgIGlmICh0eXBlb2YgcmVuZGVyRGVzdGluYXRpb24gIT09ICdzdHJpbmcnIHx8IHJlbmRlckRlc3RpbmF0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgYWJzb2x1dGVQYXRoICE9PSAnc3RyaW5nJyB8fCBhYnNvbHV0ZVBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjYWNoZWQgPSB0aGlzLiNyZW5kZXJEZXN0RnNDYWNoZS5nZXQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKSByZXR1cm4gY2FjaGVkO1xuXG4gICAgICAgIC8vIFN0cmlwIGEgbGVhZGluZyBgL2AgYmVmb3JlIGpvaW5pbmcgc28gYHBhdGguam9pbmAgKHdoaWNoIGRvZXNcbiAgICAgICAgLy8gbm90IHRyZWF0IGAveGAgYXMgYWJzb2x1dGUtcmVsYXRpdmUtdG8tcmVuZGVyRGVzdGluYXRpb24gaW4gYVxuICAgICAgICAvLyByZWxpYWJsZSB3YXkgYWNyb3NzIHBsYXRmb3JtcykgY29tcG9zZXMgd2hhdCB3ZSBtZWFuLlxuICAgICAgICBjb25zdCByZWwgPSBhYnNvbHV0ZVBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IGFic29sdXRlUGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogYWJzb2x1dGVQYXRoO1xuICAgICAgICBjb25zdCBjYW5kaWRhdGUgPSBwYXRoLnJlc29sdmUocmVuZGVyRGVzdGluYXRpb24sIHJlbCk7XG5cbiAgICAgICAgLy8gQ29udGFpbm1lbnQgZ3VhcmQ6IHRoZSByZXNvbHZlZCBwYXRoIG11c3QgYmUgaW5zaWRlXG4gICAgICAgIC8vIHJlbmRlckRlc3RpbmF0aW9uLiAgVGhpcyBwcm90ZWN0cyBhZ2FpbnN0IGEgY3JhZnRlZCBgLi5gIGhyZWZcbiAgICAgICAgLy8gcmVhY2hpbmcgZmlsZXMgb3V0c2lkZSB0aGUgb3V0cHV0IHRyZWUuXG4gICAgICAgIGNvbnN0IHJvb3RXaXRoU2VwID0gcGF0aC5yZXNvbHZlKHJlbmRlckRlc3RpbmF0aW9uKSArIHBhdGguc2VwO1xuICAgICAgICBpZiAoY2FuZGlkYXRlICE9PSBwYXRoLnJlc29sdmUocmVuZGVyRGVzdGluYXRpb24pXG4gICAgICAgICAmJiAhY2FuZGlkYXRlLnN0YXJ0c1dpdGgocm9vdFdpdGhTZXApKSB7XG4gICAgICAgICAgICB0aGlzLiNyZW5kZXJEZXN0RnNDYWNoZS5zZXQoYWJzb2x1dGVQYXRoLCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb2sgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0ID0gYXdhaXQgZnNwLnN0YXQoY2FuZGlkYXRlKTtcbiAgICAgICAgICAgIG9rID0gc3QuaXNGaWxlKCk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgb2sgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiNyZW5kZXJEZXN0RnNDYWNoZS5zZXQoYWJzb2x1dGVQYXRoLCBvayk7XG4gICAgICAgIHJldHVybiBvaztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBhbiBleHRlcm5hbCBgaHR0cChzKWAgbGluayBvdmVyIHRoZSBuZXR3b3JrLCBob25vcmluZyB0aGUgd2hpdGVsaXN0LFxuICAgICAqIGRlZHVwbGljYXRpb24sIGFuZCB0aGUgVFRMIGNhY2hlLlxuICAgICAqL1xuICAgIGFzeW5jICNjaGVja0V4dGVybmFsKHVybDogc3RyaW5nLCBzb3VyY2U/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKGlzV2hpdGVsaXN0ZWQodXJsLCB0aGlzLiNvcHRpb25zLndoaXRlbGlzdCkpIHJldHVybjtcblxuICAgICAgICAvLyBEZWR1cGxpY2F0ZSAvIFRUTCBjYWNoZS5cbiAgICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy4jZXh0ZXJuYWxDYWNoZS5nZXQodXJsKTtcbiAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgbGV0IHJlc3VsdDogRXh0ZXJuYWxSZXN1bHQ7XG4gICAgICAgIGlmIChjYWNoZWQgJiYgKG5vdyAtIGNhY2hlZC5hdCkgPCB0aGlzLiNvcHRpb25zLmNhY2hlVFRMbXMpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGNhY2hlZC5yZXN1bHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLiNjaGVja2VyKHVybCwge1xuICAgICAgICAgICAgICAgIHVzZXJBZ2VudDogdGhpcy4jb3B0aW9ucy51c2VyQWdlbnQsXG4gICAgICAgICAgICAgICAgdGltZW91dE1zOiB0aGlzLiNvcHRpb25zLnRpbWVvdXRNcyxcbiAgICAgICAgICAgICAgICBtYXhSZWRpcmVjdHM6IHRoaXMuI29wdGlvbnMubWF4UmVkaXJlY3RzLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHRoaXMuI29wdGlvbnMuaGVhZGVyc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLiNleHRlcm5hbENhY2hlLnNldCh1cmwsIHsgcmVzdWx0LCBhdDogbm93IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlc3VsdC5zdGF0ZSA9PT0gJ09LJykgcmV0dXJuO1xuICAgICAgICAvLyBBIFdBUk4gcmVzdWx0IG5ldmVyIGVzY2FsYXRlcyBhYm92ZSAnd2Fybic7IGEgQlJPS0VOIHJlc3VsdCB1c2VzIHRoZVxuICAgICAgICAvLyBjb25maWd1cmVkIGV4dGVybmFsIG1vZGUuXG4gICAgICAgIGNvbnN0IG1vZGUgPSByZXN1bHQuc3RhdGUgPT09ICdXQVJOJ1xuICAgICAgICAgICAgPyAodGhpcy4jb3B0aW9ucy5leHRlcm5hbCA9PT0gJ2lnbm9yZScgPyAnaWdub3JlJyA6ICd3YXJuJylcbiAgICAgICAgICAgIDogdGhpcy4jb3B0aW9ucy5leHRlcm5hbDtcbiAgICAgICAgdGhpcy4jcmVwb3J0KG1vZGUsICdleHRlcm5hbCcsIHVybCwgc291cmNlLFxuICAgICAgICAgICAgYGV4dGVybmFsIGxpbmsgJHtyZXN1bHQuc3RhdGUudG9Mb3dlckNhc2UoKX0gKEhUVFAgJHtyZXN1bHQuc3RhdHVzfSlgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDZW50cmFsIHNldmVyaXR5IGhhbmRsZXIuICBgaWdub3JlYCBkb2VzIG5vdGhpbmc7IGB3YXJuYCBsb2dzOyBgZXJyb3JgXG4gICAgICogbG9ncyBhbmQgY29sbGVjdHMgdGhlIGZhaWx1cmUgZm9yIHtAbGluayBmaW5pc2h9OyBgZmF0YWxgIGxvZ3MgYW5kIHRocm93c1xuICAgICAqIGltbWVkaWF0ZWx5LlxuICAgICAqL1xuICAgICNyZXBvcnQobW9kZTogTGlua0NoZWNrTW9kZSwga2luZDogTGlua0tpbmQsIGhyZWY6IHN0cmluZyxcbiAgICAgICAgICAgIHNvdXJjZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBkZXRhaWw6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpZiAobW9kZSA9PT0gJ2lnbm9yZScpIHJldHVybjtcbiAgICAgICAgY29uc3Qgd2hlcmUgPSBzb3VyY2UgPyBgIGluICR7c291cmNlfWAgOiAnJztcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBMaW5rIGNoZWNrICgke2tpbmR9KTogJHtkZXRhaWx9IOKAlCAke2hyZWZ9JHt3aGVyZX1gO1xuICAgICAgICBpZiAobW9kZSA9PT0gJ3dhcm4nKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFdBUk5JTkc6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBlcnJvciBhbmQgZmF0YWwgYm90aCByZWNvcmQgdGhlIGZhaWx1cmUuXG4gICAgICAgIHRoaXMuI2Vycm9ycy5wdXNoKHsga2luZCwgaHJlZiwgc291cmNlLCBkZXRhaWwgfSk7XG4gICAgICAgIGlmIChtb2RlID09PSAnZmF0YWwnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFUlJPUjogJHttZXNzYWdlfWApO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVycm9yOiBsb2cgbm93LCB0aHJvdyBsYXRlciBpbiBmaW5pc2goKS5cbiAgICAgICAgY29uc29sZS5lcnJvcihgRVJST1I6ICR7bWVzc2FnZX1gKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgYWZ0ZXIgYWxsIGxpbmtzIGhhdmUgYmVlbiBjaGVja2VkLiAgSWYgYW55IGBlcnJvcmAtbW9kZSBmYWlsdXJlc1xuICAgICAqIHdlcmUgY29sbGVjdGVkLCB0aHJvd3MgYSBzaW5nbGUgRXJyb3Igc3VtbWFyaXppbmcgdGhlbSwgd2hpY2ggY2F1c2VzIHRoZVxuICAgICAqIHJlbmRlciBydW4gdG8gZmFpbC5cbiAgICAgKi9cbiAgICBmaW5pc2goKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLiNlcnJvcnMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGxpbmVzID0gdGhpcy4jZXJyb3JzLm1hcChlID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlID0gZS5zb3VyY2UgPyBgIGluICR7ZS5zb3VyY2V9YCA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGAgIC0gJHtlLmtpbmR9OiAke2UuZGV0YWlsfSDigJQgJHtlLmhyZWZ9JHt3aGVyZX1gO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYExpbmsgY2hlY2sgZm91bmQgJHt0aGlzLiNlcnJvcnMubGVuZ3RofSBiYWQgbGluayhzKTpcXG4ke2xpbmVzLmpvaW4oJ1xcbicpfWBcbiAgICAgICAgKTtcbiAgICB9XG59XG4iXX0=