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
var _BuiltInPlugin_instances, _BuiltInPlugin_config, _BuiltInPlugin_resize_queue, _BuiltInPlugin_checkSiteLinks;
import fsp from 'node:fs/promises';
import path from 'node:path';
import util from 'node:util';
import sharp from 'sharp';
import * as uuid from 'uuid';
const uuidv1 = uuid.v1;
import { Plugin } from './Plugin.js';
import relative from 'relative';
import hljs from 'highlight.js';
import mahabhuta from 'mahabhuta';
import mahaMetadata from 'mahabhuta/maha/metadata.js';
import { encode } from 'html-entities';
import { CustomElement, Munger, PageProcessor, resolveVpath, doHTMLAttribute } from './index.js';
import { inferFormat, parseTableData } from './csv-table.js';
import { LinkChecker, DEFAULT_LINK_CHECK_OPTIONS, assertMode, hasUrlScheme } from './link-checker.js';
const pluginName = "akashacms-builtin";
export class BuiltInPlugin extends Plugin {
    constructor() {
        super(pluginName);
        _BuiltInPlugin_instances.add(this);
        _BuiltInPlugin_config.set(this, void 0);
        _BuiltInPlugin_resize_queue.set(this, void 0);
        __classPrivateFieldSet(this, _BuiltInPlugin_resize_queue, [], "f");
    }
    configure(config, options) {
        __classPrivateFieldSet(this, _BuiltInPlugin_config, config, "f");
        // this.config = config;
        this.akasha = config.akasha;
        this.options = options ? options : {};
        this.options.config = config;
        if (typeof this.options.relativizeHeadLinks === 'undefined') {
            this.options.relativizeHeadLinks = true;
        }
        if (typeof this.options.relativizeScriptLinks === 'undefined') {
            this.options.relativizeScriptLinks = true;
        }
        if (typeof this.options.relativizeBodyLinks === 'undefined') {
            this.options.relativizeBodyLinks = true;
        }
        // Link-checking options.  See lib/link-checker.ts.  Defaults leave
        // external checking off ('ignore') because it is slow and flaky, and
        // internal checking at 'warn'.  A user may override any of these via
        // config or the chainable setters below.
        this.options.checkLinks = Object.assign({}, DEFAULT_LINK_CHECK_OPTIONS, this.options.checkLinks || {});
        let moduleDirname = import.meta.dirname;
        // Need this as the place to store Nunjucks macros and templates
        config.addLayoutsDir(path.join(moduleDirname, '..', 'layouts'));
        config.addPartialsDir(path.join(moduleDirname, '..', 'partials'));
        // Do not need this here any longer because it is handled
        // in the Configuration constructor.  The idea is to put
        // mahaPartial as the very first Mahafunc so that all
        // Partial's are handled before anything else.  The issue causing
        // this change is the OpenGraphPromoteImages Mahafunc in
        // akashachs-base and processing any images brought in by partials.
        // Ensuring the partial tag is processed before OpenGraphPromoteImages
        // meant such images were properly promoted.
        // config.addMahabhuta(mahaPartial.mahabhutaArray({
        //     renderPartial: options.renderPartial
        // }));
        config.addMahabhuta(mahaMetadata.mahabhutaArray({
        // Do not pass this through so that Mahabhuta will not
        // make absolute links to subdirectories
        // root_url: config.root_url
        // TODO how to configure this
        // sitemap_title: ....?
        }));
        config.addMahabhuta(mahabhutaArray(options, config, this.akasha, this));
        const njk = this.config.findRendererName('.html.njk');
        njk.njkenv().addExtension('akstylesheets', new stylesheetsExtension(this.config, this, njk));
        njk.njkenv().addExtension('akheaderjs', new headerJavaScriptExtension(this.config, this, njk));
        njk.njkenv().addExtension('akfooterjs', new footerJavaScriptExtension(this.config, this, njk));
        // Verify that the extensions were installed
        for (const ext of [
            'akstylesheets',
            'akheaderjs',
            'akfooterjs'
        ]) {
            if (!njk.njkenv().hasExtension(ext)) {
                throw new Error(`Configure - NJK does not have extension - ${ext}`);
            }
        }
        // try {
        //     njk.njkenv().addExtension('aknjktest', new testExtension());
        // } catch (err) {
        //     console.error(err.stack());
        // }
        // if (!njk.njkenv().hasExtension('aknjktest')) {
        //     console.error(`aknjktest extension not added?`);
        // } else {
        //     console.log(`aknjktest exists`);
        // }
    }
    get config() { return __classPrivateFieldGet(this, _BuiltInPlugin_config, "f"); }
    // get resizequeue() { return this.#resize_queue; }
    get resizequeue() { return __classPrivateFieldGet(this, _BuiltInPlugin_resize_queue, "f"); }
    /**
     * Determine whether <link> tags in the <head> for local
     * URLs are relativized or absolutized.
     */
    set relativizeHeadLinks(rel) {
        this.options.relativizeHeadLinks = rel;
    }
    /**
     * Determine whether <script> tags for local
     * URLs are relativized or absolutized.
     */
    set relativizeScriptLinks(rel) {
        this.options.relativizeScriptLinks = rel;
    }
    /**
     * Determine whether <A> tags for local
     * URLs are relativized or absolutized.
     */
    set relativizeBodyLinks(rel) {
        this.options.relativizeBodyLinks = rel;
    }
    /**
     * Set the severity mode for internal (local) link checking.
     * One of 'ignore' | 'warn' | 'error' | 'fatal'.
     */
    setInternalLinkMode(config, mode) {
        assertMode(mode, 'internal');
        this.options.checkLinks.internal = mode;
        return this;
    }
    /**
     * Set the severity mode for external (http/https) link checking.
     * One of 'ignore' | 'warn' | 'error' | 'fatal'.  'ignore' (the default)
     * disables external checking.
     */
    setExternalLinkMode(config, mode) {
        assertMode(mode, 'external');
        this.options.checkLinks.external = mode;
        return this;
    }
    /**
     * Set the severity mode for non-HTTP links (mailto:, tel:, ...).
     * One of 'ignore' | 'warn' | 'error' | 'fatal'.  'ignore' (the default)
     * silently skips them; 'warn' logs them for review.
     */
    setOtherSchemesMode(config, mode) {
        assertMode(mode, 'reportOtherSchemes');
        this.options.checkLinks.reportOtherSchemes = mode;
        return this;
    }
    /**
     * Add an external domain or URL (string) or RegExp to the link-check
     * whitelist.  Whitelisted external URLs are assumed valid and never fetched.
     */
    addLinkCheckWhitelist(config, entry) {
        if (!Array.isArray(this.options.checkLinks.whitelist)) {
            this.options.checkLinks.whitelist = [];
        }
        this.options.checkLinks.whitelist.push(entry);
        return this;
    }
    /**
     * Select which external per-URL checker to use: 'fetch' (built-in,
     * zero-dependency) or 'link-check' (lazy-loads the site-author-installed
     * `link-check` package).
     */
    setExternalChecker(config, which) {
        this.options.checkLinks.externalChecker = which;
        return this;
    }
    doStylesheets(metadata) {
        return _doStylesheets(metadata, this.options, this.config);
    }
    doHeaderJavaScript(metadata) {
        return _doHeaderJavaScript(metadata, this.options, this.config);
    }
    doFooterJavaScript(metadata) {
        return _doFooterJavaScript(metadata, this.options, this.config);
    }
    addImageToResize(src, resizewidth, resizeto, docPath) {
        // console.log(`addImageToResize ${src} resizewidth ${resizewidth} resizeto ${resizeto}`)
        __classPrivateFieldGet(this, _BuiltInPlugin_resize_queue, "f").push({ src, resizewidth, resizeto, docPath });
    }
    // This section was added in the possibility of
    // moving tagged-content into the core.
    // After trying this, that seems like a non-starter
    // of a project idea.
    // #pathIndexes: string;
    // set pathIndexes(indexes) { this.#pathIndexes = indexes; }
    // get pathIndexes()        { return this.#pathIndexes; }
    // tagPageUrl(config, tagName) {
    //     if (typeof this.#pathIndexes !== 'string') {
    //         console.error(`BuiltInPlugin pathIndexes has not been set ${util.inspect(this.#pathIndexes)}`);
    //     }
    //     if (this.pathIndexes.endsWith('/')) {
    //         return this.pathIndexes + tag2encode4url(tagName) +'.html';
    //     } else {
    //         return this.pathIndexes +'/'+ tag2encode4url(tagName) +'.html';
    //     }
    // }
    // async doTagsForDocument(config, metadata, template) {
    //     const documents = this.akasha.filecache.documentsCache;
    //     const plugin = this;
    //         console.log('doTagsForDocument '+ util.inspect(metadata));
    //     const taglist = (
    //             'tags' in metadata
    //           && Array.isArray(metadata.tags)
    //         ) ? metadata.tags : [];
    //     if (taglist) {
    //         const tagzlist = [];
    //         for (const tag of taglist) {
    //             tagzlist.push({
    //                 tagName: tag,
    //                 tagUrl: plugin.tagPageUrl(config, tag),
    //                 description: await documents.getTagDescription(tag)
    //             });
    //         }
    //         console.log('doTagsForDocument '+ util.inspect(taglist));
    //         return this.akasha.partial(config, template, {
    //             tagz: tagzlist
    //         });
    //     } else return "";
    // }
    async onSiteRendered(config) {
        const documents = this.akasha.filecache.documentsCache;
        // await documents.isReady();
        const assets = this.akasha.filecache.assetsCache;
        // await assets.isReady();
        while (Array.isArray(__classPrivateFieldGet(this, _BuiltInPlugin_resize_queue, "f"))
            && __classPrivateFieldGet(this, _BuiltInPlugin_resize_queue, "f").length > 0) {
            let toresize = __classPrivateFieldGet(this, _BuiltInPlugin_resize_queue, "f").pop();
            let img2resize;
            if (!path.isAbsolute(toresize.src)) {
                img2resize = path.normalize(path.join(path.dirname(toresize.docPath), toresize.src));
            }
            else {
                img2resize = toresize.src;
            }
            let srcfile = undefined;
            let found = await assets.find(img2resize);
            if (found) {
                srcfile = found.fspath;
            }
            else {
                found = await documents.find(img2resize);
                srcfile = found ? found.fspath : undefined;
            }
            if (!srcfile)
                throw new Error(`akashacms-builtin: Did not find source file for image to resize ${img2resize}`);
            try {
                let img = await sharp(srcfile);
                let resized = await img.resize(Number.parseInt(toresize.resizewidth));
                // We need to compute the correct destination path
                // for the resized image
                let imgtoresize = toresize.resizeto ? toresize.resizeto : img2resize;
                let resizedest;
                if (path.isAbsolute(imgtoresize)) {
                    resizedest = path.join(config.renderDestination, imgtoresize);
                }
                else {
                    // This is for relative image paths, hence it needs to be
                    // relative to the docPath
                    resizedest = path.join(config.renderDestination, path.dirname(toresize.docPath), imgtoresize);
                }
                // Make sure the destination directory exists
                await fsp.mkdir(path.dirname(resizedest), { recursive: true });
                await resized.toFile(resizedest);
            }
            catch (e) {
                throw new Error(`built-in: Image resize failed for ${srcfile} (toresize ${util.inspect(toresize)} found ${util.inspect(found)}) because ${e}`);
            }
        }
        // After all files are rendered, optionally check the site's links.
        await __classPrivateFieldGet(this, _BuiltInPlugin_instances, "m", _BuiltInPlugin_checkSiteLinks).call(this, config);
    }
}
_BuiltInPlugin_config = new WeakMap(), _BuiltInPlugin_resize_queue = new WeakMap(), _BuiltInPlugin_instances = new WeakSet(), _BuiltInPlugin_checkSiteLinks = 
/**
 * Walk every rendered HTML file and check the links it contains, using the
 * configured link-check modes.  Internal links are resolved against the
 * caches; external links are validated over the network (when enabled);
 * non-HTTP links are optionally logged.  This is skipped entirely unless at
 * least one class of checking is enabled.
 */
async function _BuiltInPlugin_checkSiteLinks(config) {
    const opts = this.options?.checkLinks;
    const checker = new LinkChecker(config, this.akasha, opts);
    if (!checker.enabled)
        return;
    const documents = this.akasha.filecache.documentsCache;
    // All documents that render to a .html file.
    const htmlDocs = await documents.search({
        renderpathmatch: '\\.html$'
    });
    // Collect all links first so the external checker deduplicates work.
    // Each entry pairs an href with the rendered document it came from.
    const links = [];
    for (const doc of htmlDocs) {
        const renderPath = doc.renderPath;
        const fspath = path.join(config.renderDestination, renderPath);
        let html;
        try {
            html = await fsp.readFile(fspath, 'utf8');
        }
        catch (e) {
            // The file may not have been written (e.g. non-HTML renderer);
            // skip it rather than failing the whole scan.
            continue;
        }
        let $;
        try {
            $ = mahabhuta.parse(html);
        }
        catch (e) {
            continue;
        }
        const collect = (selector, attr) => {
            $(selector).each((i, el) => {
                const href = $(el).attr(attr);
                if (typeof href === 'string' && href.length > 0) {
                    links.push({ href, source: renderPath, vpath: doc.vpath });
                }
            });
        };
        collect('a[href]', 'href');
        collect('link[href]', 'href');
        collect('script[src]', 'src');
        collect('img[src]', 'src');
    }
    for (const link of links) {
        await checker.checkLink(link.href, link.source, link.vpath);
    }
    // Throws if any 'error'-mode failures were collected, failing the run.
    checker.finish();
};
export const mahabhutaArray = function (options, config, akasha, plugin) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    // ret.addMahafunc(new TagsForDocumentElement(config, akasha, plugin));
    ret.addMahafunc(new StylesheetsElement(config, akasha, plugin));
    ret.addMahafunc(new HeaderJavaScript(config, akasha, plugin));
    ret.addMahafunc(new FooterJavaScript(config, akasha, plugin));
    ret.addMahafunc(new InsertTeaser(config, akasha, plugin));
    ret.addMahafunc(new CodeEmbed(config, akasha, plugin));
    ret.addMahafunc(new CsvTable(config, akasha, plugin));
    ret.addMahafunc(new AkBodyClassAdd(config, akasha, plugin));
    ret.addMahafunc(new FigureImage(config, akasha, plugin));
    ret.addMahafunc(new img2figureImage(config, akasha, plugin));
    ret.addMahafunc(new ImageRewriter(config, akasha, plugin));
    ret.addMahafunc(new DocumentGroup(config, akasha, plugin));
    ret.addMahafunc(new ShowContent(config, akasha, plugin));
    ret.addMahafunc(new SelectElements(config, akasha, plugin));
    ret.addMahafunc(new AnchorCleanup(config, akasha, plugin));
    ret.addMahafunc(new HeadLinkRelativizer(config, akasha, plugin));
    ret.addMahafunc(new ScriptRelativizer(config, akasha, plugin));
    ret.addFinalMahafunc(new MungedAttrRemover(config, akasha, plugin));
    ret.addFinalMahafunc(new BlankLinkDefanger(config, akasha, plugin));
    return ret;
};
// class TagsForDocumentElement extends CustomElement {
//     get elementName() { return "ak-tags-for-document"; }
//     async process($element, metadata, dirty, done) {
//         const plugin = this.config.plugin(pluginName);
//         return await plugin.doTagsForDocument(this.config,
//                 metadata, "ak_document_tags.html.njk");
//     }
// }
function _doStylesheets(metadata, options, config) {
    // console.log(`_doStylesheets ${util.inspect(metadata)}`);
    var scripts;
    if (typeof metadata.headerStylesheetsAdd !== "undefined") {
        scripts = config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
    }
    else {
        scripts = config.scripts ? config.scripts.stylesheets : undefined;
    }
    // console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(config.scripts)} ${util.inspect(scripts)}`);
    if (!options)
        throw new Error('_doStylesheets no options');
    if (!config)
        throw new Error('_doStylesheets no config');
    var ret = '';
    if (typeof scripts !== 'undefined') {
        for (var style of scripts) {
            let stylehref = style.href;
            let uHref = new URL(style.href, 'http://example.com');
            // console.log(`_doStylesheets process ${stylehref}`);
            if (uHref.origin === 'http://example.com') {
                // This is a local URL
                // Only relativize if desired
                // The bit with 'http://example.com' means there
                // won't be an exception thrown for a local URL.
                // But, in such a case, uHref.pathname would
                // start with a slash.  Therefore, to correctly
                // determine if this URL is absolute we must check
                // with the original URL string, which is in
                // the stylehref variable.
                if (options.relativizeHeadLinks
                    && path.isAbsolute(stylehref)) {
                    /* if (!metadata) {
                        console.log(`_doStylesheets NO METADATA`);
                    } else if (!metadata.document) {
                        console.log(`_doStylesheets NO METADATA DOCUMENT`);
                    } else if (!metadata.document.renderTo) {
                        console.log(`_doStylesheets NO METADATA DOCUMENT RENDERTO`);
                    } else {
                        console.log(`_doStylesheets relative(/${metadata.document.renderTo}, ${stylehref}) = ${relative('/'+metadata.document.renderTo, stylehref)}`)
                    } */
                    let newHref = relative(`/${metadata.document.renderTo}`, stylehref);
                    // console.log(`_doStylesheets absolute stylehref ${stylehref} in ${util.inspect(metadata.document)} rewrote to ${newHref}`);
                    stylehref = newHref;
                }
            }
            const doStyleMedia = (media) => {
                if (media) {
                    return `media="${encode(media)}"`;
                }
                else {
                    return '';
                }
            };
            let ht = `<link rel="stylesheet" type="text/css" href="${encode(stylehref)}" ${doStyleMedia(style.media)}/>`;
            ret += ht;
            // The issue with this and other instances
            // is that this tended to result in
            //
            //   <html><body><link..></body></html>
            //
            // When it needed to just be the <link> tag.
            // In other words, it tried to create an entire
            // HTML document.  While there was a way around
            // this - $('selector').prop('outerHTML')
            // This also seemed to be an overhead
            // we can avoid.
            //
            // The pattern is to use Template Strings while
            // being careful to encode values safely for use
            // in an attribute.  The "encode" function does
            // the encoding.
            //
            // See https://github.com/akashacms/akasharender/issues/49
            // let $ = mahabhuta.parse('<link rel="stylesheet" type="text/css" href=""/>');
            // $('link').attr('href', stylehref);
            // if (style.media) {
            //     $('link').attr('media', style.media);
            // }
            // ret += $.html();
        }
        // console.log(`_doStylesheets ${ret}`);
    }
    return ret;
}
function _doJavaScripts(metadata, scripts, options, config) {
    var ret = '';
    if (!scripts)
        return ret;
    if (!options)
        throw new Error('_doJavaScripts no options');
    if (!config)
        throw new Error('_doJavaScripts no config');
    for (var script of scripts) {
        if (!script.href && !script.script) {
            throw new Error(`Must specify either href or script in ${util.inspect(script)}`);
        }
        if (!script.script)
            script.script = '';
        const doType = (lang) => {
            if (lang) {
                return `type="${encode(lang)}"`;
            }
            else {
                return '';
            }
        };
        const doHref = (href) => {
            if (href) {
                let scripthref = href;
                let uHref = new URL(href, 'http://example.com');
                if (uHref.origin === 'http://example.com') {
                    // This is a local URL
                    // Only relativize if desired
                    if (options.relativizeScriptLinks
                        && path.isAbsolute(scripthref)) {
                        let newHref = relative(`/${metadata.document.renderTo}`, scripthref);
                        // console.log(`_doJavaScripts absolute scripthref ${scripthref} in ${util.inspect(metadata.document)} rewrote to ${newHref}`);
                        scripthref = newHref;
                    }
                }
                return `src="${encode(scripthref)}"`;
            }
            else {
                return '';
            }
        };
        let ht = `<script ${doType(script.lang)} ${doHref(script.href)}>${script.script}</script>`;
        ret += ht;
    }
    return ret;
}
function _doHeaderJavaScript(metadata, options, config) {
    var scripts;
    if (typeof metadata.headerJavaScriptAddTop !== "undefined") {
        scripts = config.scripts.javaScriptTop.concat(metadata.headerJavaScriptAddTop);
    }
    else {
        scripts = config.scripts ? config.scripts.javaScriptTop : undefined;
    }
    // console.log(`_doHeaderJavaScript ${util.inspect(scripts)}`);
    // console.log(`_doHeaderJavaScript ${util.inspect(config.scripts)}`);
    return _doJavaScripts(metadata, scripts, options, config);
}
function _doFooterJavaScript(metadata, options, config) {
    var scripts;
    if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
        scripts = config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
    }
    else {
        scripts = config.scripts ? config.scripts.javaScriptBottom : undefined;
    }
    return _doJavaScripts(metadata, scripts, options, config);
}
class StylesheetsElement extends CustomElement {
    get elementName() { return "ak-stylesheets"; }
    async process($element, metadata, setDirty, done) {
        let ret = _doStylesheets(metadata, this.array.options, this.config);
        // console.log(`StylesheetsElement `, ret);
        return ret;
    }
}
class HeaderJavaScript extends CustomElement {
    get elementName() { return "ak-headerJavaScript"; }
    async process($element, metadata, setDirty, done) {
        let ret = _doHeaderJavaScript(metadata, this.array.options, this.config);
        // console.log(`HeaderJavaScript `, ret);
        return ret;
    }
}
class FooterJavaScript extends CustomElement {
    get elementName() { return "ak-footerJavaScript"; }
    async process($element, metadata, dirty) {
        return _doFooterJavaScript(metadata, this.array.options, this.config);
    }
}
class HeadLinkRelativizer extends Munger {
    get selector() { return "html head link"; }
    get elementName() { return "html head link"; }
    async process($, $link, metadata, dirty) {
        // Only relativize if desired
        if (!this.array.options.relativizeHeadLinks)
            return;
        let href = $link.attr('href');
        let uHref = new URL(href, 'http://example.com');
        if (uHref.origin === 'http://example.com') {
            // It's a local link
            if (path.isAbsolute(href)) {
                // It's an absolute local link
                let newHref = relative(`/${metadata.document.renderTo}`, href);
                $link.attr('href', newHref);
            }
        }
    }
}
class ScriptRelativizer extends Munger {
    get selector() { return "script"; }
    get elementName() { return "script"; }
    async process($, $link, metadata, dirty) {
        // Only relativize if desired
        if (!this.array.options.relativizeScriptLinks)
            return;
        let href = $link.attr('src');
        if (href) {
            // There is a link
            let uHref = new URL(href, 'http://example.com');
            if (uHref.origin === 'http://example.com') {
                // It's a local link
                if (path.isAbsolute(href)) {
                    // It's an absolute local link
                    let newHref = relative(`/${metadata.document.renderTo}`, href);
                    $link.attr('src', newHref);
                }
            }
        }
    }
}
class InsertTeaser extends CustomElement {
    get elementName() { return "ak-teaser"; }
    async process($element, metadata, dirty) {
        try {
            return this.akasha.partial(this.config, "ak_teaser.html.njk", {
                teaser: typeof metadata["ak-teaser"] !== "undefined"
                    ? metadata["ak-teaser"] : metadata.teaser
            });
        }
        catch (e) {
            console.error(`InsertTeaser caught error `, e);
            throw e;
        }
    }
}
class AkBodyClassAdd extends PageProcessor {
    async process($, metadata, dirty) {
        if (typeof metadata.akBodyClassAdd !== 'undefined'
            && metadata.akBodyClassAdd != ''
            && $('html body').get(0)) {
            return new Promise((resolve, reject) => {
                if (!$('html body').hasClass(metadata.akBodyClassAdd)) {
                    $('html body').addClass(metadata.akBodyClassAdd);
                }
                resolve(undefined);
            });
        }
        else
            return Promise.resolve('');
    }
}
class CodeEmbed extends CustomElement {
    get elementName() { return "code-embed"; }
    async process($element, metadata, dirty) {
        // console.log(`CodeEmbed process ${util.inspect(metadata.document, false, 10)}`);
        const fn = $element.attr('file-name');
        const lang = $element.attr('lang');
        const id = $element.attr('id');
        if (!fn || fn === '') {
            throw new Error(`code-embed must have file-name argument, got ${fn}`);
        }
        let txtpath;
        if (path.isAbsolute(fn)) {
            txtpath = fn;
        }
        else {
            txtpath = path.join(path.dirname(metadata.document.renderTo), fn);
        }
        const documents = this.akasha.filecache.documentsCache;
        const found = await documents.find(txtpath);
        if (!found) {
            throw new Error(`code-embed file-name ${fn} does not refer to usable file`);
        }
        const txt = await fsp.readFile(found.fspath, 'utf8');
        const doLang = (lang) => {
            if (lang) {
                return `class="hljs ${encode(lang)}"`;
            }
            else {
                return 'class="hljs"';
            }
        };
        const doID = (id) => {
            if (id) {
                return `id="${encode(id)}"`;
            }
            else {
                return '';
            }
        };
        const doCode = (lang, code) => {
            if (lang && lang != '') {
                return hljs.highlight(code, {
                    language: lang
                }).value;
            }
            else {
                return hljs.highlightAuto(code).value;
            }
        };
        let ret = `<pre ${doID(id)}><code ${doLang(lang)}>${doCode(lang, txt)}</code></pre>`;
        return ret;
        // let $ = mahabhuta.parse(`<pre><code></code></pre>`);
        // if (lang && lang !== '') {
        //     $('code').addClass(lang);
        // }
        // $('code').addClass('hljs');
        // if (id && id !== '') {
        //     $('pre').attr('id', id);
        // }
        // if (lang && lang !== '') {
        //     $('code').append(hljs.highlight(txt, {
        //         language: lang
        //     }).value);
        // } else {
        //     $('code').append(hljs.highlightAuto(txt).value);
        // }
        // return $.html();
    }
}
/**
 * Resolve a `<csv-table>` `file-name` to an absolute filesystem path.
 *
 * A data file may live in an assets directory, a documents directory, or
 * outside the project directories entirely (so the raw data is not copied
 * into the deployed site).  Resolution is tried in that order:
 *
 * 1. The assets cache, then the documents cache — a relative `file-name` is
 *    first resolved against the current document's directory (as in
 *    `CodeEmbed`).
 * 2. A real filesystem path: absolute paths are used as-is, relative paths
 *    resolve against `config.configDir` (the directory of the project's
 *    configuration file), matching how relative `assetsDirs`/`documentsDirs`
 *    are resolved.
 *
 * @returns The absolute filesystem path, or undefined if not found.
 */
async function resolveDataFile(config, akasha, metadata, fn) {
    const candidate = path.isAbsolute(fn)
        ? fn
        : path.join(path.dirname(metadata.document.renderTo), fn);
    let found = await akasha.filecache.assetsCache.find(candidate);
    if (found)
        return found.fspath;
    found = await akasha.filecache.documentsCache.find(candidate);
    if (found)
        return found.fspath;
    // External file outside the project directories.  Relative paths resolve
    // against config.configDir; absolute paths are used as-is.
    const external = path.isAbsolute(fn)
        ? fn
        : (config.configDir
            ? path.resolve(config.configDir, fn)
            : path.resolve(fn));
    try {
        await fsp.access(external);
        return external;
    }
    catch {
        return undefined;
    }
}
class CsvTable extends CustomElement {
    get elementName() { return "csv-table"; }
    async process($element, metadata, dirty) {
        const fn = $element.attr('file-name');
        if (!fn || fn === '') {
            throw new Error(`csv-table must have file-name attribute, got ${fn}`);
        }
        const rowTemplate = $element.attr('template');
        if (!rowTemplate || rowTemplate === '') {
            throw new Error(`csv-table must have template attribute, got ${rowTemplate}`);
        }
        const beforeTemplate = $element.attr('before-template') || 'ak_csvtable_before.html.njk';
        const afterTemplate = $element.attr('after-template') || 'ak_csvtable_after.html.njk';
        const explicitFormat = $element.attr('format');
        const delimiter = $element.attr('delimiter');
        const header = $element.attr('header');
        // Resolve the data file: assets, then documents, then a filesystem
        // path outside the project directories.
        const fspath = await resolveDataFile(this.config, this.akasha, metadata, fn);
        if (!fspath) {
            throw new Error(`csv-table file-name ${fn} not found in assets, documents, or on disk`);
        }
        const text = await fsp.readFile(fspath, 'utf8');
        // Parse into the normalized row model.
        const format = inferFormat(fn, explicitFormat);
        const { columns, rows } = parseTableData(text, format, {
            delimiter,
            header: typeof header === 'string' ? header !== 'false' : true,
        });
        // Render the before template, each row, then the after template.
        let out = await this.akasha.partial(this.config, beforeTemplate, { columns, rowCount: rows.length });
        for (const row of rows) {
            try {
                out += await this.akasha.partial(this.config, rowTemplate, row);
            }
            catch (e) {
                throw new Error(`csv-table failed rendering row ${row.index} of ${fn} with template ${rowTemplate}: ${e}`);
            }
        }
        out += await this.akasha.partial(this.config, afterTemplate, { columns, rowCount: rows.length });
        return out;
    }
}
class FigureImage extends CustomElement {
    get elementName() { return "fig-img"; }
    async process($element, metadata, dirty) {
        var template = $element.attr('template');
        if (!template)
            template = 'ak_figimg.html.njk';
        const href = $element.attr('href');
        if (!href)
            throw new Error('fig-img must receive an href');
        const clazz = $element.attr('class');
        const id = $element.attr('id');
        const caption = $element.html();
        const width = $element.attr('width');
        const style = $element.attr('style');
        const dest = $element.attr('dest');
        return this.akasha.partial(this.config, template, {
            href, clazz, id, caption, width, style, dest
        });
    }
}
class img2figureImage extends CustomElement {
    get elementName() { return 'html body img[figure]'; }
    async process($element, metadata, dirty, done) {
        // console.log($element);
        const template = $element.attr('template')
            ? $element.attr('template')
            : "ak_figimg.html.njk";
        const id = $element.attr('id');
        const clazz = $element.attr('class');
        const style = $element.attr('style');
        const width = $element.attr('width');
        const src = $element.attr('src');
        const dest = $element.attr('dest');
        const resizewidth = $element.attr('resize-width');
        const resizeto = $element.attr('resize-to');
        const content = $element.attr('caption')
            ? $element.attr('caption')
            : "";
        return this.akasha.partial(this.config, template, {
            id, clazz, style, width, href: src, dest, resizewidth, resizeto,
            caption: content
        });
    }
}
class ImageRewriter extends Munger {
    get selector() { return "html body img"; }
    get elementName() { return "html body img"; }
    async process($, $link, metadata, dirty) {
        // console.log($element);
        // We only do rewrites for local images
        let src = $link.attr('src');
        // For local URLs, this new URL call will
        // make uSrc.origin === http://example.com
        // Hence, if some other domain appears
        // then we konw it's not a local image.
        const uSrc = new URL(src, 'http://example.com');
        if (uSrc.origin !== 'http://example.com') {
            return "ok";
        }
        // Are we asked to resize the image?
        const resizewidth = $link.attr('resize-width');
        const resizeto = $link.attr('resize-to');
        if (resizewidth) {
            // Add to a queue that is run at the end 
            this.config.plugin(pluginName)
                .addImageToResize(src, resizewidth, resizeto, metadata.document.renderTo);
            if (resizeto) {
                $link.attr('src', resizeto);
                src = resizeto;
            }
            // These are no longer needed
            $link.removeAttr('resize-width');
            $link.removeAttr('resize-to');
        }
        // The idea here is for every local image src to be a relative URL
        if (path.isAbsolute(src)) {
            let newSrc = relative(`/${metadata.document.renderTo}`, src);
            $link.attr('src', newSrc);
            // console.log(`ImageRewriter absolute image path ${src} rewrote to ${newSrc}`);
            src = newSrc;
        }
        return "ok";
    }
}
class DocumentGroup extends CustomElement {
    get elementName() { return "document-group"; }
    async process($element, metadata, dirty) {
        const template = $element.attr('template');
        if (!template) {
            throw new Error(`document-group must be given a template`);
        }
        const clazz = $element.attr('class');
        const id = $element.attr('id');
        const width = $element.attr('width');
        const style = $element.attr('style');
        // mime?
        // When the renders-to-html attribute is absent, leave
        // rendersToHTML undefined so that the search does not filter
        // on it.  Only when the attribute is explicitly present do we
        // constrain the search to (non-)HTML documents.
        const rendersToHTMLAttr = $element.attr('renders-to-html');
        let rendersToHTML;
        if (typeof rendersToHTMLAttr === 'string') {
            rendersToHTML = rendersToHTMLAttr !== 'false';
        }
        const rootPath = $element.attr('root-path');
        const vpathGlob = $element.attr('vpath-glob');
        const renderGlob = $element.attr('render-glob');
        // Parse an attribute that may hold either a single value or a
        // list of values, into an array of strings.  Returns undefined
        // when the attribute is absent or contains no usable values, so
        // that the search does not filter on it.
        //
        // A value whose trimmed form begins with '[' is parsed as a
        // JSON array, e.g. tag='["Tag1", "Tag-string-2"]'.  This is
        // the robust way to express multiple values because JSON
        // handles values that themselves contain commas, spaces, or
        // quote characters (tags such as `Something "quoted"`).  Any
        // other value is treated as a single literal string, so the
        // common case stays simple, e.g. tag="Tag1".
        const attrList = (name) => {
            const value = $element.attr(name);
            if (typeof value !== 'string')
                return undefined;
            const trimmed = value.trim();
            if (trimmed.length === 0)
                return undefined;
            let list;
            if (trimmed.startsWith('[')) {
                let parsed;
                try {
                    parsed = JSON.parse(trimmed);
                }
                catch (e) {
                    throw new Error(`document-group ${name} is not valid JSON: ${value}`);
                }
                if (!Array.isArray(parsed)) {
                    throw new Error(`document-group ${name} JSON must be an array: ${value}`);
                }
                list = parsed.map(item => {
                    if (typeof item !== 'string') {
                        throw new Error(`document-group ${name} array must contain only strings: ${value}`);
                    }
                    return item.trim();
                });
            }
            else {
                list = [trimmed];
            }
            list = list.filter(item => item.length > 0);
            return list.length > 0 ? list : undefined;
        };
        // Each of these attributes accepts either a single value or a
        // JSON array of values, so that a document group may match
        // multiple layouts, blogtags, or tags.
        const layouts = attrList('layout');
        const blogtags = attrList('blogtag');
        const tags = attrList('tag');
        const parentDir = $element.attr('parent-dir');
        const dirname = $element.attr('dirname');
        const skipGlob = $element.attr('skip-glob');
        const limit = $element.attr('limit');
        const offset = $element.attr('offset');
        const sortBy = $element.attr('sort-by');
        const sort = $element.attr('sort');
        // sort-by may name a document column (such as title, renderPath,
        // vpath, parentDir, or publicationTime) or any frontmatter field
        // (such as a custom `step` ordering field).  The search query
        // (see buildSearchQuery in lib/cache/cache-sqlite.ts) sorts by a
        // column when the name matches one, and otherwise extracts the
        // value from the JSON metadata.  We only need to guard against
        // names that could not be a safe frontmatter key here; the value
        // is later escaped before use in SQL.
        if (typeof sortBy === 'string') {
            if (!sortBy.match(/^[A-Za-z_][A-Za-z0-9_-]*$/)) {
                throw new Error(`DocumentGroup sort-by incorrect ${sortBy}`);
            }
        }
        let sortByDescending = false;
        if (typeof sort === 'string') {
            if (!sort.match(/^(desc|asc)$/)) {
                throw new Error(`DocumentGroup sort incorrect ${sort}`);
            }
            sortByDescending = sort === 'desc';
        }
        let limitNum;
        if (typeof limit === 'string') {
            limitNum = Number.parseInt(limit, 10);
            if (Number.isNaN(limitNum)) {
                throw new Error(`DocumentGroup limit incorrect ${limit}`);
            }
        }
        let offsetNum;
        if (typeof offset === 'string') {
            offsetNum = Number.parseInt(offset, 10);
            if (Number.isNaN(offsetNum)) {
                throw new Error(`DocumentGroup offset incorrect ${offset}`);
            }
        }
        const selector = {
            rendersToHTML,
            rootPath: typeof rootPath === 'string' ? rootPath : undefined,
            glob: typeof vpathGlob === 'string' ? vpathGlob : undefined,
            renderglob: typeof renderGlob === 'string' ? renderGlob : undefined,
            layouts,
            // The search query matches an array of blogtags via the
            // `blogtags` option, and a single blogtag via `blogtag`.
            blogtags,
            tag: tags,
            parentDir: typeof parentDir === 'string' ? parentDir : undefined,
            dirname: typeof dirname === 'string' ? dirname : undefined,
            skipglob: typeof skipGlob === 'string' ? skipGlob : undefined,
            limit: limitNum,
            offset: offsetNum,
            sortBy,
            sortByDescending
        };
        const wrapperTop = `<div`
            + doHTMLAttribute('id', id)
            + doHTMLAttribute('class', clazz)
            + doHTMLAttribute('width', width)
            + doHTMLAttribute('style', style)
            + `>`;
        const wrapperBottom = '</div>';
        const documents = this.akasha.filecache.documentsCache;
        const entries = await documents.search(selector);
        const elements = new Array();
        for (const entry of entries) {
            elements.push(await this.akasha.partial(this.config, template, { entry }));
        }
        return wrapperTop + elements.join('\n') + wrapperBottom;
    }
}
class ShowContent extends CustomElement {
    get elementName() { return "show-content"; }
    async process($element, metadata, dirty) {
        var template = $element.attr('template');
        if (!template)
            template = 'ak_show-content.html.njk';
        let href = $element.attr('href');
        if (!href)
            return Promise.reject(new Error('show-content must receive an href'));
        const clazz = $element.attr('class');
        const id = $element.attr('id');
        const caption = $element.html();
        const width = $element.attr('width');
        const style = $element.attr('style');
        const dest = $element.attr('dest');
        const contentImage = $element.attr('content-image');
        const doc2read = resolveVpath(metadata.document.path, href);
        // console.log(`ShowContent ${util.inspect(metadata.document)} ${doc2read}`);
        const documents = this.akasha.filecache.documentsCache;
        const doc = await documents.find(doc2read);
        const data = {
            href, clazz, id, caption, width, style, dest, contentImage,
            document: doc
        };
        let ret = await this.akasha.partial(this.config, template, data);
        // console.log(`ShowContent ${href} ${util.inspect(data)} ==> ${ret}`);
        return ret;
    }
}
/*

This was moved into Mahabhuta

 class Partial extends mahabhuta.CustomElement {
    get elementName() { return "partial"; }
    process($element, metadata, dirty) {
        // We default to making partial set the dirty flag.  But a user
        // of the partial tag can choose to tell us it isn't dirty.
        // For example, if the partial only substitutes normal tags
        // there's no need to do the dirty thing.
        var dothedirtything = $element.attr('dirty');
        if (!dothedirtything || dothedirtything.match(/true/i)) {
            dirty();
        }
        var fname = $element.attr("file-name");
        var txt   = $element.html();
        var d = {};
        for (var mprop in metadata) { d[mprop] = metadata[mprop]; }
        var data = $element.data();
        for (var dprop in data) { d[dprop] = data[dprop]; }
        d["partialBody"] = txt;
        log('partial tag fname='+ fname +' attrs '+ util.inspect(data));
        return render.partial(this.config, fname, d)
        .then(html => { return html; })
        .catch(err => {
            error(new Error("FAIL partial file-name="+ fname +" because "+ err));
            throw new Error("FAIL partial file-name="+ fname +" because "+ err);
        });
    }
}
module.exports.mahabhuta.addMahafunc(new Partial()); */
//
// <select-elements class=".." id=".." count="N">
//     <element></element>
//     <element></element>
// </select-elements>
//
class SelectElements extends Munger {
    get selector() { return "select-elements"; }
    get elementName() { return "select-elements"; }
    async process($, $link, metadata, dirty) {
        let count = $link.attr('count')
            ? Number.parseInt($link.attr('count'))
            : 1;
        const clazz = $link.attr('class');
        const id = $link.attr('id');
        const tn = $link.attr('tag-name')
            ? $link.attr('tag-name')
            : 'div';
        const children = $link.children();
        const selected = [];
        for (; count >= 1 && children.length >= 1; count--) {
            // console.log(`SelectElements `, children.length);
            const _n = Math.floor(Math.random() * children.length);
            // console.log(_n);
            const chosen = $(children[_n]).html();
            selected.push(chosen);
            // console.log(`SelectElements `, chosen);
            delete children[_n];
        }
        const _uuid = uuidv1();
        $link.replaceWith(`<${tn} id='${_uuid}'></${tn}>`);
        const $newItem = $(`${tn}#${_uuid}`);
        if (id)
            $newItem.attr('id', id);
        else
            $newItem.removeAttr('id');
        if (clazz)
            $newItem.addClass(clazz);
        for (let chosen of selected) {
            $newItem.append(chosen);
        }
        return '';
    }
}
class AnchorCleanup extends Munger {
    get selector() { return "html body a[munged!='yes']"; }
    get elementName() { return "html body a[munged!='yes']"; }
    async process($, $link, metadata, dirty) {
        var href = $link.attr('href');
        var linktext = $link.text();
        const documents = this.akasha.filecache.documentsCache;
        // await documents.isReady();
        const assets = this.akasha.filecache.assetsCache;
        // await assets.isReady();
        // console.log(`AnchorCleanup ${href} ${linktext}`);
        if (href && href !== '#') {
            // An absolute URL (one carrying a scheme such as http: or
            // mailto:), or a protocol-relative //host URL, is never a local
            // link.  This must be tested before the origin comparison below:
            // its 'http://example.com' sentinel is a real URL, so an outbound
            // link to exactly that origin would otherwise be mistaken for a
            // local link and mangled into a path like /http:/example.com/.
            if (hasUrlScheme(href) || href.startsWith('//'))
                return "ok";
            const uHref = new URL(href, 'http://example.com');
            if (uHref.origin !== 'http://example.com')
                return "ok";
            if (!uHref.pathname)
                return "ok";
            // console.log(`AnchorCleanup is local ${href} ${linktext} uHref ${uHref.pathname}`);
            /* if (metadata.document.path === 'index.html.md') {
                console.log(`AnchorCleanup metadata.document.path ${metadata.document.path} href ${href} uHref.pathname ${uHref.pathname} this.config.root_url ${this.config.root_url}`);
                console.log($.html());
            } */
            // let startTime = new Date();
            // We have determined this is a local href.
            // For reference we need the absolute pathname of the href within
            // the project.  For example to retrieve the title when we're filling
            // in for an empty <a> we need the absolute pathname.
            // Mark this link as having been processed.
            // The purpose is if Mahabhuta runs multiple passes,
            // to not process the link multiple times.
            // Before adding this - we saw this Munger take as much
            // as 800ms to execute, for EVERY pass made by Mahabhuta.
            //
            // Adding this attribute, and checking for it in the selector,
            // means we only process the link once.
            $link.attr('munged', 'yes');
            // The query string and fragment are opaque to everything below:
            // path normalization and relativization must operate on the
            // path alone, with the query/fragment re-appended verbatim.
            // A fragment can itself carry a relative path (the
            // document-viewers plugin's
            // /vendor/Viewer.js/index.html#../../../doc.pdf href), and
            // letting it participate in path arithmetic mangles the href.
            const fragIndex = href.indexOf('#');
            const fragment = fragIndex >= 0 ? href.substring(fragIndex) : '';
            let pathPart = fragIndex >= 0 ? href.substring(0, fragIndex) : href;
            const queryIndex = pathPart.indexOf('?');
            const query = queryIndex >= 0 ? pathPart.substring(queryIndex) : '';
            if (queryIndex >= 0)
                pathPart = pathPart.substring(0, queryIndex);
            // A fragment-only (#name) or query-only (?x) reference is a
            // same-page anchor: there is no path to resolve or relativize.
            if (pathPart === '')
                return "ok";
            let absolutePath = resolveVpath(metadata.document.path, pathPart);
            // The idea for this section is to ensure all local href's are 
            // for a relative path rather than an absolute path
            // Hence we use the relative module to compute the relative path
            //
            // Example:
            //
            // AnchorCleanup de-absolute href /index.html in {
            //  basedir: '/Volumes/Extra/akasharender/akasharender/test/documents',
            //  relpath: 'hier/dir1/dir2/nested-anchor.html.md',
            //  relrender: 'hier/dir1/dir2/nested-anchor.html',
            //  path: 'hier/dir1/dir2/nested-anchor.html.md',
            //  renderTo: 'hier/dir1/dir2/nested-anchor.html'
            // } to ../../../index.html
            //
            // Only relativize if desired
            if (this.array.options.relativizeBodyLinks
                && path.isAbsolute(pathPart)) {
                let newHref = relative(`/${metadata.document.renderTo}`, pathPart)
                    + query + fragment;
                $link.attr('href', newHref);
                // console.log(`AnchorCleanup de-absolute href ${href} in ${util.inspect(metadata.document)} to ${newHref}`);
            }
            // Look to see if it's an asset file
            let foundAsset;
            try {
                foundAsset = await assets.find(absolutePath);
            }
            catch (e) {
                foundAsset = undefined;
            }
            if (foundAsset) {
                // console.log(`AnchorCleanup is asset ${absolutePath}`);
                return "ok";
            }
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findAsset ${(new Date() - startTime) / 1000} seconds`);
            // Ask plugins if the href is okay
            if (this.config.askPluginsLegitLocalHref(absolutePath)) {
                // console.log(`AnchorCleanup is legit local href ${absolutePath}`);
                return "ok";
            }
            // If this link has a body, then don't modify it
            if ((linktext && linktext.length > 0 && linktext !== absolutePath)
                || ($link.children().length > 0)) {
                // console.log(`AnchorCleanup skipping ${absolutePath} w/ ${util.inspect(linktext)} children= ${$link.children()}`);
                return "ok";
            }
            // Does it exist in documents dir?
            if (absolutePath === '/') {
                absolutePath = '/index.html';
            }
            let found = await documents.find(absolutePath);
            // console.log(`AnchorCleanup findRendersTo ${absolutePath} ${util.inspect(found)}`);
            if (!found) {
                // Report a broken internal link, gated on the configured
                // internal link-check mode.  The authoritative error/fatal
                // enforcement (which fails the build) happens in the
                // whole-site scan during onSiteRendered; here we only surface
                // the warning during rendering unless checking is disabled.
                const mode = this.config.plugin(pluginName)
                    ?.options?.checkLinks?.internal;
                if (mode && mode !== 'ignore') {
                    console.log(`WARNING: Did not find ${href} in ${util.inspect(this.config.documentDirs)} in ${metadata.document.path} absolutePath ${absolutePath}`);
                }
                return "ok";
            }
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findRendersTo ${(new Date() - startTime) / 1000} seconds`);
            // If this is a directory, there might be /path/to/index.html so we try for that.
            // The problem is that this.config.findRendererPath would fail on just /path/to but succeed
            // on /path/to/index.html
            if (found.isDirectory) {
                found = await documents.find(path.join(absolutePath, "index.html"));
                if (!found) {
                    throw new Error(`Did not find ${href} in ${util.inspect(this.config.documentDirs)} in ${metadata.document.path}`);
                }
            }
            // Otherwise look into filling emptiness with title
            let docmeta = found.docMetadata;
            // Automatically add a title= attribute
            if (!$link.attr('title') && docmeta && docmeta.title) {
                $link.attr('title', docmeta.title);
            }
            if (docmeta && docmeta.title) {
                // console.log(`AnchorCleanup changed link text ${href} to ${docmeta.title}`);
                $link.text(docmeta.title);
            }
            else {
                // console.log(`AnchorCleanup changed link text ${href} to ${href}`);
                $link.text(href);
            }
            /*
            var renderer = this.config.findRendererPath(found.vpath);
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findRendererPath ${(new Date() - startTime) / 1000} seconds`);
            if (renderer && renderer.metadata) {
                let docmeta = found.docMetadata;
                /* try {
                    var docmeta = await renderer.metadata(found.foundDir, found.foundPathWithinDir);
                } catch(err) {
                    throw new Error(`Could not retrieve document metadata for ${found.foundDir} ${found.foundPathWithinDir} because ${err}`);
                } *--/
                // Automatically add a title= attribute
                if (!$link.attr('title') && docmeta && docmeta.title) {
                    $link.attr('title', docmeta.title);
                }
                if (docmeta && docmeta.title) {
                    $link.text(docmeta.title);
                }
                // console.log(`AnchorCleanup finished`);
                // console.log(`AnchorCleanup ${metadata.document.path} ${href} DONE ${(new Date() - startTime) / 1000} seconds`);
                return "ok";
            } else {
                // Don't bother throwing an error.  Just fill it in with
                // something.
                $link.text(href);
                // throw new Error(`Could not fill in empty 'a' element in ${metadata.document.path} with href ${href}`);
            }
            */
        }
        else {
            return "ok";
        }
    }
}
////////////////  MAHAFUNCS FOR FINAL PASS
/**
 * Removes the <code>munged=yes</code> attribute that is added
 * by <code>AnchorCleanup</code>.
 */
class MungedAttrRemover extends Munger {
    get selector() { return 'html body a[munged]'; }
    get elementName() { return 'html body a[munged]'; }
    async process($, $element, metadata, setDirty, done) {
        // console.log($element);
        $element.removeAttr('munged');
        return '';
    }
}
/**
 * Handles the recommendations in:
 * https://javascript.plainenglish.io/one-line-of-html-that-makes-external-links-safer-95fe4ba6ff28
 */
class BlankLinkDefanger extends Munger {
    get selector() { return 'html body a[target=_blank]'; }
    get elementName() { return 'html body a[target=_blank]'; }
    async process($, $element, metadata, setDirty, done) {
        // console.log($element);
        this.akasha.linkRelSetAttr($element, 'noopener', true);
        this.akasha.linkRelSetAttr($element, 'noreferrer', true);
        // console.log(`Changed rel attr to ${$element.attr('rel')}`);
        return '';
    }
}
////////////// Nunjucks Extensions
// From https://github.com/softonic/nunjucks-include-with/tree/master
class stylesheetsExtension {
    constructor(config, plugin, njkRenderer) {
        this.tags = ['akstylesheets'];
        this.config = config;
        this.plugin = plugin;
        this.njkRenderer = njkRenderer;
        // console.log(`stylesheetsExtension ${util.inspect(this.tags)} ${util.inspect(this.config)} ${util.inspect(this.plugin)}`);
    }
    parse(parser, nodes, lexer) {
        // console.log(`in stylesheetsExtension - parse`);
        try {
            // get the tag token
            var tok = parser.nextToken();
            // parse the args and move after the block end. passing true
            // as the second arg is required if there are no parentheses
            var args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);
            // parse the body and possibly the error block, which is optional
            var body = parser.parseUntilBlocks('endakstylesheets');
            parser.advanceAfterBlockEnd();
            // See above for notes about CallExtension
            return new nodes.CallExtension(this, 'run', args, [body]);
        }
        catch (err) {
            console.error(`stylesheetsExtension `, err.stack);
        }
    }
    run(context, args, body) {
        // console.log(`stylesheetsExtension ${util.inspect(context)}`);
        return this.plugin.doStylesheets(context.ctx);
    }
    ;
}
class headerJavaScriptExtension {
    constructor(config, plugin, njkRenderer) {
        this.tags = ['akheaderjs'];
        this.config = config;
        this.plugin = plugin;
        this.njkRenderer = njkRenderer;
        // console.log(`headerJavaScriptExtension ${util.inspect(this.tags)} ${util.inspect(this.config)} ${util.inspect(this.plugin)}`);
    }
    parse(parser, nodes, lexer) {
        // console.log(`in headerJavaScriptExtension - parse`);
        try {
            var tok = parser.nextToken();
            var args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);
            var body = parser.parseUntilBlocks('endakheaderjs');
            parser.advanceAfterBlockEnd();
            return new nodes.CallExtension(this, 'run', args, [body]);
        }
        catch (err) {
            console.error(`headerJavaScriptExtension `, err.stack);
        }
    }
    run(context, args, body) {
        // console.log(`headerJavaScriptExtension ${util.inspect(context)}`);
        return this.plugin.doHeaderJavaScript(context.ctx);
    }
    ;
}
class footerJavaScriptExtension {
    constructor(config, plugin, njkRenderer) {
        this.tags = ['akfooterjs'];
        this.config = config;
        this.plugin = plugin;
        this.njkRenderer = njkRenderer;
        // console.log(`footerJavaScriptExtension ${util.inspect(this.tags)} ${util.inspect(this.config)} ${util.inspect(this.plugin)}`);
    }
    parse(parser, nodes, lexer) {
        // console.log(`in footerJavaScriptExtension - parse`);
        try {
            var tok = parser.nextToken();
            var args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);
            var body = parser.parseUntilBlocks('endakfooterjs');
            parser.advanceAfterBlockEnd();
            return new nodes.CallExtension(this, 'run', args, [body]);
        }
        catch (err) {
            console.error(`footerJavaScriptExtension `, err.stack);
        }
    }
    run(context, args, body) {
        // console.log(`footerJavaScriptExtension ${util.inspect(context)}`);
        return this.plugin.doFooterJavaScript(context.ctx);
    }
    ;
}
function testExtension() {
    this.tags = ['aknjktest'];
    this.parse = function (parser, nodes, lexer) {
        console.log(`in testExtension - parse`);
        try {
            // get the tag token
            var tok = parser.nextToken();
            // parse the args and move after the block end. passing true
            // as the second arg is required if there are no parentheses
            var args = parser.parseSignature(null, true);
            parser.advanceAfterBlockEnd(tok.value);
            // parse the body and possibly the error block, which is optional
            var body = parser.parseUntilBlocks('error', 'endaknjktest');
            var errorBody = null;
            if (parser.skipSymbol('error')) {
                parser.skip(lexer.TOKEN_BLOCK_END);
                errorBody = parser.parseUntilBlocks('endaknjktest');
            }
            parser.advanceAfterBlockEnd();
            // See above for notes about CallExtension
            return new nodes.CallExtension(this, 'run', args, [body, errorBody]);
        }
        catch (err) {
            console.error(`testExtionsion `, err.stack);
        }
    };
    this.run = function (context, url, body, errorBody) {
        console.log(`aknjktest ${util.inspect(context)} ${util.inspect(url)} ${util.inspect(body)} ${util.inspect(errorBody)}`);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsWUFBWSxFQUFFLGVBQWUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNoSSxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdELE9BQU8sRUFDSCxXQUFXLEVBQ1gsMEJBQTBCLEVBQzFCLFVBQVUsRUFDVixZQUFZLEVBRWYsTUFBTSxtQkFBbUIsQ0FBQztBQUUzQixNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQztBQUV2QyxNQUFNLE9BQU8sYUFBYyxTQUFRLE1BQU07SUFDeEM7UUFDQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7O1FBS2hCLHdDQUFRO1FBQ1IsOENBQWM7UUFMVix1QkFB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LE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQyxDQUFDO0FBRU4sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgZnNwIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gJ3V1aWQnO1xuY29uc3QgdXVpZHYxID0gdXVpZC52MTtcbmltcG9ydCAqIGFzIHJlbmRlciBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5pbXBvcnQgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuaW1wb3J0IGhsanMgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmltcG9ydCBtYWhhTWV0YWRhdGEgZnJvbSAnbWFoYWJodXRhL21haGEvbWV0YWRhdGEuanMnO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuaW1wb3J0IFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge2VuY29kZX0gZnJvbSAnaHRtbC1lbnRpdGllcyc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBDdXN0b21FbGVtZW50LCBNdW5nZXIsIFBhZ2VQcm9jZXNzb3IsIGphdmFTY3JpcHRJdGVtLCByZXNvbHZlVnBhdGgsIGRvSFRNTEF0dHJpYnV0ZSB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgaW5mZXJGb3JtYXQsIHBhcnNlVGFibGVEYXRhIH0gZnJvbSAnLi9jc3YtdGFibGUuanMnO1xuaW1wb3J0IHtcbiAgICBMaW5rQ2hlY2tlcixcbiAgICBERUZBVUxUX0xJTktfQ0hFQ0tfT1BUSU9OUyxcbiAgICBhc3NlcnRNb2RlLFxuICAgIGhhc1VybFNjaGVtZSxcbiAgICB0eXBlIExpbmtDaGVja01vZGVcbn0gZnJvbSAnLi9saW5rLWNoZWNrZXIuanMnO1xuXG5jb25zdCBwbHVnaW5OYW1lID0gXCJha2FzaGFjbXMtYnVpbHRpblwiO1xuXG5leHBvcnQgY2xhc3MgQnVpbHRJblBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKHBsdWdpbk5hbWUpO1xuICAgICAgICB0aGlzLiNyZXNpemVfcXVldWUgPSBbXTtcblxuXHR9XG5cbiAgICAjY29uZmlnO1xuICAgICNyZXNpemVfcXVldWU7XG5cblx0Y29uZmlndXJlKGNvbmZpZzogQ29uZmlndXJhdGlvbiwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLiNjb25maWcgPSBjb25maWc7XG4gICAgICAgIC8vIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmFrYXNoYSA9IGNvbmZpZy5ha2FzaGE7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgPyBvcHRpb25zIDoge307XG4gICAgICAgIHRoaXMub3B0aW9ucy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUJvZHlMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBMaW5rLWNoZWNraW5nIG9wdGlvbnMuICBTZWUgbGliL2xpbmstY2hlY2tlci50cy4gIERlZmF1bHRzIGxlYXZlXG4gICAgICAgIC8vIGV4dGVybmFsIGNoZWNraW5nIG9mZiAoJ2lnbm9yZScpIGJlY2F1c2UgaXQgaXMgc2xvdyBhbmQgZmxha3ksIGFuZFxuICAgICAgICAvLyBpbnRlcm5hbCBjaGVja2luZyBhdCAnd2FybicuICBBIHVzZXIgbWF5IG92ZXJyaWRlIGFueSBvZiB0aGVzZSB2aWFcbiAgICAgICAgLy8gY29uZmlnIG9yIHRoZSBjaGFpbmFibGUgc2V0dGVycyBiZWxvdy5cbiAgICAgICAgdGhpcy5vcHRpb25zLmNoZWNrTGlua3MgPSBPYmplY3QuYXNzaWduKFxuICAgICAgICAgICAge30sIERFRkFVTFRfTElOS19DSEVDS19PUFRJT05TLCB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcyB8fCB7fVxuICAgICAgICApO1xuICAgICAgICBsZXQgbW9kdWxlRGlybmFtZSA9IGltcG9ydC5tZXRhLmRpcm5hbWU7XG4gICAgICAgIC8vIE5lZWQgdGhpcyBhcyB0aGUgcGxhY2UgdG8gc3RvcmUgTnVuanVja3MgbWFjcm9zIGFuZCB0ZW1wbGF0ZXNcbiAgICAgICAgY29uZmlnLmFkZExheW91dHNEaXIocGF0aC5qb2luKG1vZHVsZURpcm5hbWUsICcuLicsICdsYXlvdXRzJykpO1xuICAgICAgICBjb25maWcuYWRkUGFydGlhbHNEaXIocGF0aC5qb2luKG1vZHVsZURpcm5hbWUsICcuLicsICdwYXJ0aWFscycpKTtcbiAgICAgICAgLy8gRG8gbm90IG5lZWQgdGhpcyBoZXJlIGFueSBsb25nZXIgYmVjYXVzZSBpdCBpcyBoYW5kbGVkXG4gICAgICAgIC8vIGluIHRoZSBDb25maWd1cmF0aW9uIGNvbnN0cnVjdG9yLiAgVGhlIGlkZWEgaXMgdG8gcHV0XG4gICAgICAgIC8vIG1haGFQYXJ0aWFsIGFzIHRoZSB2ZXJ5IGZpcnN0IE1haGFmdW5jIHNvIHRoYXQgYWxsXG4gICAgICAgIC8vIFBhcnRpYWwncyBhcmUgaGFuZGxlZCBiZWZvcmUgYW55dGhpbmcgZWxzZS4gIFRoZSBpc3N1ZSBjYXVzaW5nXG4gICAgICAgIC8vIHRoaXMgY2hhbmdlIGlzIHRoZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzIE1haGFmdW5jIGluXG4gICAgICAgIC8vIGFrYXNoYWNocy1iYXNlIGFuZCBwcm9jZXNzaW5nIGFueSBpbWFnZXMgYnJvdWdodCBpbiBieSBwYXJ0aWFscy5cbiAgICAgICAgLy8gRW5zdXJpbmcgdGhlIHBhcnRpYWwgdGFnIGlzIHByb2Nlc3NlZCBiZWZvcmUgT3BlbkdyYXBoUHJvbW90ZUltYWdlc1xuICAgICAgICAvLyBtZWFudCBzdWNoIGltYWdlcyB3ZXJlIHByb3Blcmx5IHByb21vdGVkLlxuICAgICAgICAvLyBjb25maWcuYWRkTWFoYWJodXRhKG1haGFQYXJ0aWFsLm1haGFiaHV0YUFycmF5KHtcbiAgICAgICAgLy8gICAgIHJlbmRlclBhcnRpYWw6IG9wdGlvbnMucmVuZGVyUGFydGlhbFxuICAgICAgICAvLyB9KSk7XG4gICAgICAgIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYU1ldGFkYXRhLm1haGFiaHV0YUFycmF5KHtcbiAgICAgICAgICAgIC8vIERvIG5vdCBwYXNzIHRoaXMgdGhyb3VnaCBzbyB0aGF0IE1haGFiaHV0YSB3aWxsIG5vdFxuICAgICAgICAgICAgLy8gbWFrZSBhYnNvbHV0ZSBsaW5rcyB0byBzdWJkaXJlY3Rvcmllc1xuICAgICAgICAgICAgLy8gcm9vdF91cmw6IGNvbmZpZy5yb290X3VybFxuICAgICAgICAgICAgLy8gVE9ETyBob3cgdG8gY29uZmlndXJlIHRoaXNcbiAgICAgICAgICAgIC8vIHNpdGVtYXBfdGl0bGU6IC4uLi4/XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhYmh1dGFBcnJheShvcHRpb25zLCBjb25maWcsIHRoaXMuYWthc2hhLCB0aGlzKSk7XG5cbiAgICAgICAgY29uc3QgbmprID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyTmFtZSgnLmh0bWwubmprJykgYXMgUmVuZGVyZXJzLk51bmp1Y2tzUmVuZGVyZXI7XG4gICAgICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2Frc3R5bGVzaGVldHMnLFxuICAgICAgICAgICAgbmV3IHN0eWxlc2hlZXRzRXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG4gICAgICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FraGVhZGVyanMnLFxuICAgICAgICAgICAgbmV3IGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtmb290ZXJqcycsXG4gICAgICAgICAgICBuZXcgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFZlcmlmeSB0aGF0IHRoZSBleHRlbnNpb25zIHdlcmUgaW5zdGFsbGVkXG4gICAgICAgIGZvciAoY29uc3QgZXh0IG9mIFtcbiAgICAgICAgICAgICAgICAgICAgJ2Frc3R5bGVzaGVldHMnLFxuICAgICAgICAgICAgICAgICAgICAnYWtoZWFkZXJqcycsXG4gICAgICAgICAgICAgICAgICAgICdha2Zvb3RlcmpzJ1xuICAgICAgICBdKSB7XG4gICAgICAgICAgICBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oZXh0KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ29uZmlndXJlIC0gTkpLIGRvZXMgbm90IGhhdmUgZXh0ZW5zaW9uIC0gJHtleHR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIHRyeSB7XG4gICAgICAgIC8vICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha25qa3Rlc3QnLCBuZXcgdGVzdEV4dGVuc2lvbigpKTtcbiAgICAgICAgLy8gfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGVyci5zdGFjaygpKTtcbiAgICAgICAgLy8gfVxuICAgICAgICBcbiAgICAgICAgLy8gaWYgKCFuamsubmprZW52KCkuaGFzRXh0ZW5zaW9uKCdha25qa3Rlc3QnKSkge1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihgYWtuamt0ZXN0IGV4dGVuc2lvbiBub3QgYWRkZWQ/YCk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhgYWtuamt0ZXN0IGV4aXN0c2ApO1xuICAgICAgICAvLyB9XG4gICAgfVxuXG4gICAgZ2V0IGNvbmZpZygpIHsgcmV0dXJuIHRoaXMuI2NvbmZpZzsgfVxuICAgIC8vIGdldCByZXNpemVxdWV1ZSgpIHsgcmV0dXJuIHRoaXMuI3Jlc2l6ZV9xdWV1ZTsgfVxuXG4gICAgZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG4gICAgXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPGxpbms+IHRhZ3MgaW4gdGhlIDxoZWFkPiBmb3IgbG9jYWxcbiAgICAgKiBVUkxzIGFyZSByZWxhdGl2aXplZCBvciBhYnNvbHV0aXplZC5cbiAgICAgKi9cbiAgICBzZXQgcmVsYXRpdml6ZUhlYWRMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPHNjcmlwdD4gdGFncyBmb3IgbG9jYWxcbiAgICAgKiBVUkxzIGFyZSByZWxhdGl2aXplZCBvciBhYnNvbHV0aXplZC5cbiAgICAgKi9cbiAgICBzZXQgcmVsYXRpdml6ZVNjcmlwdExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxBPiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplQm9keUxpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUJvZHlMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNldmVyaXR5IG1vZGUgZm9yIGludGVybmFsIChsb2NhbCkgbGluayBjaGVja2luZy5cbiAgICAgKiBPbmUgb2YgJ2lnbm9yZScgfCAnd2FybicgfCAnZXJyb3InIHwgJ2ZhdGFsJy5cbiAgICAgKi9cbiAgICBzZXRJbnRlcm5hbExpbmtNb2RlKGNvbmZpZywgbW9kZTogTGlua0NoZWNrTW9kZSkge1xuICAgICAgICBhc3NlcnRNb2RlKG1vZGUsICdpbnRlcm5hbCcpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcy5pbnRlcm5hbCA9IG1vZGU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc2V2ZXJpdHkgbW9kZSBmb3IgZXh0ZXJuYWwgKGh0dHAvaHR0cHMpIGxpbmsgY2hlY2tpbmcuXG4gICAgICogT25lIG9mICdpZ25vcmUnIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCcuICAnaWdub3JlJyAodGhlIGRlZmF1bHQpXG4gICAgICogZGlzYWJsZXMgZXh0ZXJuYWwgY2hlY2tpbmcuXG4gICAgICovXG4gICAgc2V0RXh0ZXJuYWxMaW5rTW9kZShjb25maWcsIG1vZGU6IExpbmtDaGVja01vZGUpIHtcbiAgICAgICAgYXNzZXJ0TW9kZShtb2RlLCAnZXh0ZXJuYWwnKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoZWNrTGlua3MuZXh0ZXJuYWwgPSBtb2RlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIHNldmVyaXR5IG1vZGUgZm9yIG5vbi1IVFRQIGxpbmtzIChtYWlsdG86LCB0ZWw6LCAuLi4pLlxuICAgICAqIE9uZSBvZiAnaWdub3JlJyB8ICd3YXJuJyB8ICdlcnJvcicgfCAnZmF0YWwnLiAgJ2lnbm9yZScgKHRoZSBkZWZhdWx0KVxuICAgICAqIHNpbGVudGx5IHNraXBzIHRoZW07ICd3YXJuJyBsb2dzIHRoZW0gZm9yIHJldmlldy5cbiAgICAgKi9cbiAgICBzZXRPdGhlclNjaGVtZXNNb2RlKGNvbmZpZywgbW9kZTogTGlua0NoZWNrTW9kZSkge1xuICAgICAgICBhc3NlcnRNb2RlKG1vZGUsICdyZXBvcnRPdGhlclNjaGVtZXMnKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoZWNrTGlua3MucmVwb3J0T3RoZXJTY2hlbWVzID0gbW9kZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGV4dGVybmFsIGRvbWFpbiBvciBVUkwgKHN0cmluZykgb3IgUmVnRXhwIHRvIHRoZSBsaW5rLWNoZWNrXG4gICAgICogd2hpdGVsaXN0LiAgV2hpdGVsaXN0ZWQgZXh0ZXJuYWwgVVJMcyBhcmUgYXNzdW1lZCB2YWxpZCBhbmQgbmV2ZXIgZmV0Y2hlZC5cbiAgICAgKi9cbiAgICBhZGRMaW5rQ2hlY2tXaGl0ZWxpc3QoY29uZmlnLCBlbnRyeTogc3RyaW5nIHwgUmVnRXhwKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcy53aGl0ZWxpc3QpKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcy53aGl0ZWxpc3QgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcy53aGl0ZWxpc3QucHVzaChlbnRyeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbGVjdCB3aGljaCBleHRlcm5hbCBwZXItVVJMIGNoZWNrZXIgdG8gdXNlOiAnZmV0Y2gnIChidWlsdC1pbixcbiAgICAgKiB6ZXJvLWRlcGVuZGVuY3kpIG9yICdsaW5rLWNoZWNrJyAobGF6eS1sb2FkcyB0aGUgc2l0ZS1hdXRob3ItaW5zdGFsbGVkXG4gICAgICogYGxpbmstY2hlY2tgIHBhY2thZ2UpLlxuICAgICAqL1xuICAgIHNldEV4dGVybmFsQ2hlY2tlcihjb25maWcsIHdoaWNoOiAnZmV0Y2gnIHwgJ2xpbmstY2hlY2snKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGVja0xpbmtzLmV4dGVybmFsQ2hlY2tlciA9IHdoaWNoO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBkb1N0eWxlc2hlZXRzKG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvU3R5bGVzaGVldHMobWV0YWRhdGEsIHRoaXMub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgIH1cblxuICAgIGRvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgIH1cblxuICAgIGRvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgIH1cblxuICAgIGFkZEltYWdlVG9SZXNpemUoc3JjOiBzdHJpbmcsIHJlc2l6ZXdpZHRoOiBudW1iZXIsIHJlc2l6ZXRvOiBzdHJpbmcsIGRvY1BhdGg6IHN0cmluZykge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgYWRkSW1hZ2VUb1Jlc2l6ZSAke3NyY30gcmVzaXpld2lkdGggJHtyZXNpemV3aWR0aH0gcmVzaXpldG8gJHtyZXNpemV0b31gKVxuICAgICAgICB0aGlzLiNyZXNpemVfcXVldWUucHVzaCh7IHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBkb2NQYXRoIH0pO1xuICAgIH1cblxuICAgIC8vIFRoaXMgc2VjdGlvbiB3YXMgYWRkZWQgaW4gdGhlIHBvc3NpYmlsaXR5IG9mXG4gICAgLy8gbW92aW5nIHRhZ2dlZC1jb250ZW50IGludG8gdGhlIGNvcmUuXG4gICAgLy8gQWZ0ZXIgdHJ5aW5nIHRoaXMsIHRoYXQgc2VlbXMgbGlrZSBhIG5vbi1zdGFydGVyXG4gICAgLy8gb2YgYSBwcm9qZWN0IGlkZWEuXG5cbiAgICAvLyAjcGF0aEluZGV4ZXM6IHN0cmluZztcblxuICAgIC8vIHNldCBwYXRoSW5kZXhlcyhpbmRleGVzKSB7IHRoaXMuI3BhdGhJbmRleGVzID0gaW5kZXhlczsgfVxuICAgIC8vIGdldCBwYXRoSW5kZXhlcygpICAgICAgICB7IHJldHVybiB0aGlzLiNwYXRoSW5kZXhlczsgfVxuXG4gICAgLy8gdGFnUGFnZVVybChjb25maWcsIHRhZ05hbWUpIHtcbiAgICAvLyAgICAgaWYgKHR5cGVvZiB0aGlzLiNwYXRoSW5kZXhlcyAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEJ1aWx0SW5QbHVnaW4gcGF0aEluZGV4ZXMgaGFzIG5vdCBiZWVuIHNldCAke3V0aWwuaW5zcGVjdCh0aGlzLiNwYXRoSW5kZXhlcyl9YCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgaWYgKHRoaXMucGF0aEluZGV4ZXMuZW5kc1dpdGgoJy8nKSkge1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucGF0aEluZGV4ZXMgKyB0YWcyZW5jb2RlNHVybCh0YWdOYW1lKSArJy5odG1sJztcbiAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLnBhdGhJbmRleGVzICsnLycrIHRhZzJlbmNvZGU0dXJsKHRhZ05hbWUpICsnLmh0bWwnO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gYXN5bmMgZG9UYWdzRm9yRG9jdW1lbnQoY29uZmlnLCBtZXRhZGF0YSwgdGVtcGxhdGUpIHtcbiAgICAvLyAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgIC8vICAgICBjb25zdCBwbHVnaW4gPSB0aGlzO1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coJ2RvVGFnc0ZvckRvY3VtZW50ICcrIHV0aWwuaW5zcGVjdChtZXRhZGF0YSkpO1xuICAgIC8vICAgICBjb25zdCB0YWdsaXN0ID0gKFxuICAgIC8vICAgICAgICAgICAgICd0YWdzJyBpbiBtZXRhZGF0YVxuICAgIC8vICAgICAgICAgICAmJiBBcnJheS5pc0FycmF5KG1ldGFkYXRhLnRhZ3MpXG4gICAgLy8gICAgICAgICApID8gbWV0YWRhdGEudGFncyA6IFtdO1xuICAgIC8vICAgICBpZiAodGFnbGlzdCkge1xuICAgIC8vICAgICAgICAgY29uc3QgdGFnemxpc3QgPSBbXTtcbiAgICAvLyAgICAgICAgIGZvciAoY29uc3QgdGFnIG9mIHRhZ2xpc3QpIHtcbiAgICAvLyAgICAgICAgICAgICB0YWd6bGlzdC5wdXNoKHtcbiAgICAvLyAgICAgICAgICAgICAgICAgdGFnTmFtZTogdGFnLFxuICAgIC8vICAgICAgICAgICAgICAgICB0YWdVcmw6IHBsdWdpbi50YWdQYWdlVXJsKGNvbmZpZywgdGFnKSxcbiAgICAvLyAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGF3YWl0IGRvY3VtZW50cy5nZXRUYWdEZXNjcmlwdGlvbih0YWcpXG4gICAgLy8gICAgICAgICAgICAgfSk7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnZG9UYWdzRm9yRG9jdW1lbnQgJysgdXRpbC5pbnNwZWN0KHRhZ2xpc3QpKTtcbiAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKGNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAvLyAgICAgICAgICAgICB0YWd6OiB0YWd6bGlzdFxuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH0gZWxzZSByZXR1cm4gXCJcIjtcbiAgICAvLyB9XG5cbiAgICBhc3luYyBvblNpdGVSZW5kZXJlZChjb25maWcpIHtcblxuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgYXNzZXRzLmlzUmVhZHkoKTtcbiAgICAgICAgd2hpbGUgKEFycmF5LmlzQXJyYXkodGhpcy4jcmVzaXplX3F1ZXVlKVxuICAgICAgICAgICAgJiYgdGhpcy4jcmVzaXplX3F1ZXVlLmxlbmd0aCA+IDApIHtcblxuICAgICAgICAgICAgbGV0IHRvcmVzaXplID0gdGhpcy4jcmVzaXplX3F1ZXVlLnBvcCgpO1xuXG4gICAgICAgICAgICBsZXQgaW1nMnJlc2l6ZTtcbiAgICAgICAgICAgIGlmICghcGF0aC5pc0Fic29sdXRlKHRvcmVzaXplLnNyYykpIHtcbiAgICAgICAgICAgICAgICBpbWcycmVzaXplID0gcGF0aC5ub3JtYWxpemUocGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUodG9yZXNpemUuZG9jUGF0aCksXG4gICAgICAgICAgICAgICAgICAgIHRvcmVzaXplLnNyY1xuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbWcycmVzaXplID0gdG9yZXNpemUuc3JjO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgc3JjZmlsZSA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgYXNzZXRzLmZpbmQoaW1nMnJlc2l6ZSk7XG4gICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICBzcmNmaWxlID0gZm91bmQuZnNwYXRoO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGltZzJyZXNpemUpO1xuICAgICAgICAgICAgICAgIHNyY2ZpbGUgPSBmb3VuZCA/IGZvdW5kLmZzcGF0aCA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3JjZmlsZSkgdGhyb3cgbmV3IEVycm9yKGBha2FzaGFjbXMtYnVpbHRpbjogRGlkIG5vdCBmaW5kIHNvdXJjZSBmaWxlIGZvciBpbWFnZSB0byByZXNpemUgJHtpbWcycmVzaXplfWApO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxldCBpbWcgPSBhd2FpdCBzaGFycChzcmNmaWxlKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzaXplZCA9IGF3YWl0IGltZy5yZXNpemUoTnVtYmVyLnBhcnNlSW50KHRvcmVzaXplLnJlc2l6ZXdpZHRoKSk7XG4gICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byBjb21wdXRlIHRoZSBjb3JyZWN0IGRlc3RpbmF0aW9uIHBhdGhcbiAgICAgICAgICAgICAgICAvLyBmb3IgdGhlIHJlc2l6ZWQgaW1hZ2VcbiAgICAgICAgICAgICAgICBsZXQgaW1ndG9yZXNpemUgPSB0b3Jlc2l6ZS5yZXNpemV0byA/IHRvcmVzaXplLnJlc2l6ZXRvIDogaW1nMnJlc2l6ZTtcbiAgICAgICAgICAgICAgICBsZXQgcmVzaXplZGVzdDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGltZ3RvcmVzaXplKSkge1xuICAgICAgICAgICAgICAgICAgICByZXNpemVkZXN0ID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgaW1ndG9yZXNpemUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgZm9yIHJlbGF0aXZlIGltYWdlIHBhdGhzLCBoZW5jZSBpdCBuZWVkcyB0byBiZVxuICAgICAgICAgICAgICAgICAgICAvLyByZWxhdGl2ZSB0byB0aGUgZG9jUGF0aFxuICAgICAgICAgICAgICAgICAgICByZXNpemVkZXN0ID0gcGF0aC5qb2luKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmRpcm5hbWUodG9yZXNpemUuZG9jUGF0aCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1ndG9yZXNpemUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgICAgICAgICAgIGF3YWl0IGZzcC5ta2RpcihwYXRoLmRpcm5hbWUocmVzaXplZGVzdCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGF3YWl0IHJlc2l6ZWQudG9GaWxlKHJlc2l6ZWRlc3QpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgYnVpbHQtaW46IEltYWdlIHJlc2l6ZSBmYWlsZWQgZm9yICR7c3JjZmlsZX0gKHRvcmVzaXplICR7dXRpbC5pbnNwZWN0KHRvcmVzaXplKX0gZm91bmQgJHt1dGlsLmluc3BlY3QoZm91bmQpfSkgYmVjYXVzZSAke2V9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZnRlciBhbGwgZmlsZXMgYXJlIHJlbmRlcmVkLCBvcHRpb25hbGx5IGNoZWNrIHRoZSBzaXRlJ3MgbGlua3MuXG4gICAgICAgIGF3YWl0IHRoaXMuI2NoZWNrU2l0ZUxpbmtzKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2FsayBldmVyeSByZW5kZXJlZCBIVE1MIGZpbGUgYW5kIGNoZWNrIHRoZSBsaW5rcyBpdCBjb250YWlucywgdXNpbmcgdGhlXG4gICAgICogY29uZmlndXJlZCBsaW5rLWNoZWNrIG1vZGVzLiAgSW50ZXJuYWwgbGlua3MgYXJlIHJlc29sdmVkIGFnYWluc3QgdGhlXG4gICAgICogY2FjaGVzOyBleHRlcm5hbCBsaW5rcyBhcmUgdmFsaWRhdGVkIG92ZXIgdGhlIG5ldHdvcmsgKHdoZW4gZW5hYmxlZCk7XG4gICAgICogbm9uLUhUVFAgbGlua3MgYXJlIG9wdGlvbmFsbHkgbG9nZ2VkLiAgVGhpcyBpcyBza2lwcGVkIGVudGlyZWx5IHVubGVzcyBhdFxuICAgICAqIGxlYXN0IG9uZSBjbGFzcyBvZiBjaGVja2luZyBpcyBlbmFibGVkLlxuICAgICAqL1xuICAgIGFzeW5jICNjaGVja1NpdGVMaW5rcyhjb25maWcpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMub3B0aW9ucz8uY2hlY2tMaW5rcztcbiAgICAgICAgY29uc3QgY2hlY2tlciA9IG5ldyBMaW5rQ2hlY2tlcihjb25maWcsIHRoaXMuYWthc2hhLCBvcHRzKTtcbiAgICAgICAgaWYgKCFjaGVja2VyLmVuYWJsZWQpIHJldHVybjtcblxuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIC8vIEFsbCBkb2N1bWVudHMgdGhhdCByZW5kZXIgdG8gYSAuaHRtbCBmaWxlLlxuICAgICAgICBjb25zdCBodG1sRG9jcyA9IGF3YWl0IGRvY3VtZW50cy5zZWFyY2goe1xuICAgICAgICAgICAgcmVuZGVycGF0aG1hdGNoOiAnXFxcXC5odG1sJCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gQ29sbGVjdCBhbGwgbGlua3MgZmlyc3Qgc28gdGhlIGV4dGVybmFsIGNoZWNrZXIgZGVkdXBsaWNhdGVzIHdvcmsuXG4gICAgICAgIC8vIEVhY2ggZW50cnkgcGFpcnMgYW4gaHJlZiB3aXRoIHRoZSByZW5kZXJlZCBkb2N1bWVudCBpdCBjYW1lIGZyb20uXG4gICAgICAgIGNvbnN0IGxpbmtzOiBBcnJheTx7IGhyZWY6IHN0cmluZywgc291cmNlOiBzdHJpbmcsIHZwYXRoOiBzdHJpbmcgfT4gPSBbXTtcbiAgICAgICAgZm9yIChjb25zdCBkb2Mgb2YgaHRtbERvY3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlclBhdGggPSBkb2MucmVuZGVyUGF0aDtcbiAgICAgICAgICAgIGNvbnN0IGZzcGF0aCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIHJlbmRlclBhdGgpO1xuICAgICAgICAgICAgbGV0IGh0bWw6IHN0cmluZztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaHRtbCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmc3BhdGgsICd1dGY4Jyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIGZpbGUgbWF5IG5vdCBoYXZlIGJlZW4gd3JpdHRlbiAoZS5nLiBub24tSFRNTCByZW5kZXJlcik7XG4gICAgICAgICAgICAgICAgLy8gc2tpcCBpdCByYXRoZXIgdGhhbiBmYWlsaW5nIHRoZSB3aG9sZSBzY2FuLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0ICQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICQgPSBtYWhhYmh1dGEucGFyc2UoaHRtbCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjb2xsZWN0ID0gKHNlbGVjdG9yOiBzdHJpbmcsIGF0dHI6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICQoc2VsZWN0b3IpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhyZWYgPSAkKGVsKS5hdHRyKGF0dHIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGhyZWYgPT09ICdzdHJpbmcnICYmIGhyZWYubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlua3MucHVzaCh7IGhyZWYsIHNvdXJjZTogcmVuZGVyUGF0aCwgdnBhdGg6IGRvYy52cGF0aCB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbGxlY3QoJ2FbaHJlZl0nLCAnaHJlZicpO1xuICAgICAgICAgICAgY29sbGVjdCgnbGlua1tocmVmXScsICdocmVmJyk7XG4gICAgICAgICAgICBjb2xsZWN0KCdzY3JpcHRbc3JjXScsICdzcmMnKTtcbiAgICAgICAgICAgIGNvbGxlY3QoJ2ltZ1tzcmNdJywgJ3NyYycpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCBsaW5rIG9mIGxpbmtzKSB7XG4gICAgICAgICAgICBhd2FpdCBjaGVja2VyLmNoZWNrTGluayhsaW5rLmhyZWYsIGxpbmsuc291cmNlLCBsaW5rLnZwYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRocm93cyBpZiBhbnkgJ2Vycm9yJy1tb2RlIGZhaWx1cmVzIHdlcmUgY29sbGVjdGVkLCBmYWlsaW5nIHRoZSBydW4uXG4gICAgICAgIGNoZWNrZXIuZmluaXNoKCk7XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBtYWhhYmh1dGFBcnJheSA9IGZ1bmN0aW9uKFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGNvbmZpZz86IENvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBha2FzaGE/OiBhbnksXG4gICAgICAgICAgICBwbHVnaW4/OiBQbHVnaW5cbikge1xuICAgIGxldCByZXQgPSBuZXcgbWFoYWJodXRhLk1haGFmdW5jQXJyYXkocGx1Z2luTmFtZSwgb3B0aW9ucyk7XG4gICAgLy8gcmV0LmFkZE1haGFmdW5jKG5ldyBUYWdzRm9yRG9jdW1lbnRFbGVtZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFN0eWxlc2hlZXRzRWxlbWVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBIZWFkZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZvb3RlckphdmFTY3JpcHQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW5zZXJ0VGVhc2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IENvZGVFbWJlZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBDc3ZUYWJsZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBpbWcyZmlndXJlSW1hZ2UoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBEb2N1bWVudEdyb3VwKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNob3dDb250ZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNlbGVjdEVsZW1lbnRzKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEFuY2hvckNsZWFudXAoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZExpbmtSZWxhdGl2aXplcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTY3JpcHRSZWxhdGl2aXplcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG5cbiAgICByZXQuYWRkRmluYWxNYWhhZnVuYyhuZXcgTXVuZ2VkQXR0clJlbW92ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBCbGFua0xpbmtEZWZhbmdlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuLy8gY2xhc3MgVGFnc0ZvckRvY3VtZW50RWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuLy8gICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGFncy1mb3ItZG9jdW1lbnRcIjsgfVxuLy8gICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuLy8gICAgICAgICBjb25zdCBwbHVnaW4gPSB0aGlzLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSk7XG4vLyAgICAgICAgIHJldHVybiBhd2FpdCBwbHVnaW4uZG9UYWdzRm9yRG9jdW1lbnQodGhpcy5jb25maWcsXG4vLyAgICAgICAgICAgICAgICAgbWV0YWRhdGEsIFwiYWtfZG9jdW1lbnRfdGFncy5odG1sLm5qa1wiKTtcbi8vICAgICB9XG4vLyB9XG5cbmZ1bmN0aW9uIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcbiAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEpfWApO1xuXG4gICAgdmFyIHNjcmlwdHM7XG4gICAgaWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMuY29uY2F0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cyA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYGFrLXN0eWxlc2hlZXRzICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpfSAke3V0aWwuaW5zcGVjdChjb25maWcuc2NyaXB0cyl9ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXG4gICAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMnKTtcbiAgICBpZiAoIWNvbmZpZykgdGhyb3cgbmV3IEVycm9yKCdfZG9TdHlsZXNoZWV0cyBubyBjb25maWcnKTtcblxuICAgIHZhciByZXQgPSAnJztcbiAgICBpZiAodHlwZW9mIHNjcmlwdHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAodmFyIHN0eWxlIG9mIHNjcmlwdHMpIHtcblxuICAgICAgICAgICAgbGV0IHN0eWxlaHJlZiA9IHN0eWxlLmhyZWY7XG4gICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKHN0eWxlLmhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBwcm9jZXNzICR7c3R5bGVocmVmfWApO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcblxuICAgICAgICAgICAgICAgIC8vIFRoZSBiaXQgd2l0aCAnaHR0cDovL2V4YW1wbGUuY29tJyBtZWFucyB0aGVyZVxuICAgICAgICAgICAgICAgIC8vIHdvbid0IGJlIGFuIGV4Y2VwdGlvbiB0aHJvd24gZm9yIGEgbG9jYWwgVVJMLlxuICAgICAgICAgICAgICAgIC8vIEJ1dCwgaW4gc3VjaCBhIGNhc2UsIHVIcmVmLnBhdGhuYW1lIHdvdWxkXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgd2l0aCBhIHNsYXNoLiAgVGhlcmVmb3JlLCB0byBjb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUgaWYgdGhpcyBVUkwgaXMgYWJzb2x1dGUgd2UgbXVzdCBjaGVja1xuICAgICAgICAgICAgICAgIC8vIHdpdGggdGhlIG9yaWdpbmFsIFVSTCBzdHJpbmcsIHdoaWNoIGlzIGluXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN0eWxlaHJlZiB2YXJpYWJsZS5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzXG4gICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzdHlsZWhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQWApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtZXRhZGF0YS5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBIERPQ1VNRU5UYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlQgUkVOREVSVE9gKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyByZWxhdGl2ZSgvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb30sICR7c3R5bGVocmVmfSkgPSAke3JlbGF0aXZlKCcvJyttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbywgc3R5bGVocmVmKX1gKVxuICAgICAgICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBhYnNvbHV0ZSBzdHlsZWhyZWYgJHtzdHlsZWhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlaHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkb1N0eWxlTWVkaWEgPSAobWVkaWEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobWVkaWEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBtZWRpYT1cIiR7ZW5jb2RlKG1lZGlhKX1cImBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxldCBodCA9IGA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIiR7ZW5jb2RlKHN0eWxlaHJlZil9XCIgJHtkb1N0eWxlTWVkaWEoc3R5bGUubWVkaWEpfS8+YFxuICAgICAgICAgICAgcmV0ICs9IGh0O1xuXG4gICAgICAgICAgICAvLyBUaGUgaXNzdWUgd2l0aCB0aGlzIGFuZCBvdGhlciBpbnN0YW5jZXNcbiAgICAgICAgICAgIC8vIGlzIHRoYXQgdGhpcyB0ZW5kZWQgdG8gcmVzdWx0IGluXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICA8aHRtbD48Ym9keT48bGluay4uPjwvYm9keT48L2h0bWw+XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2hlbiBpdCBuZWVkZWQgdG8ganVzdCBiZSB0aGUgPGxpbms+IHRhZy5cbiAgICAgICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCBpdCB0cmllZCB0byBjcmVhdGUgYW4gZW50aXJlXG4gICAgICAgICAgICAvLyBIVE1MIGRvY3VtZW50LiAgV2hpbGUgdGhlcmUgd2FzIGEgd2F5IGFyb3VuZFxuICAgICAgICAgICAgLy8gdGhpcyAtICQoJ3NlbGVjdG9yJykucHJvcCgnb3V0ZXJIVE1MJylcbiAgICAgICAgICAgIC8vIFRoaXMgYWxzbyBzZWVtZWQgdG8gYmUgYW4gb3ZlcmhlYWRcbiAgICAgICAgICAgIC8vIHdlIGNhbiBhdm9pZC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgcGF0dGVybiBpcyB0byB1c2UgVGVtcGxhdGUgU3RyaW5ncyB3aGlsZVxuICAgICAgICAgICAgLy8gYmVpbmcgY2FyZWZ1bCB0byBlbmNvZGUgdmFsdWVzIHNhZmVseSBmb3IgdXNlXG4gICAgICAgICAgICAvLyBpbiBhbiBhdHRyaWJ1dGUuICBUaGUgXCJlbmNvZGVcIiBmdW5jdGlvbiBkb2VzXG4gICAgICAgICAgICAvLyB0aGUgZW5jb2RpbmcuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy80OVxuXG4gICAgICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZSgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCJcIi8+Jyk7XG4gICAgICAgICAgICAvLyAkKCdsaW5rJykuYXR0cignaHJlZicsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAvLyBpZiAoc3R5bGUubWVkaWEpIHtcbiAgICAgICAgICAgIC8vICAgICAkKCdsaW5rJykuYXR0cignbWVkaWEnLCBzdHlsZS5tZWRpYSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyByZXQgKz0gJC5odG1sKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzICR7cmV0fWApO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfZG9KYXZhU2NyaXB0cyhcbiAgICBtZXRhZGF0YSxcbiAgICBzY3JpcHRzOiBqYXZhU2NyaXB0SXRlbVtdLFxuICAgIG9wdGlvbnMsXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uXG4pIHtcblx0dmFyIHJldCA9ICcnO1xuXHRpZiAoIXNjcmlwdHMpIHJldHVybiByZXQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb0phdmFTY3JpcHRzIG5vIGNvbmZpZycpO1xuXG4gICAgZm9yICh2YXIgc2NyaXB0IG9mIHNjcmlwdHMpIHtcblx0XHRpZiAoIXNjcmlwdC5ocmVmICYmICFzY3JpcHQuc2NyaXB0KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE11c3Qgc3BlY2lmeSBlaXRoZXIgaHJlZiBvciBzY3JpcHQgaW4gJHt1dGlsLmluc3BlY3Qoc2NyaXB0KX1gKTtcblx0XHR9XG4gICAgICAgIGlmICghc2NyaXB0LnNjcmlwdCkgc2NyaXB0LnNjcmlwdCA9ICcnO1xuXG4gICAgICAgIGNvbnN0IGRvVHlwZSA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgdHlwZT1cIiR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRvSHJlZiA9IChocmVmKSA9PiB7XG4gICAgICAgICAgICBpZiAoaHJlZikge1xuICAgICAgICAgICAgICAgIGxldCBzY3JpcHRocmVmID0gaHJlZjtcbiAgICAgICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rc1xuICAgICAgICAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoc2NyaXB0aHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNjcmlwdGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb0phdmFTY3JpcHRzIGFic29sdXRlIHNjcmlwdGhyZWYgJHtzY3JpcHRocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHJld3JvdGUgdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0aHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBzcmM9XCIke2VuY29kZShzY3JpcHRocmVmKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGh0ID0gYDxzY3JpcHQgJHtkb1R5cGUoc2NyaXB0LmxhbmcpfSAke2RvSHJlZihzY3JpcHQuaHJlZil9PiR7c2NyaXB0LnNjcmlwdH08L3NjcmlwdD5gO1xuICAgICAgICByZXQgKz0gaHQ7XG4gICAgfVxuXHRyZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wIDogdW5kZWZpbmVkO1xuXHR9XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXHQvLyBjb25zb2xlLmxvZyhgX2RvSGVhZGVySmF2YVNjcmlwdCAke3V0aWwuaW5zcGVjdChjb25maWcuc2NyaXB0cyl9YCk7XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucywgY29uZmlnOiBDb25maWd1cmF0aW9uKSB7XG5cdHZhciBzY3JpcHRzO1xuXHRpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRCb3R0b20gIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzID8gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbSA6IHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMsIGNvbmZpZyk7XG59XG5cbmNsYXNzIFN0eWxlc2hlZXRzRWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXN0eWxlc2hlZXRzXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9ICBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTdHlsZXNoZWV0c0VsZW1lbnQgYCwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcblx0fVxufVxuXG5jbGFzcyBIZWFkZXJKYXZhU2NyaXB0IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstaGVhZGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbikge1xuXHRcdGxldCByZXQgPSBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEhlYWRlckphdmFTY3JpcHQgYCwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcblx0fVxufVxuXG5jbGFzcyBGb290ZXJKYXZhU2NyaXB0IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstZm9vdGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcblx0fVxufVxuXG5jbGFzcyBIZWFkTGlua1JlbGF0aXZpemVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgLy8gSXQncyBhIGxvY2FsIGxpbmtcbiAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIFNjcmlwdFJlbGF0aXZpemVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzY3JpcHRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcykgcmV0dXJuO1xuICAgICAgICBsZXQgaHJlZiA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuXG4gICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGxpbmtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIEluc2VydFRlYXNlciBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXRlYXNlclwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB0cnkge1xuXHRcdHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFrX3RlYXNlci5odG1sLm5qa1wiLCB7XG5cdFx0XHR0ZWFzZXI6IHR5cGVvZiBtZXRhZGF0YVtcImFrLXRlYXNlclwiXSAhPT0gXCJ1bmRlZmluZWRcIlxuXHRcdFx0XHQ/IG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdIDogbWV0YWRhdGEudGVhc2VyXG5cdFx0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEluc2VydFRlYXNlciBjYXVnaHQgZXJyb3IgYCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG5cdH1cbn1cblxuY2xhc3MgQWtCb2R5Q2xhc3NBZGQgZXh0ZW5kcyBQYWdlUHJvY2Vzc29yIHtcblx0YXN5bmMgcHJvY2VzcygkLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGlmICh0eXBlb2YgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT09ICd1bmRlZmluZWQnXG5cdFx0ICYmIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9ICcnXG5cdFx0ICYmICQoJ2h0bWwgYm9keScpLmdldCgwKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0aWYgKCEkKCdodG1sIGJvZHknKS5oYXNDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCkpIHtcblx0XHRcdFx0XHQkKCdodG1sIGJvZHknKS5hZGRDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZSh1bmRlZmluZWQpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHJldHVybiBQcm9taXNlLnJlc29sdmUoJycpO1xuXHR9XG59XG5cbmNsYXNzIENvZGVFbWJlZCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiY29kZS1lbWJlZFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYENvZGVFbWJlZCBwcm9jZXNzICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50LCBmYWxzZSwgMTApfWApO1xuXG4gICAgICAgIGNvbnN0IGZuID0gJGVsZW1lbnQuYXR0cignZmlsZS1uYW1lJyk7XG4gICAgICAgIGNvbnN0IGxhbmcgPSAkZWxlbWVudC5hdHRyKCdsYW5nJyk7XG4gICAgICAgIGNvbnN0IGlkID0gJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgICAgICBpZiAoIWZuIHx8IGZuID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RlLWVtYmVkIG11c3QgaGF2ZSBmaWxlLW5hbWUgYXJndW1lbnQsIGdvdCAke2ZufWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHR4dHBhdGg7XG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoZm4pKSB7XG4gICAgICAgICAgICB0eHRwYXRoID0gZm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eHRwYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyksIGZuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgY29uc3QgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZCh0eHRwYXRoKTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RlLWVtYmVkIGZpbGUtbmFtZSAke2ZufSBkb2VzIG5vdCByZWZlciB0byB1c2FibGUgZmlsZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICBjb25zdCBkb0xhbmcgPSAobGFuZykgPT4ge1xuICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGNsYXNzPVwiaGxqcyAke2VuY29kZShsYW5nKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnY2xhc3M9XCJobGpzXCInO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBkb0lEID0gKGlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGlkPVwiJHtlbmNvZGUoaWQpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRvQ29kZSA9IChsYW5nLCBjb2RlKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZyAmJiBsYW5nICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0KGNvZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmdcbiAgICAgICAgICAgICAgICB9KS52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0QXV0byhjb2RlKS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgcmV0ID0gYDxwcmUgJHtkb0lEKGlkKX0+PGNvZGUgJHtkb0xhbmcobGFuZyl9PiR7ZG9Db2RlKGxhbmcsIHR4dCl9PC9jb2RlPjwvcHJlPmA7XG4gICAgICAgIHJldHVybiByZXQ7XG5cbiAgICAgICAgLy8gbGV0ICQgPSBtYWhhYmh1dGEucGFyc2UoYDxwcmU+PGNvZGU+PC9jb2RlPjwvcHJlPmApO1xuICAgICAgICAvLyBpZiAobGFuZyAmJiBsYW5nICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFkZENsYXNzKGxhbmcpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vICQoJ2NvZGUnKS5hZGRDbGFzcygnaGxqcycpO1xuICAgICAgICAvLyBpZiAoaWQgJiYgaWQgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdwcmUnKS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBpZiAobGFuZyAmJiBsYW5nICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFwcGVuZChobGpzLmhpZ2hsaWdodCh0eHQsIHtcbiAgICAgICAgLy8gICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAvLyAgICAgfSkudmFsdWUpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFwcGVuZChobGpzLmhpZ2hsaWdodEF1dG8odHh0KS52YWx1ZSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gcmV0dXJuICQuaHRtbCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlIGEgYDxjc3YtdGFibGU+YCBgZmlsZS1uYW1lYCB0byBhbiBhYnNvbHV0ZSBmaWxlc3lzdGVtIHBhdGguXG4gKlxuICogQSBkYXRhIGZpbGUgbWF5IGxpdmUgaW4gYW4gYXNzZXRzIGRpcmVjdG9yeSwgYSBkb2N1bWVudHMgZGlyZWN0b3J5LCBvclxuICogb3V0c2lkZSB0aGUgcHJvamVjdCBkaXJlY3RvcmllcyBlbnRpcmVseSAoc28gdGhlIHJhdyBkYXRhIGlzIG5vdCBjb3BpZWRcbiAqIGludG8gdGhlIGRlcGxveWVkIHNpdGUpLiAgUmVzb2x1dGlvbiBpcyB0cmllZCBpbiB0aGF0IG9yZGVyOlxuICpcbiAqIDEuIFRoZSBhc3NldHMgY2FjaGUsIHRoZW4gdGhlIGRvY3VtZW50cyBjYWNoZSDigJQgYSByZWxhdGl2ZSBgZmlsZS1uYW1lYCBpc1xuICogICAgZmlyc3QgcmVzb2x2ZWQgYWdhaW5zdCB0aGUgY3VycmVudCBkb2N1bWVudCdzIGRpcmVjdG9yeSAoYXMgaW5cbiAqICAgIGBDb2RlRW1iZWRgKS5cbiAqIDIuIEEgcmVhbCBmaWxlc3lzdGVtIHBhdGg6IGFic29sdXRlIHBhdGhzIGFyZSB1c2VkIGFzLWlzLCByZWxhdGl2ZSBwYXRoc1xuICogICAgcmVzb2x2ZSBhZ2FpbnN0IGBjb25maWcuY29uZmlnRGlyYCAodGhlIGRpcmVjdG9yeSBvZiB0aGUgcHJvamVjdCdzXG4gKiAgICBjb25maWd1cmF0aW9uIGZpbGUpLCBtYXRjaGluZyBob3cgcmVsYXRpdmUgYGFzc2V0c0RpcnNgL2Bkb2N1bWVudHNEaXJzYFxuICogICAgYXJlIHJlc29sdmVkLlxuICpcbiAqIEByZXR1cm5zIFRoZSBhYnNvbHV0ZSBmaWxlc3lzdGVtIHBhdGgsIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmQuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVEYXRhRmlsZShjb25maWcsIGFrYXNoYSwgbWV0YWRhdGEsIGZuKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBjYW5kaWRhdGUgPSBwYXRoLmlzQWJzb2x1dGUoZm4pXG4gICAgICAgID8gZm5cbiAgICAgICAgOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuXG4gICAgbGV0IGZvdW5kID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZS5maW5kKGNhbmRpZGF0ZSk7XG4gICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQuZnNwYXRoO1xuICAgIGZvdW5kID0gYXdhaXQgYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZS5maW5kKGNhbmRpZGF0ZSk7XG4gICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQuZnNwYXRoO1xuXG4gICAgLy8gRXh0ZXJuYWwgZmlsZSBvdXRzaWRlIHRoZSBwcm9qZWN0IGRpcmVjdG9yaWVzLiAgUmVsYXRpdmUgcGF0aHMgcmVzb2x2ZVxuICAgIC8vIGFnYWluc3QgY29uZmlnLmNvbmZpZ0RpcjsgYWJzb2x1dGUgcGF0aHMgYXJlIHVzZWQgYXMtaXMuXG4gICAgY29uc3QgZXh0ZXJuYWwgPSBwYXRoLmlzQWJzb2x1dGUoZm4pXG4gICAgICAgID8gZm5cbiAgICAgICAgOiAoY29uZmlnLmNvbmZpZ0RpclxuICAgICAgICAgICAgPyBwYXRoLnJlc29sdmUoY29uZmlnLmNvbmZpZ0RpciwgZm4pXG4gICAgICAgICAgICA6IHBhdGgucmVzb2x2ZShmbikpO1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzcC5hY2Nlc3MoZXh0ZXJuYWwpO1xuICAgICAgICByZXR1cm4gZXh0ZXJuYWw7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5jbGFzcyBDc3ZUYWJsZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiY3N2LXRhYmxlXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgaWYgKCFmbiB8fCBmbiA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY3N2LXRhYmxlIG11c3QgaGF2ZSBmaWxlLW5hbWUgYXR0cmlidXRlLCBnb3QgJHtmbn1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb3dUZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghcm93VGVtcGxhdGUgfHwgcm93VGVtcGxhdGUgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNzdi10YWJsZSBtdXN0IGhhdmUgdGVtcGxhdGUgYXR0cmlidXRlLCBnb3QgJHtyb3dUZW1wbGF0ZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBiZWZvcmVUZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ2JlZm9yZS10ZW1wbGF0ZScpIHx8ICdha19jc3Z0YWJsZV9iZWZvcmUuaHRtbC5uamsnO1xuICAgICAgICBjb25zdCBhZnRlclRlbXBsYXRlICA9ICRlbGVtZW50LmF0dHIoJ2FmdGVyLXRlbXBsYXRlJykgIHx8ICdha19jc3Z0YWJsZV9hZnRlci5odG1sLm5qayc7XG4gICAgICAgIGNvbnN0IGV4cGxpY2l0Rm9ybWF0ID0gJGVsZW1lbnQuYXR0cignZm9ybWF0Jyk7XG4gICAgICAgIGNvbnN0IGRlbGltaXRlciAgICAgID0gJGVsZW1lbnQuYXR0cignZGVsaW1pdGVyJyk7XG4gICAgICAgIGNvbnN0IGhlYWRlciAgICAgICAgID0gJGVsZW1lbnQuYXR0cignaGVhZGVyJyk7XG5cbiAgICAgICAgLy8gUmVzb2x2ZSB0aGUgZGF0YSBmaWxlOiBhc3NldHMsIHRoZW4gZG9jdW1lbnRzLCB0aGVuIGEgZmlsZXN5c3RlbVxuICAgICAgICAvLyBwYXRoIG91dHNpZGUgdGhlIHByb2plY3QgZGlyZWN0b3JpZXMuXG4gICAgICAgIGNvbnN0IGZzcGF0aCA9IGF3YWl0IHJlc29sdmVEYXRhRmlsZSh0aGlzLmNvbmZpZywgdGhpcy5ha2FzaGEsIG1ldGFkYXRhLCBmbik7XG4gICAgICAgIGlmICghZnNwYXRoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNzdi10YWJsZSBmaWxlLW5hbWUgJHtmbn0gbm90IGZvdW5kIGluIGFzc2V0cywgZG9jdW1lbnRzLCBvciBvbiBkaXNrYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmc3BhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgLy8gUGFyc2UgaW50byB0aGUgbm9ybWFsaXplZCByb3cgbW9kZWwuXG4gICAgICAgIGNvbnN0IGZvcm1hdCA9IGluZmVyRm9ybWF0KGZuLCBleHBsaWNpdEZvcm1hdCk7XG4gICAgICAgIGNvbnN0IHsgY29sdW1ucywgcm93cyB9ID0gcGFyc2VUYWJsZURhdGEodGV4dCwgZm9ybWF0LCB7XG4gICAgICAgICAgICBkZWxpbWl0ZXIsXG4gICAgICAgICAgICBoZWFkZXI6IHR5cGVvZiBoZWFkZXIgPT09ICdzdHJpbmcnID8gaGVhZGVyICE9PSAnZmFsc2UnIDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmVuZGVyIHRoZSBiZWZvcmUgdGVtcGxhdGUsIGVhY2ggcm93LCB0aGVuIHRoZSBhZnRlciB0ZW1wbGF0ZS5cbiAgICAgICAgbGV0IG91dCA9IGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsIGJlZm9yZVRlbXBsYXRlLFxuICAgICAgICAgICAgeyBjb2x1bW5zLCByb3dDb3VudDogcm93cy5sZW5ndGggfSk7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgb3V0ICs9IGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsIHJvd1RlbXBsYXRlLCByb3cpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY3N2LXRhYmxlIGZhaWxlZCByZW5kZXJpbmcgcm93ICR7cm93LmluZGV4fSBvZiAke2ZufSB3aXRoIHRlbXBsYXRlICR7cm93VGVtcGxhdGV9OiAke2V9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb3V0ICs9IGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsIGFmdGVyVGVtcGxhdGUsXG4gICAgICAgICAgICB7IGNvbHVtbnMsIHJvd0NvdW50OiByb3dzLmxlbmd0aCB9KTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9XG59XG5cbmNsYXNzIEZpZ3VyZUltYWdlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJmaWctaW1nXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKTtcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkgdGVtcGxhdGUgPSAnYWtfZmlnaW1nLmh0bWwubmprJztcbiAgICAgICAgY29uc3QgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSB0aHJvdyBuZXcgRXJyb3IoJ2ZpZy1pbWcgbXVzdCByZWNlaXZlIGFuIGhyZWYnKTtcbiAgICAgICAgY29uc3QgY2xhenogICA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgICAgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjYXB0aW9uID0gJGVsZW1lbnQuaHRtbCgpO1xuICAgICAgICBjb25zdCB3aWR0aCAgID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgICA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIGltZzJmaWd1cmVJbWFnZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgaW1nW2ZpZ3VyZV0nOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5LCBkb25lKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpIFxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKVxuICAgICAgICAgICAgICAgIDogIFwiYWtfZmlnaW1nLmh0bWwubmprXCI7XG4gICAgICAgIGNvbnN0IGlkID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2xhenogPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBzdHlsZSA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3JjID0gJGVsZW1lbnQuYXR0cignc3JjJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXdpZHRoID0gJGVsZW1lbnQuYXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXRvID0gJGVsZW1lbnQuYXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdjYXB0aW9uJylcbiAgICAgICAgICAgICAgICA/ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCB7XG4gICAgICAgICAgICBpZCwgY2xhenosIHN0eWxlLCB3aWR0aCwgaHJlZjogc3JjLCBkZXN0LCByZXNpemV3aWR0aCwgcmVzaXpldG8sXG4gICAgICAgICAgICBjYXB0aW9uOiBjb250ZW50XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgSW1hZ2VSZXdyaXRlciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgaW1nXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG5cbiAgICAgICAgLy8gV2Ugb25seSBkbyByZXdyaXRlcyBmb3IgbG9jYWwgaW1hZ2VzXG4gICAgICAgIGxldCBzcmMgPSAkbGluay5hdHRyKCdzcmMnKTtcbiAgICAgICAgLy8gRm9yIGxvY2FsIFVSTHMsIHRoaXMgbmV3IFVSTCBjYWxsIHdpbGxcbiAgICAgICAgLy8gbWFrZSB1U3JjLm9yaWdpbiA9PT0gaHR0cDovL2V4YW1wbGUuY29tXG4gICAgICAgIC8vIEhlbmNlLCBpZiBzb21lIG90aGVyIGRvbWFpbiBhcHBlYXJzXG4gICAgICAgIC8vIHRoZW4gd2Uga29udyBpdCdzIG5vdCBhIGxvY2FsIGltYWdlLlxuICAgICAgICBjb25zdCB1U3JjID0gbmV3IFVSTChzcmMsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgaWYgKHVTcmMub3JpZ2luICE9PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQXJlIHdlIGFza2VkIHRvIHJlc2l6ZSB0aGUgaW1hZ2U/XG4gICAgICAgIGNvbnN0IHJlc2l6ZXdpZHRoID0gJGxpbmsuYXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXRvID0gJGxpbmsuYXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAocmVzaXpld2lkdGgpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0byBhIHF1ZXVlIHRoYXQgaXMgcnVuIGF0IHRoZSBlbmQgXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAuYWRkSW1hZ2VUb1Jlc2l6ZShzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pO1xuXG4gICAgICAgICAgICBpZiAocmVzaXpldG8pIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCByZXNpemV0byk7XG4gICAgICAgICAgICAgICAgc3JjID0gcmVzaXpldG87XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBubyBsb25nZXIgbmVlZGVkXG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGlkZWEgaGVyZSBpcyBmb3IgZXZlcnkgbG9jYWwgaW1hZ2Ugc3JjIHRvIGJlIGEgcmVsYXRpdmUgVVJMXG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjKSkge1xuICAgICAgICAgICAgbGV0IG5ld1NyYyA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBzcmMpO1xuICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBJbWFnZVJld3JpdGVyIGFic29sdXRlIGltYWdlIHBhdGggJHtzcmN9IHJld3JvdGUgdG8gJHtuZXdTcmN9YCk7XG4gICAgICAgICAgICBzcmMgPSBuZXdTcmM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgIH1cbn1cblxuY2xhc3MgRG9jdW1lbnRHcm91cCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiZG9jdW1lbnQtZ3JvdXBcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnQtZ3JvdXAgbXVzdCBiZSBnaXZlbiBhIHRlbXBsYXRlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcblxuICAgICAgICAvLyBtaW1lP1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHJlbmRlcnMtdG8taHRtbCBhdHRyaWJ1dGUgaXMgYWJzZW50LCBsZWF2ZVxuICAgICAgICAvLyByZW5kZXJzVG9IVE1MIHVuZGVmaW5lZCBzbyB0aGF0IHRoZSBzZWFyY2ggZG9lcyBub3QgZmlsdGVyXG4gICAgICAgIC8vIG9uIGl0LiAgT25seSB3aGVuIHRoZSBhdHRyaWJ1dGUgaXMgZXhwbGljaXRseSBwcmVzZW50IGRvIHdlXG4gICAgICAgIC8vIGNvbnN0cmFpbiB0aGUgc2VhcmNoIHRvIChub24tKUhUTUwgZG9jdW1lbnRzLlxuICAgICAgICBjb25zdCByZW5kZXJzVG9IVE1MQXR0ciA9ICRlbGVtZW50LmF0dHIoJ3JlbmRlcnMtdG8taHRtbCcpO1xuICAgICAgICBsZXQgcmVuZGVyc1RvSFRNTDogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiByZW5kZXJzVG9IVE1MQXR0ciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUwgPSByZW5kZXJzVG9IVE1MQXR0ciAhPT0gJ2ZhbHNlJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb290UGF0aCA9ICRlbGVtZW50LmF0dHIoJ3Jvb3QtcGF0aCcpO1xuICAgICAgICBjb25zdCB2cGF0aEdsb2IgPSAkZWxlbWVudC5hdHRyKCd2cGF0aC1nbG9iJyk7XG4gICAgICAgIGNvbnN0IHJlbmRlckdsb2IgPSAkZWxlbWVudC5hdHRyKCdyZW5kZXItZ2xvYicpO1xuXG4gICAgICAgIC8vIFBhcnNlIGFuIGF0dHJpYnV0ZSB0aGF0IG1heSBob2xkIGVpdGhlciBhIHNpbmdsZSB2YWx1ZSBvciBhXG4gICAgICAgIC8vIGxpc3Qgb2YgdmFsdWVzLCBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZXR1cm5zIHVuZGVmaW5lZFxuICAgICAgICAvLyB3aGVuIHRoZSBhdHRyaWJ1dGUgaXMgYWJzZW50IG9yIGNvbnRhaW5zIG5vIHVzYWJsZSB2YWx1ZXMsIHNvXG4gICAgICAgIC8vIHRoYXQgdGhlIHNlYXJjaCBkb2VzIG5vdCBmaWx0ZXIgb24gaXQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEEgdmFsdWUgd2hvc2UgdHJpbW1lZCBmb3JtIGJlZ2lucyB3aXRoICdbJyBpcyBwYXJzZWQgYXMgYVxuICAgICAgICAvLyBKU09OIGFycmF5LCBlLmcuIHRhZz0nW1wiVGFnMVwiLCBcIlRhZy1zdHJpbmctMlwiXScuICBUaGlzIGlzXG4gICAgICAgIC8vIHRoZSByb2J1c3Qgd2F5IHRvIGV4cHJlc3MgbXVsdGlwbGUgdmFsdWVzIGJlY2F1c2UgSlNPTlxuICAgICAgICAvLyBoYW5kbGVzIHZhbHVlcyB0aGF0IHRoZW1zZWx2ZXMgY29udGFpbiBjb21tYXMsIHNwYWNlcywgb3JcbiAgICAgICAgLy8gcXVvdGUgY2hhcmFjdGVycyAodGFncyBzdWNoIGFzIGBTb21ldGhpbmcgXCJxdW90ZWRcImApLiAgQW55XG4gICAgICAgIC8vIG90aGVyIHZhbHVlIGlzIHRyZWF0ZWQgYXMgYSBzaW5nbGUgbGl0ZXJhbCBzdHJpbmcsIHNvIHRoZVxuICAgICAgICAvLyBjb21tb24gY2FzZSBzdGF5cyBzaW1wbGUsIGUuZy4gdGFnPVwiVGFnMVwiLlxuICAgICAgICBjb25zdCBhdHRyTGlzdCA9IChuYW1lOiBzdHJpbmcpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9ICRlbGVtZW50LmF0dHIobmFtZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAodHJpbW1lZC5sZW5ndGggPT09IDApIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBsaXN0OiBzdHJpbmdbXTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJ1snKSkge1xuICAgICAgICAgICAgICAgIGxldCBwYXJzZWQ7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZSh0cmltbWVkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnQtZ3JvdXAgJHtuYW1lfSBpcyBub3QgdmFsaWQgSlNPTjogJHt2YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCAke25hbWV9IEpTT04gbXVzdCBiZSBhbiBhcnJheTogJHt2YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGlzdCA9IHBhcnNlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnQtZ3JvdXAgJHtuYW1lfSBhcnJheSBtdXN0IGNvbnRhaW4gb25seSBzdHJpbmdzOiAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdCA9IFsgdHJpbW1lZCBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsaXN0ID0gbGlzdC5maWx0ZXIoaXRlbSA9PiBpdGVtLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgcmV0dXJuIGxpc3QubGVuZ3RoID4gMCA/IGxpc3QgOiB1bmRlZmluZWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRWFjaCBvZiB0aGVzZSBhdHRyaWJ1dGVzIGFjY2VwdHMgZWl0aGVyIGEgc2luZ2xlIHZhbHVlIG9yIGFcbiAgICAgICAgLy8gSlNPTiBhcnJheSBvZiB2YWx1ZXMsIHNvIHRoYXQgYSBkb2N1bWVudCBncm91cCBtYXkgbWF0Y2hcbiAgICAgICAgLy8gbXVsdGlwbGUgbGF5b3V0cywgYmxvZ3RhZ3MsIG9yIHRhZ3MuXG4gICAgICAgIGNvbnN0IGxheW91dHMgPSBhdHRyTGlzdCgnbGF5b3V0Jyk7XG4gICAgICAgIGNvbnN0IGJsb2d0YWdzID0gYXR0ckxpc3QoJ2Jsb2d0YWcnKTtcbiAgICAgICAgY29uc3QgdGFncyA9IGF0dHJMaXN0KCd0YWcnKTtcblxuICAgICAgICBjb25zdCBwYXJlbnREaXIgPSAkZWxlbWVudC5hdHRyKCdwYXJlbnQtZGlyJyk7XG4gICAgICAgIGNvbnN0IGRpcm5hbWUgPSAkZWxlbWVudC5hdHRyKCdkaXJuYW1lJyk7XG4gICAgICAgIGNvbnN0IHNraXBHbG9iID0gJGVsZW1lbnQuYXR0cignc2tpcC1nbG9iJyk7XG4gICAgICAgIGNvbnN0IGxpbWl0ID0gJGVsZW1lbnQuYXR0cignbGltaXQnKTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gJGVsZW1lbnQuYXR0cignb2Zmc2V0Jyk7XG5cbiAgICAgICAgY29uc3Qgc29ydEJ5ID0gJGVsZW1lbnQuYXR0cignc29ydC1ieScpO1xuICAgICAgICBjb25zdCBzb3J0ICAgPSAkZWxlbWVudC5hdHRyKCdzb3J0Jyk7XG5cbiAgICAgICAgLy8gc29ydC1ieSBtYXkgbmFtZSBhIGRvY3VtZW50IGNvbHVtbiAoc3VjaCBhcyB0aXRsZSwgcmVuZGVyUGF0aCxcbiAgICAgICAgLy8gdnBhdGgsIHBhcmVudERpciwgb3IgcHVibGljYXRpb25UaW1lKSBvciBhbnkgZnJvbnRtYXR0ZXIgZmllbGRcbiAgICAgICAgLy8gKHN1Y2ggYXMgYSBjdXN0b20gYHN0ZXBgIG9yZGVyaW5nIGZpZWxkKS4gIFRoZSBzZWFyY2ggcXVlcnlcbiAgICAgICAgLy8gKHNlZSBidWlsZFNlYXJjaFF1ZXJ5IGluIGxpYi9jYWNoZS9jYWNoZS1zcWxpdGUudHMpIHNvcnRzIGJ5IGFcbiAgICAgICAgLy8gY29sdW1uIHdoZW4gdGhlIG5hbWUgbWF0Y2hlcyBvbmUsIGFuZCBvdGhlcndpc2UgZXh0cmFjdHMgdGhlXG4gICAgICAgIC8vIHZhbHVlIGZyb20gdGhlIEpTT04gbWV0YWRhdGEuICBXZSBvbmx5IG5lZWQgdG8gZ3VhcmQgYWdhaW5zdFxuICAgICAgICAvLyBuYW1lcyB0aGF0IGNvdWxkIG5vdCBiZSBhIHNhZmUgZnJvbnRtYXR0ZXIga2V5IGhlcmU7IHRoZSB2YWx1ZVxuICAgICAgICAvLyBpcyBsYXRlciBlc2NhcGVkIGJlZm9yZSB1c2UgaW4gU1FMLlxuICAgICAgICBpZiAodHlwZW9mIHNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghc29ydEJ5Lm1hdGNoKC9eW0EtWmEtel9dW0EtWmEtejAtOV8tXSokLykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50R3JvdXAgc29ydC1ieSBpbmNvcnJlY3QgJHtzb3J0Qnl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc29ydEJ5RGVzY2VuZGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIHNvcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXNvcnQubWF0Y2goL14oZGVzY3xhc2MpJC8pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudEdyb3VwIHNvcnQgaW5jb3JyZWN0ICR7c29ydH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvcnRCeURlc2NlbmRpbmcgPSBzb3J0ID09PSAnZGVzYyc7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbGltaXROdW06IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiBsaW1pdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGxpbWl0TnVtID0gTnVtYmVyLnBhcnNlSW50KGxpbWl0LCAxMCk7XG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGxpbWl0TnVtKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRHcm91cCBsaW1pdCBpbmNvcnJlY3QgJHtsaW1pdH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvZmZzZXROdW06IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvZmZzZXROdW0gPSBOdW1iZXIucGFyc2VJbnQob2Zmc2V0LCAxMCk7XG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKG9mZnNldE51bSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50R3JvdXAgb2Zmc2V0IGluY29ycmVjdCAke29mZnNldH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIHJvb3RQYXRoOiB0eXBlb2Ygcm9vdFBhdGggPT09ICdzdHJpbmcnID8gcm9vdFBhdGggOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBnbG9iOiB0eXBlb2YgdnBhdGhHbG9iID09PSAnc3RyaW5nJyA/IHZwYXRoR2xvYiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlbmRlcmdsb2I6IHR5cGVvZiByZW5kZXJHbG9iID09PSAnc3RyaW5nJyA/IHJlbmRlckdsb2IgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsYXlvdXRzLFxuICAgICAgICAgICAgLy8gVGhlIHNlYXJjaCBxdWVyeSBtYXRjaGVzIGFuIGFycmF5IG9mIGJsb2d0YWdzIHZpYSB0aGVcbiAgICAgICAgICAgIC8vIGBibG9ndGFnc2Agb3B0aW9uLCBhbmQgYSBzaW5nbGUgYmxvZ3RhZyB2aWEgYGJsb2d0YWdgLlxuICAgICAgICAgICAgYmxvZ3RhZ3MsXG4gICAgICAgICAgICB0YWc6IHRhZ3MsXG4gICAgICAgICAgICBwYXJlbnREaXI6IHR5cGVvZiBwYXJlbnREaXIgPT09ICdzdHJpbmcnID8gcGFyZW50RGlyIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZGlybmFtZTogdHlwZW9mIGRpcm5hbWUgPT09ICdzdHJpbmcnID8gZGlybmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHNraXBnbG9iOiB0eXBlb2Ygc2tpcEdsb2IgPT09ICdzdHJpbmcnID8gc2tpcEdsb2IgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsaW1pdDogbGltaXROdW0sXG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldE51bSxcbiAgICAgICAgICAgIHNvcnRCeSxcbiAgICAgICAgICAgIHNvcnRCeURlc2NlbmRpbmdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB3cmFwcGVyVG9wID0gYDxkaXZgXG4gICAgICAgICAgICArIGRvSFRNTEF0dHJpYnV0ZSgnaWQnLCBpZClcbiAgICAgICAgICAgICsgZG9IVE1MQXR0cmlidXRlKCdjbGFzcycsIGNsYXp6KVxuICAgICAgICAgICAgKyBkb0hUTUxBdHRyaWJ1dGUoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAgICAgICArIGRvSFRNTEF0dHJpYnV0ZSgnc3R5bGUnLCBzdHlsZSlcbiAgICAgICAgICAgICsgYD5gO1xuICAgICAgICBjb25zdCB3cmFwcGVyQm90dG9tID0gJzwvZGl2Pic7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZG9jdW1lbnRzLnNlYXJjaChzZWxlY3Rvcik7XG5cbiAgICAgICAgY29uc3QgZWxlbWVudHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuICAgICAgICBcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICBlbGVtZW50cy5wdXNoKGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCB7IGVudHJ5IH1cbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdyYXBwZXJUb3AgKyBlbGVtZW50cy5qb2luKCdcXG4nKSArIHdyYXBwZXJCb3R0b207XG5cbiAgICB9XG59XG5cbmNsYXNzIFNob3dDb250ZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGNvbnN0IGRvYzJyZWFkID0gcmVzb2x2ZVZwYXRoKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgsIGhyZWYpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2hvd0NvbnRlbnQgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSAke2RvYzJyZWFkfWApO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGRvYzJyZWFkKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0LCBjb250ZW50SW1hZ2UsXG4gICAgICAgICAgICBkb2N1bWVudDogZG9jXG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXQgPSBhd2FpdCB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwgZGF0YSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke2hyZWZ9ICR7dXRpbC5pbnNwZWN0KGRhdGEpfSA9PT4gJHtyZXR9YCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG4vKlxuXG5UaGlzIHdhcyBtb3ZlZCBpbnRvIE1haGFiaHV0YVxuXG4gY2xhc3MgUGFydGlhbCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJwYXJ0aWFsXCI7IH1cblx0cHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0Ly8gV2UgZGVmYXVsdCB0byBtYWtpbmcgcGFydGlhbCBzZXQgdGhlIGRpcnR5IGZsYWcuICBCdXQgYSB1c2VyXG5cdFx0Ly8gb2YgdGhlIHBhcnRpYWwgdGFnIGNhbiBjaG9vc2UgdG8gdGVsbCB1cyBpdCBpc24ndCBkaXJ0eS5cblx0XHQvLyBGb3IgZXhhbXBsZSwgaWYgdGhlIHBhcnRpYWwgb25seSBzdWJzdGl0dXRlcyBub3JtYWwgdGFnc1xuXHRcdC8vIHRoZXJlJ3Mgbm8gbmVlZCB0byBkbyB0aGUgZGlydHkgdGhpbmcuXG5cdFx0dmFyIGRvdGhlZGlydHl0aGluZyA9ICRlbGVtZW50LmF0dHIoJ2RpcnR5Jyk7XG5cdFx0aWYgKCFkb3RoZWRpcnR5dGhpbmcgfHwgZG90aGVkaXJ0eXRoaW5nLm1hdGNoKC90cnVlL2kpKSB7XG5cdFx0XHRkaXJ0eSgpO1xuXHRcdH1cblx0XHR2YXIgZm5hbWUgPSAkZWxlbWVudC5hdHRyKFwiZmlsZS1uYW1lXCIpO1xuXHRcdHZhciB0eHQgICA9ICRlbGVtZW50Lmh0bWwoKTtcblx0XHR2YXIgZCA9IHt9O1xuXHRcdGZvciAodmFyIG1wcm9wIGluIG1ldGFkYXRhKSB7IGRbbXByb3BdID0gbWV0YWRhdGFbbXByb3BdOyB9XG5cdFx0dmFyIGRhdGEgPSAkZWxlbWVudC5kYXRhKCk7XG5cdFx0Zm9yICh2YXIgZHByb3AgaW4gZGF0YSkgeyBkW2Rwcm9wXSA9IGRhdGFbZHByb3BdOyB9XG5cdFx0ZFtcInBhcnRpYWxCb2R5XCJdID0gdHh0O1xuXHRcdGxvZygncGFydGlhbCB0YWcgZm5hbWU9JysgZm5hbWUgKycgYXR0cnMgJysgdXRpbC5pbnNwZWN0KGRhdGEpKTtcblx0XHRyZXR1cm4gcmVuZGVyLnBhcnRpYWwodGhpcy5jb25maWcsIGZuYW1lLCBkKVxuXHRcdC50aGVuKGh0bWwgPT4geyByZXR1cm4gaHRtbDsgfSlcblx0XHQuY2F0Y2goZXJyID0+IHtcblx0XHRcdGVycm9yKG5ldyBFcnJvcihcIkZBSUwgcGFydGlhbCBmaWxlLW5hbWU9XCIrIGZuYW1lICtcIiBiZWNhdXNlIFwiKyBlcnIpKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZBSUwgcGFydGlhbCBmaWxlLW5hbWU9XCIrIGZuYW1lICtcIiBiZWNhdXNlIFwiKyBlcnIpO1xuXHRcdH0pO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cy5tYWhhYmh1dGEuYWRkTWFoYWZ1bmMobmV3IFBhcnRpYWwoKSk7ICovXG5cbi8vXG4vLyA8c2VsZWN0LWVsZW1lbnRzIGNsYXNzPVwiLi5cIiBpZD1cIi4uXCIgY291bnQ9XCJOXCI+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gICAgIDxlbGVtZW50PjwvZWxlbWVudD5cbi8vIDwvc2VsZWN0LWVsZW1lbnRzPlxuLy9cbmNsYXNzIFNlbGVjdEVsZW1lbnRzIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgbGV0IGNvdW50ID0gJGxpbmsuYXR0cignY291bnQnKVxuICAgICAgICAgICAgICAgICAgICA/IE51bWJlci5wYXJzZUludCgkbGluay5hdHRyKCdjb3VudCcpKVxuICAgICAgICAgICAgICAgICAgICA6IDE7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGxpbmsuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgPSAkbGluay5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCB0biAgICA9ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgPyAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgIDogJ2Rpdic7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSAkbGluay5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoOyBjb3VudCA+PSAxICYmIGNoaWxkcmVuLmxlbmd0aCA+PSAxOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IF9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKF9uKTtcbiAgICAgICAgICAgIGNvbnN0IGNob3NlbiA9ICQoY2hpbGRyZW5bX25dKS5odG1sKCk7XG4gICAgICAgICAgICBzZWxlY3RlZC5wdXNoKGNob3Nlbik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hvc2VuKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbltfbl07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91dWlkID0gdXVpZHYxKCk7XG4gICAgICAgICRsaW5rLnJlcGxhY2VXaXRoKGA8JHt0bn0gaWQ9JyR7X3V1aWR9Jz48LyR7dG59PmApO1xuICAgICAgICBjb25zdCAkbmV3SXRlbSA9ICQoYCR7dG59IyR7X3V1aWR9YCk7XG4gICAgICAgIGlmIChpZCkgJG5ld0l0ZW0uYXR0cignaWQnLCBpZCk7XG4gICAgICAgIGVsc2UgJG5ld0l0ZW0ucmVtb3ZlQXR0cignaWQnKTtcbiAgICAgICAgaWYgKGNsYXp6KSAkbmV3SXRlbS5hZGRDbGFzcyhjbGF6eik7XG4gICAgICAgIGZvciAobGV0IGNob3NlbiBvZiBzZWxlY3RlZCkge1xuICAgICAgICAgICAgJG5ld0l0ZW0uYXBwZW5kKGNob3Nlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5jbGFzcyBBbmNob3JDbGVhbnVwIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cblxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgaHJlZiAgICAgPSAkbGluay5hdHRyKCdocmVmJyk7XG4gICAgICAgIHZhciBsaW5rdGV4dCA9ICRsaW5rLnRleHQoKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7aHJlZn0gJHtsaW5rdGV4dH1gKTtcbiAgICAgICAgaWYgKGhyZWYgJiYgaHJlZiAhPT0gJyMnKSB7XG4gICAgICAgICAgICAvLyBBbiBhYnNvbHV0ZSBVUkwgKG9uZSBjYXJyeWluZyBhIHNjaGVtZSBzdWNoIGFzIGh0dHA6IG9yXG4gICAgICAgICAgICAvLyBtYWlsdG86KSwgb3IgYSBwcm90b2NvbC1yZWxhdGl2ZSAvL2hvc3QgVVJMLCBpcyBuZXZlciBhIGxvY2FsXG4gICAgICAgICAgICAvLyBsaW5rLiAgVGhpcyBtdXN0IGJlIHRlc3RlZCBiZWZvcmUgdGhlIG9yaWdpbiBjb21wYXJpc29uIGJlbG93OlxuICAgICAgICAgICAgLy8gaXRzICdodHRwOi8vZXhhbXBsZS5jb20nIHNlbnRpbmVsIGlzIGEgcmVhbCBVUkwsIHNvIGFuIG91dGJvdW5kXG4gICAgICAgICAgICAvLyBsaW5rIHRvIGV4YWN0bHkgdGhhdCBvcmlnaW4gd291bGQgb3RoZXJ3aXNlIGJlIG1pc3Rha2VuIGZvciBhXG4gICAgICAgICAgICAvLyBsb2NhbCBsaW5rIGFuZCBtYW5nbGVkIGludG8gYSBwYXRoIGxpa2UgL2h0dHA6L2V4YW1wbGUuY29tLy5cbiAgICAgICAgICAgIGlmIChoYXNVcmxTY2hlbWUoaHJlZikgfHwgaHJlZi5zdGFydHNXaXRoKCcvLycpKSByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgY29uc3QgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gIT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgaWYgKCF1SHJlZi5wYXRobmFtZSkgcmV0dXJuIFwib2tcIjtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgbG9jYWwgJHtocmVmfSAke2xpbmt0ZXh0fSB1SHJlZiAke3VIcmVmLnBhdGhuYW1lfWApO1xuXG4gICAgICAgICAgICAvKiBpZiAobWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9PT0gJ2luZGV4Lmh0bWwubWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgbWV0YWRhdGEuZG9jdW1lbnQucGF0aCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGhyZWYgJHtocmVmfSB1SHJlZi5wYXRobmFtZSAke3VIcmVmLnBhdGhuYW1lfSB0aGlzLmNvbmZpZy5yb290X3VybCAke3RoaXMuY29uZmlnLnJvb3RfdXJsfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCQuaHRtbCgpKTtcbiAgICAgICAgICAgIH0gKi9cblxuICAgICAgICAgICAgLy8gbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgIC8vIFdlIGhhdmUgZGV0ZXJtaW5lZCB0aGlzIGlzIGEgbG9jYWwgaHJlZi5cbiAgICAgICAgICAgIC8vIEZvciByZWZlcmVuY2Ugd2UgbmVlZCB0aGUgYWJzb2x1dGUgcGF0aG5hbWUgb2YgdGhlIGhyZWYgd2l0aGluXG4gICAgICAgICAgICAvLyB0aGUgcHJvamVjdC4gIEZvciBleGFtcGxlIHRvIHJldHJpZXZlIHRoZSB0aXRsZSB3aGVuIHdlJ3JlIGZpbGxpbmdcbiAgICAgICAgICAgIC8vIGluIGZvciBhbiBlbXB0eSA8YT4gd2UgbmVlZCB0aGUgYWJzb2x1dGUgcGF0aG5hbWUuXG5cbiAgICAgICAgICAgIC8vIE1hcmsgdGhpcyBsaW5rIGFzIGhhdmluZyBiZWVuIHByb2Nlc3NlZC5cbiAgICAgICAgICAgIC8vIFRoZSBwdXJwb3NlIGlzIGlmIE1haGFiaHV0YSBydW5zIG11bHRpcGxlIHBhc3NlcyxcbiAgICAgICAgICAgIC8vIHRvIG5vdCBwcm9jZXNzIHRoZSBsaW5rIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICAgICAgLy8gQmVmb3JlIGFkZGluZyB0aGlzIC0gd2Ugc2F3IHRoaXMgTXVuZ2VyIHRha2UgYXMgbXVjaFxuICAgICAgICAgICAgLy8gYXMgODAwbXMgdG8gZXhlY3V0ZSwgZm9yIEVWRVJZIHBhc3MgbWFkZSBieSBNYWhhYmh1dGEuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQWRkaW5nIHRoaXMgYXR0cmlidXRlLCBhbmQgY2hlY2tpbmcgZm9yIGl0IGluIHRoZSBzZWxlY3RvcixcbiAgICAgICAgICAgIC8vIG1lYW5zIHdlIG9ubHkgcHJvY2VzcyB0aGUgbGluayBvbmNlLlxuICAgICAgICAgICAgJGxpbmsuYXR0cignbXVuZ2VkJywgJ3llcycpO1xuXG4gICAgICAgICAgICAvLyBUaGUgcXVlcnkgc3RyaW5nIGFuZCBmcmFnbWVudCBhcmUgb3BhcXVlIHRvIGV2ZXJ5dGhpbmcgYmVsb3c6XG4gICAgICAgICAgICAvLyBwYXRoIG5vcm1hbGl6YXRpb24gYW5kIHJlbGF0aXZpemF0aW9uIG11c3Qgb3BlcmF0ZSBvbiB0aGVcbiAgICAgICAgICAgIC8vIHBhdGggYWxvbmUsIHdpdGggdGhlIHF1ZXJ5L2ZyYWdtZW50IHJlLWFwcGVuZGVkIHZlcmJhdGltLlxuICAgICAgICAgICAgLy8gQSBmcmFnbWVudCBjYW4gaXRzZWxmIGNhcnJ5IGEgcmVsYXRpdmUgcGF0aCAodGhlXG4gICAgICAgICAgICAvLyBkb2N1bWVudC12aWV3ZXJzIHBsdWdpbidzXG4gICAgICAgICAgICAvLyAvdmVuZG9yL1ZpZXdlci5qcy9pbmRleC5odG1sIy4uLy4uLy4uL2RvYy5wZGYgaHJlZiksIGFuZFxuICAgICAgICAgICAgLy8gbGV0dGluZyBpdCBwYXJ0aWNpcGF0ZSBpbiBwYXRoIGFyaXRobWV0aWMgbWFuZ2xlcyB0aGUgaHJlZi5cbiAgICAgICAgICAgIGNvbnN0IGZyYWdJbmRleCAgPSBocmVmLmluZGV4T2YoJyMnKTtcbiAgICAgICAgICAgIGNvbnN0IGZyYWdtZW50ICAgPSBmcmFnSW5kZXggID49IDAgPyBocmVmLnN1YnN0cmluZyhmcmFnSW5kZXgpICAgICAgOiAnJztcbiAgICAgICAgICAgIGxldCAgIHBhdGhQYXJ0ICAgPSBmcmFnSW5kZXggID49IDAgPyBocmVmLnN1YnN0cmluZygwLCBmcmFnSW5kZXgpICAgOiBocmVmO1xuICAgICAgICAgICAgY29uc3QgcXVlcnlJbmRleCA9IHBhdGhQYXJ0LmluZGV4T2YoJz8nKTtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ICAgICAgPSBxdWVyeUluZGV4ID49IDAgPyBwYXRoUGFydC5zdWJzdHJpbmcocXVlcnlJbmRleCkgOiAnJztcbiAgICAgICAgICAgIGlmIChxdWVyeUluZGV4ICAgPj0gMCkgcGF0aFBhcnQgPSBwYXRoUGFydC5zdWJzdHJpbmcoMCwgcXVlcnlJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEEgZnJhZ21lbnQtb25seSAoI25hbWUpIG9yIHF1ZXJ5LW9ubHkgKD94KSByZWZlcmVuY2UgaXMgYVxuICAgICAgICAgICAgLy8gc2FtZS1wYWdlIGFuY2hvcjogdGhlcmUgaXMgbm8gcGF0aCB0byByZXNvbHZlIG9yIHJlbGF0aXZpemUuXG4gICAgICAgICAgICBpZiAocGF0aFBhcnQgPT09ICcnKSByZXR1cm4gXCJva1wiO1xuXG4gICAgICAgICAgICBsZXQgYWJzb2x1dGVQYXRoID0gcmVzb2x2ZVZwYXRoKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgsIHBhdGhQYXJ0KTtcblxuICAgICAgICAgICAgLy8gVGhlIGlkZWEgZm9yIHRoaXMgc2VjdGlvbiBpcyB0byBlbnN1cmUgYWxsIGxvY2FsIGhyZWYncyBhcmUgXG4gICAgICAgICAgICAvLyBmb3IgYSByZWxhdGl2ZSBwYXRoIHJhdGhlciB0aGFuIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIEhlbmNlIHdlIHVzZSB0aGUgcmVsYXRpdmUgbW9kdWxlIHRvIGNvbXB1dGUgdGhlIHJlbGF0aXZlIHBhdGhcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBFeGFtcGxlOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAvaW5kZXguaHRtbCBpbiB7XG4gICAgICAgICAgICAvLyAgYmFzZWRpcjogJy9Wb2x1bWVzL0V4dHJhL2FrYXNoYXJlbmRlci9ha2FzaGFyZW5kZXIvdGVzdC9kb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gIHJlbHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbHJlbmRlcjogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbCcsXG4gICAgICAgICAgICAvLyAgcGF0aDogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbC5tZCcsXG4gICAgICAgICAgICAvLyAgcmVuZGVyVG86ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnXG4gICAgICAgICAgICAvLyB9IHRvIC4uLy4uLy4uL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3NcbiAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUocGF0aFBhcnQpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgcGF0aFBhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyBxdWVyeSArIGZyYWdtZW50O1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBkZS1hYnNvbHV0ZSBocmVmICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExvb2sgdG8gc2VlIGlmIGl0J3MgYW4gYXNzZXQgZmlsZVxuICAgICAgICAgICAgbGV0IGZvdW5kQXNzZXQ7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGZvdW5kQXNzZXQgPSBhd2FpdCBhc3NldHMuZmluZChhYnNvbHV0ZVBhdGgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGZvdW5kQXNzZXQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZm91bmRBc3NldCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGlzIGFzc2V0ICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kQXNzZXQgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIEFzayBwbHVnaW5zIGlmIHRoZSBocmVmIGlzIG9rYXlcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5hc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoYWJzb2x1dGVQYXRoKSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGlzIGxlZ2l0IGxvY2FsIGhyZWYgJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBsaW5rIGhhcyBhIGJvZHksIHRoZW4gZG9uJ3QgbW9kaWZ5IGl0XG4gICAgICAgICAgICBpZiAoKGxpbmt0ZXh0ICYmIGxpbmt0ZXh0Lmxlbmd0aCA+IDAgJiYgbGlua3RleHQgIT09IGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICB8fCAoJGxpbmsuY2hpbGRyZW4oKS5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIHNraXBwaW5nICR7YWJzb2x1dGVQYXRofSB3LyAke3V0aWwuaW5zcGVjdChsaW5rdGV4dCl9IGNoaWxkcmVuPSAkeyRsaW5rLmNoaWxkcmVuKCl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRG9lcyBpdCBleGlzdCBpbiBkb2N1bWVudHMgZGlyP1xuICAgICAgICAgICAgaWYgKGFic29sdXRlUGF0aCA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gJy9pbmRleC5odG1sJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBmaW5kUmVuZGVyc1RvICR7YWJzb2x1dGVQYXRofSAke3V0aWwuaW5zcGVjdChmb3VuZCl9YCk7XG4gICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gUmVwb3J0IGEgYnJva2VuIGludGVybmFsIGxpbmssIGdhdGVkIG9uIHRoZSBjb25maWd1cmVkXG4gICAgICAgICAgICAgICAgLy8gaW50ZXJuYWwgbGluay1jaGVjayBtb2RlLiAgVGhlIGF1dGhvcml0YXRpdmUgZXJyb3IvZmF0YWxcbiAgICAgICAgICAgICAgICAvLyBlbmZvcmNlbWVudCAod2hpY2ggZmFpbHMgdGhlIGJ1aWxkKSBoYXBwZW5zIGluIHRoZVxuICAgICAgICAgICAgICAgIC8vIHdob2xlLXNpdGUgc2NhbiBkdXJpbmcgb25TaXRlUmVuZGVyZWQ7IGhlcmUgd2Ugb25seSBzdXJmYWNlXG4gICAgICAgICAgICAgICAgLy8gdGhlIHdhcm5pbmcgZHVyaW5nIHJlbmRlcmluZyB1bmxlc3MgY2hlY2tpbmcgaXMgZGlzYWJsZWQuXG4gICAgICAgICAgICAgICAgY29uc3QgbW9kZSA9IHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8ub3B0aW9ucz8uY2hlY2tMaW5rcz8uaW50ZXJuYWw7XG4gICAgICAgICAgICAgICAgaWYgKG1vZGUgJiYgbW9kZSAhPT0gJ2lnbm9yZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFdBUk5JTkc6IERpZCBub3QgZmluZCAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnLmRvY3VtZW50RGlycyl9IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gYWJzb2x1dGVQYXRoICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJzVG8gJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBkaXJlY3RvcnksIHRoZXJlIG1pZ2h0IGJlIC9wYXRoL3RvL2luZGV4Lmh0bWwgc28gd2UgdHJ5IGZvciB0aGF0LlxuICAgICAgICAgICAgLy8gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoIHdvdWxkIGZhaWwgb24ganVzdCAvcGF0aC90byBidXQgc3VjY2VlZFxuICAgICAgICAgICAgLy8gb24gL3BhdGgvdG8vaW5kZXguaHRtbFxuICAgICAgICAgICAgaWYgKGZvdW5kLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBcImluZGV4Lmh0bWxcIikpO1xuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgaW50byBmaWxsaW5nIGVtcHRpbmVzcyB3aXRoIHRpdGxlXG5cbiAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIGlmICghJGxpbmsuYXR0cigndGl0bGUnKSAmJiBkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGNoYW5nZWQgbGluayB0ZXh0ICR7aHJlZn0gdG8gJHtkb2NtZXRhLnRpdGxlfWApO1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGNoYW5nZWQgbGluayB0ZXh0ICR7aHJlZn0gdG8gJHtocmVmfWApO1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoaHJlZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyZXJQYXRoICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRvY21ldGEgPSBmb3VuZC5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvKiB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jbWV0YSA9IGF3YWl0IHJlbmRlcmVyLm1ldGFkYXRhKGZvdW5kLmZvdW5kRGlyLCBmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJldHJpZXZlIGRvY3VtZW50IG1ldGFkYXRhIGZvciAke2ZvdW5kLmZvdW5kRGlyfSAke2ZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcn0gYmVjYXVzZSAke2Vycn1gKTtcbiAgICAgICAgICAgICAgICB9ICotLS9cbiAgICAgICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RpdGxlJywgZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsudGV4dChkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluaXNoZWRgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gRE9ORSAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBib3RoZXIgdGhyb3dpbmcgYW4gZXJyb3IuICBKdXN0IGZpbGwgaXQgaW4gd2l0aFxuICAgICAgICAgICAgICAgIC8vIHNvbWV0aGluZy5cbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbGwgaW4gZW1wdHkgJ2EnIGVsZW1lbnQgaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSB3aXRoIGhyZWYgJHtocmVmfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8gIE1BSEFGVU5DUyBGT1IgRklOQUwgUEFTU1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIDxjb2RlPm11bmdlZD15ZXM8L2NvZGU+IGF0dHJpYnV0ZSB0aGF0IGlzIGFkZGVkXG4gKiBieSA8Y29kZT5BbmNob3JDbGVhbnVwPC9jb2RlPi5cbiAqL1xuY2xhc3MgTXVuZ2VkQXR0clJlbW92ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgJGVsZW1lbnQucmVtb3ZlQXR0cignbXVuZ2VkJyk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbi8qKlxuICogSGFuZGxlcyB0aGUgcmVjb21tZW5kYXRpb25zIGluOlxuICogaHR0cHM6Ly9qYXZhc2NyaXB0LnBsYWluZW5nbGlzaC5pby9vbmUtbGluZS1vZi1odG1sLXRoYXQtbWFrZXMtZXh0ZXJuYWwtbGlua3Mtc2FmZXItOTVmZTRiYTZmZjI4XG4gKi9cbmNsYXNzIEJsYW5rTGlua0RlZmFuZ2VyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbdGFyZ2V0PV9ibGFua10nOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW3RhcmdldD1fYmxhbmtdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgdGhpcy5ha2FzaGEubGlua1JlbFNldEF0dHIoJGVsZW1lbnQsICdub29wZW5lcicsIHRydWUpO1xuICAgICAgICB0aGlzLmFrYXNoYS5saW5rUmVsU2V0QXR0cigkZWxlbWVudCwgJ25vcmVmZXJyZXInLCB0cnVlKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYENoYW5nZWQgcmVsIGF0dHIgdG8gJHskZWxlbWVudC5hdHRyKCdyZWwnKX1gKTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLyBOdW5qdWNrcyBFeHRlbnNpb25zXG5cbi8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvZnRvbmljL251bmp1Y2tzLWluY2x1ZGUtd2l0aC90cmVlL21hc3RlclxuXG5jbGFzcyBzdHlsZXNoZWV0c0V4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha3N0eWxlc2hlZXRzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtzdHlsZXNoZWV0cycpO1xuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc3R5bGVzaGVldHNFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvU3R5bGVzaGVldHMoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtoZWFkZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2hlYWRlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvSGVhZGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2Zvb3RlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrZm9vdGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9Gb290ZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0ZXN0RXh0ZW5zaW9uKCkge1xuICAgIHRoaXMudGFncyA9IFsgJ2FrbmprdGVzdCcgXTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbihwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuY29uc29sZS5sb2coYGluIHRlc3RFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlcnJvcicsICdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIHZhciBlcnJvckJvZHkgPSBudWxsO1xuXG4gICAgICAgICAgICBpZihwYXJzZXIuc2tpcFN5bWJvbCgnZXJyb3InKSkge1xuICAgICAgICAgICAgICAgIHBhcnNlci5za2lwKGxleGVyLlRPS0VOX0JMT0NLX0VORCk7XG4gICAgICAgICAgICAgICAgZXJyb3JCb2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5LCBlcnJvckJvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB0ZXN0RXh0aW9uc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbihjb250ZXh0LCB1cmwsIGJvZHksIGVycm9yQm9keSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgYWtuamt0ZXN0ICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfSAke3V0aWwuaW5zcGVjdCh1cmwpfSAke3V0aWwuaW5zcGVjdChib2R5KX0gJHt1dGlsLmluc3BlY3QoZXJyb3JCb2R5KX1gKTtcbiAgICB9O1xuXG59XG4iXX0=