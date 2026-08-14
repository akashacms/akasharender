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
import { LinkChecker, DEFAULT_LINK_CHECK_OPTIONS, assertMode } from './link-checker.js';
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
            let absolutePath = resolveVpath(metadata.document.path, href);
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
                && path.isAbsolute(href)) {
                let newHref = relative(`/${metadata.document.renderTo}`, href);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsWUFBWSxFQUFFLGVBQWUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNoSSxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzdELE9BQU8sRUFDSCxXQUFXLEVBQ1gsMEJBQTBCLEVBQzFCLFVBQVUsRUFFYixNQUFNLG1CQUFtQixDQUFDO0FBRTNCLE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDO0FBRXZDLE1BQU0sT0FBTyxhQUFjLFNBQVEsTUFBTTtJQUN4QztRQUNDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQzs7UUFLaEIsd0NBQVE7UUFDUiw4Q0FBYztRQUxWLHVCQUFBLElBQUksK0JB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QWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQyxDQUFDO0FBRU4sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgZnNwIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gJ3V1aWQnO1xuY29uc3QgdXVpZHYxID0gdXVpZC52MTtcbmltcG9ydCAqIGFzIHJlbmRlciBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5pbXBvcnQgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuaW1wb3J0IGhsanMgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmltcG9ydCBtYWhhTWV0YWRhdGEgZnJvbSAnbWFoYWJodXRhL21haGEvbWV0YWRhdGEuanMnO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuaW1wb3J0IFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge2VuY29kZX0gZnJvbSAnaHRtbC1lbnRpdGllcyc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBDdXN0b21FbGVtZW50LCBNdW5nZXIsIFBhZ2VQcm9jZXNzb3IsIGphdmFTY3JpcHRJdGVtLCByZXNvbHZlVnBhdGgsIGRvSFRNTEF0dHJpYnV0ZSB9IGZyb20gJy4vaW5kZXguanMnO1xuaW1wb3J0IHsgaW5mZXJGb3JtYXQsIHBhcnNlVGFibGVEYXRhIH0gZnJvbSAnLi9jc3YtdGFibGUuanMnO1xuaW1wb3J0IHtcbiAgICBMaW5rQ2hlY2tlcixcbiAgICBERUZBVUxUX0xJTktfQ0hFQ0tfT1BUSU9OUyxcbiAgICBhc3NlcnRNb2RlLFxuICAgIHR5cGUgTGlua0NoZWNrTW9kZVxufSBmcm9tICcuL2xpbmstY2hlY2tlci5qcyc7XG5cbmNvbnN0IHBsdWdpbk5hbWUgPSBcImFrYXNoYWNtcy1idWlsdGluXCI7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdEluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIocGx1Z2luTmFtZSk7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZSA9IFtdO1xuXG5cdH1cblxuICAgICNjb25maWc7XG4gICAgI3Jlc2l6ZV9xdWV1ZTtcblxuXHRjb25maWd1cmUoY29uZmlnOiBDb25maWd1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIExpbmstY2hlY2tpbmcgb3B0aW9ucy4gIFNlZSBsaWIvbGluay1jaGVja2VyLnRzLiAgRGVmYXVsdHMgbGVhdmVcbiAgICAgICAgLy8gZXh0ZXJuYWwgY2hlY2tpbmcgb2ZmICgnaWdub3JlJykgYmVjYXVzZSBpdCBpcyBzbG93IGFuZCBmbGFreSwgYW5kXG4gICAgICAgIC8vIGludGVybmFsIGNoZWNraW5nIGF0ICd3YXJuJy4gIEEgdXNlciBtYXkgb3ZlcnJpZGUgYW55IG9mIHRoZXNlIHZpYVxuICAgICAgICAvLyBjb25maWcgb3IgdGhlIGNoYWluYWJsZSBzZXR0ZXJzIGJlbG93LlxuICAgICAgICB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcyA9IE9iamVjdC5hc3NpZ24oXG4gICAgICAgICAgICB7fSwgREVGQVVMVF9MSU5LX0NIRUNLX09QVElPTlMsIHRoaXMub3B0aW9ucy5jaGVja0xpbmtzIHx8IHt9XG4gICAgICAgICk7XG4gICAgICAgIGxldCBtb2R1bGVEaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbiAgICAgICAgLy8gTmVlZCB0aGlzIGFzIHRoZSBwbGFjZSB0byBzdG9yZSBOdW5qdWNrcyBtYWNyb3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICBjb25maWcuYWRkTGF5b3V0c0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ2xheW91dHMnKSk7XG4gICAgICAgIGNvbmZpZy5hZGRQYXJ0aWFsc0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ3BhcnRpYWxzJykpO1xuICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gdGhlIENvbmZpZ3VyYXRpb24gY29uc3RydWN0b3IuICBUaGUgaWRlYSBpcyB0byBwdXRcbiAgICAgICAgLy8gbWFoYVBhcnRpYWwgYXMgdGhlIHZlcnkgZmlyc3QgTWFoYWZ1bmMgc28gdGhhdCBhbGxcbiAgICAgICAgLy8gUGFydGlhbCdzIGFyZSBoYW5kbGVkIGJlZm9yZSBhbnl0aGluZyBlbHNlLiAgVGhlIGlzc3VlIGNhdXNpbmdcbiAgICAgICAgLy8gdGhpcyBjaGFuZ2UgaXMgdGhlIE9wZW5HcmFwaFByb21vdGVJbWFnZXMgTWFoYWZ1bmMgaW5cbiAgICAgICAgLy8gYWthc2hhY2hzLWJhc2UgYW5kIHByb2Nlc3NpbmcgYW55IGltYWdlcyBicm91Z2h0IGluIGJ5IHBhcnRpYWxzLlxuICAgICAgICAvLyBFbnN1cmluZyB0aGUgcGFydGlhbCB0YWcgaXMgcHJvY2Vzc2VkIGJlZm9yZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzXG4gICAgICAgIC8vIG1lYW50IHN1Y2ggaW1hZ2VzIHdlcmUgcHJvcGVybHkgcHJvbW90ZWQuXG4gICAgICAgIC8vIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAvLyAgICAgcmVuZGVyUGFydGlhbDogb3B0aW9ucy5yZW5kZXJQYXJ0aWFsXG4gICAgICAgIC8vIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhTWV0YWRhdGEubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgLy8gRG8gbm90IHBhc3MgdGhpcyB0aHJvdWdoIHNvIHRoYXQgTWFoYWJodXRhIHdpbGwgbm90XG4gICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIGxpbmtzIHRvIHN1YmRpcmVjdG9yaWVzXG4gICAgICAgICAgICAvLyByb290X3VybDogY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICAvLyBUT0RPIGhvdyB0byBjb25maWd1cmUgdGhpc1xuICAgICAgICAgICAgLy8gc2l0ZW1hcF90aXRsZTogLi4uLj9cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFiaHV0YUFycmF5KG9wdGlvbnMsIGNvbmZpZywgdGhpcy5ha2FzaGEsIHRoaXMpKTtcblxuICAgICAgICBjb25zdCBuamsgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJOYW1lKCcuaHRtbC5uamsnKSBhcyBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICBuZXcgc3R5bGVzaGVldHNFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtoZWFkZXJqcycsXG4gICAgICAgICAgICBuZXcgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2Zvb3RlcmpzJyxcbiAgICAgICAgICAgIG5ldyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIGV4dGVuc2lvbnMgd2VyZSBpbnN0YWxsZWRcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgW1xuICAgICAgICAgICAgICAgICAgICAnYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICAgICAgICAgICdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FrZm9vdGVyanMnXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbihleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmUgLSBOSksgZG9lcyBub3QgaGF2ZSBleHRlbnNpb24gLSAke2V4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gdHJ5IHtcbiAgICAgICAgLy8gICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrbmprdGVzdCcsIG5ldyB0ZXN0RXh0ZW5zaW9uKCkpO1xuICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKCkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIFxuICAgICAgICAvLyBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oJ2FrbmprdGVzdCcpKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBha25qa3Rlc3QgZXh0ZW5zaW9uIG5vdCBhZGRlZD9gKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgZXhpc3RzYCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgLy8gZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG5cbiAgICBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8bGluaz4gdGFncyBpbiB0aGUgPGhlYWQ+IGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplSGVhZExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8c2NyaXB0PiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplU2NyaXB0TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPEE+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVCb2R5TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc2V2ZXJpdHkgbW9kZSBmb3IgaW50ZXJuYWwgKGxvY2FsKSBsaW5rIGNoZWNraW5nLlxuICAgICAqIE9uZSBvZiAnaWdub3JlJyB8ICd3YXJuJyB8ICdlcnJvcicgfCAnZmF0YWwnLlxuICAgICAqL1xuICAgIHNldEludGVybmFsTGlua01vZGUoY29uZmlnLCBtb2RlOiBMaW5rQ2hlY2tNb2RlKSB7XG4gICAgICAgIGFzc2VydE1vZGUobW9kZSwgJ2ludGVybmFsJyk7XG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGVja0xpbmtzLmludGVybmFsID0gbW9kZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0IHRoZSBzZXZlcml0eSBtb2RlIGZvciBleHRlcm5hbCAoaHR0cC9odHRwcykgbGluayBjaGVja2luZy5cbiAgICAgKiBPbmUgb2YgJ2lnbm9yZScgfCAnd2FybicgfCAnZXJyb3InIHwgJ2ZhdGFsJy4gICdpZ25vcmUnICh0aGUgZGVmYXVsdClcbiAgICAgKiBkaXNhYmxlcyBleHRlcm5hbCBjaGVja2luZy5cbiAgICAgKi9cbiAgICBzZXRFeHRlcm5hbExpbmtNb2RlKGNvbmZpZywgbW9kZTogTGlua0NoZWNrTW9kZSkge1xuICAgICAgICBhc3NlcnRNb2RlKG1vZGUsICdleHRlcm5hbCcpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcy5leHRlcm5hbCA9IG1vZGU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNldCB0aGUgc2V2ZXJpdHkgbW9kZSBmb3Igbm9uLUhUVFAgbGlua3MgKG1haWx0bzosIHRlbDosIC4uLikuXG4gICAgICogT25lIG9mICdpZ25vcmUnIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdmYXRhbCcuICAnaWdub3JlJyAodGhlIGRlZmF1bHQpXG4gICAgICogc2lsZW50bHkgc2tpcHMgdGhlbTsgJ3dhcm4nIGxvZ3MgdGhlbSBmb3IgcmV2aWV3LlxuICAgICAqL1xuICAgIHNldE90aGVyU2NoZW1lc01vZGUoY29uZmlnLCBtb2RlOiBMaW5rQ2hlY2tNb2RlKSB7XG4gICAgICAgIGFzc2VydE1vZGUobW9kZSwgJ3JlcG9ydE90aGVyU2NoZW1lcycpO1xuICAgICAgICB0aGlzLm9wdGlvbnMuY2hlY2tMaW5rcy5yZXBvcnRPdGhlclNjaGVtZXMgPSBtb2RlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gZXh0ZXJuYWwgZG9tYWluIG9yIFVSTCAoc3RyaW5nKSBvciBSZWdFeHAgdG8gdGhlIGxpbmstY2hlY2tcbiAgICAgKiB3aGl0ZWxpc3QuICBXaGl0ZWxpc3RlZCBleHRlcm5hbCBVUkxzIGFyZSBhc3N1bWVkIHZhbGlkIGFuZCBuZXZlciBmZXRjaGVkLlxuICAgICAqL1xuICAgIGFkZExpbmtDaGVja1doaXRlbGlzdChjb25maWcsIGVudHJ5OiBzdHJpbmcgfCBSZWdFeHApIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHRoaXMub3B0aW9ucy5jaGVja0xpbmtzLndoaXRlbGlzdCkpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jaGVja0xpbmtzLndoaXRlbGlzdCA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9ucy5jaGVja0xpbmtzLndoaXRlbGlzdC5wdXNoKGVudHJ5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VsZWN0IHdoaWNoIGV4dGVybmFsIHBlci1VUkwgY2hlY2tlciB0byB1c2U6ICdmZXRjaCcgKGJ1aWx0LWluLFxuICAgICAqIHplcm8tZGVwZW5kZW5jeSkgb3IgJ2xpbmstY2hlY2snIChsYXp5LWxvYWRzIHRoZSBzaXRlLWF1dGhvci1pbnN0YWxsZWRcbiAgICAgKiBgbGluay1jaGVja2AgcGFja2FnZSkuXG4gICAgICovXG4gICAgc2V0RXh0ZXJuYWxDaGVja2VyKGNvbmZpZywgd2hpY2g6ICdmZXRjaCcgfCAnbGluay1jaGVjaycpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNoZWNrTGlua3MuZXh0ZXJuYWxDaGVja2VyID0gd2hpY2g7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGRvU3R5bGVzaGVldHMobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgYWRkSW1hZ2VUb1Jlc2l6ZShzcmM6IHN0cmluZywgcmVzaXpld2lkdGg6IG51bWJlciwgcmVzaXpldG86IHN0cmluZywgZG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGRJbWFnZVRvUmVzaXplICR7c3JjfSByZXNpemV3aWR0aCAke3Jlc2l6ZXdpZHRofSByZXNpemV0byAke3Jlc2l6ZXRvfWApXG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBzZWN0aW9uIHdhcyBhZGRlZCBpbiB0aGUgcG9zc2liaWxpdHkgb2ZcbiAgICAvLyBtb3ZpbmcgdGFnZ2VkLWNvbnRlbnQgaW50byB0aGUgY29yZS5cbiAgICAvLyBBZnRlciB0cnlpbmcgdGhpcywgdGhhdCBzZWVtcyBsaWtlIGEgbm9uLXN0YXJ0ZXJcbiAgICAvLyBvZiBhIHByb2plY3QgaWRlYS5cblxuICAgIC8vICNwYXRoSW5kZXhlczogc3RyaW5nO1xuXG4gICAgLy8gc2V0IHBhdGhJbmRleGVzKGluZGV4ZXMpIHsgdGhpcy4jcGF0aEluZGV4ZXMgPSBpbmRleGVzOyB9XG4gICAgLy8gZ2V0IHBhdGhJbmRleGVzKCkgICAgICAgIHsgcmV0dXJuIHRoaXMuI3BhdGhJbmRleGVzOyB9XG5cbiAgICAvLyB0YWdQYWdlVXJsKGNvbmZpZywgdGFnTmFtZSkge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHRoaXMuI3BhdGhJbmRleGVzICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcihgQnVpbHRJblBsdWdpbiBwYXRoSW5kZXhlcyBoYXMgbm90IGJlZW4gc2V0ICR7dXRpbC5pbnNwZWN0KHRoaXMuI3BhdGhJbmRleGVzKX1gKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBpZiAodGhpcy5wYXRoSW5kZXhlcy5lbmRzV2l0aCgnLycpKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5wYXRoSW5kZXhlcyArIHRhZzJlbmNvZGU0dXJsKHRhZ05hbWUpICsnLmh0bWwnO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucGF0aEluZGV4ZXMgKycvJysgdGFnMmVuY29kZTR1cmwodGFnTmFtZSkgKycuaHRtbCc7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhc3luYyBkb1RhZ3NGb3JEb2N1bWVudChjb25maWcsIG1ldGFkYXRhLCB0ZW1wbGF0ZSkge1xuICAgIC8vICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gICAgIGNvbnN0IHBsdWdpbiA9IHRoaXM7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnZG9UYWdzRm9yRG9jdW1lbnQgJysgdXRpbC5pbnNwZWN0KG1ldGFkYXRhKSk7XG4gICAgLy8gICAgIGNvbnN0IHRhZ2xpc3QgPSAoXG4gICAgLy8gICAgICAgICAgICAgJ3RhZ3MnIGluIG1ldGFkYXRhXG4gICAgLy8gICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkobWV0YWRhdGEudGFncylcbiAgICAvLyAgICAgICAgICkgPyBtZXRhZGF0YS50YWdzIDogW107XG4gICAgLy8gICAgIGlmICh0YWdsaXN0KSB7XG4gICAgLy8gICAgICAgICBjb25zdCB0YWd6bGlzdCA9IFtdO1xuICAgIC8vICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFnbGlzdCkge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3psaXN0LnB1c2goe1xuICAgIC8vICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ1VybDogcGx1Z2luLnRhZ1BhZ2VVcmwoY29uZmlnLCB0YWcpLFxuICAgIC8vICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYXdhaXQgZG9jdW1lbnRzLmdldFRhZ0Rlc2NyaXB0aW9uKHRhZylcbiAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkb1RhZ3NGb3JEb2N1bWVudCAnKyB1dGlsLmluc3BlY3QodGFnbGlzdCkpO1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3o6IHRhZ3psaXN0XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfSBlbHNlIHJldHVybiBcIlwiO1xuICAgIC8vIH1cblxuICAgIGFzeW5jIG9uU2l0ZVJlbmRlcmVkKGNvbmZpZykge1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICB3aGlsZSAoQXJyYXkuaXNBcnJheSh0aGlzLiNyZXNpemVfcXVldWUpXG4gICAgICAgICAgICAmJiB0aGlzLiNyZXNpemVfcXVldWUubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgICBsZXQgdG9yZXNpemUgPSB0aGlzLiNyZXNpemVfcXVldWUucG9wKCk7XG5cbiAgICAgICAgICAgIGxldCBpbWcycmVzaXplO1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodG9yZXNpemUuc3JjKSkge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgdG9yZXNpemUuc3JjXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSB0b3Jlc2l6ZS5zcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzcmNmaWxlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBhc3NldHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIHNyY2ZpbGUgPSBmb3VuZC5mc3BhdGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoaW1nMnJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kID8gZm91bmQuZnNwYXRoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzcmNmaWxlKSB0aHJvdyBuZXcgRXJyb3IoYGFrYXNoYWNtcy1idWlsdGluOiBEaWQgbm90IGZpbmQgc291cmNlIGZpbGUgZm9yIGltYWdlIHRvIHJlc2l6ZSAke2ltZzJyZXNpemV9YCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IGltZyA9IGF3YWl0IHNoYXJwKHNyY2ZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkID0gYXdhaXQgaW1nLnJlc2l6ZShOdW1iZXIucGFyc2VJbnQodG9yZXNpemUucmVzaXpld2lkdGgpKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNvbXB1dGUgdGhlIGNvcnJlY3QgZGVzdGluYXRpb24gcGF0aFxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgcmVzaXplZCBpbWFnZVxuICAgICAgICAgICAgICAgIGxldCBpbWd0b3Jlc2l6ZSA9IHRvcmVzaXplLnJlc2l6ZXRvID8gdG9yZXNpemUucmVzaXpldG8gOiBpbWcycmVzaXplO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkZXN0O1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaW1ndG9yZXNpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBmb3IgcmVsYXRpdmUgaW1hZ2UgcGF0aHMsIGhlbmNlIGl0IG5lZWRzIHRvIGJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBkb2NQYXRoXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZXNpemVkZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzaXplZC50b0ZpbGUocmVzaXplZGVzdCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBidWlsdC1pbjogSW1hZ2UgcmVzaXplIGZhaWxlZCBmb3IgJHtzcmNmaWxlfSAodG9yZXNpemUgJHt1dGlsLmluc3BlY3QodG9yZXNpemUpfSBmb3VuZCAke3V0aWwuaW5zcGVjdChmb3VuZCl9KSBiZWNhdXNlICR7ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFmdGVyIGFsbCBmaWxlcyBhcmUgcmVuZGVyZWQsIG9wdGlvbmFsbHkgY2hlY2sgdGhlIHNpdGUncyBsaW5rcy5cbiAgICAgICAgYXdhaXQgdGhpcy4jY2hlY2tTaXRlTGlua3MoY29uZmlnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXYWxrIGV2ZXJ5IHJlbmRlcmVkIEhUTUwgZmlsZSBhbmQgY2hlY2sgdGhlIGxpbmtzIGl0IGNvbnRhaW5zLCB1c2luZyB0aGVcbiAgICAgKiBjb25maWd1cmVkIGxpbmstY2hlY2sgbW9kZXMuICBJbnRlcm5hbCBsaW5rcyBhcmUgcmVzb2x2ZWQgYWdhaW5zdCB0aGVcbiAgICAgKiBjYWNoZXM7IGV4dGVybmFsIGxpbmtzIGFyZSB2YWxpZGF0ZWQgb3ZlciB0aGUgbmV0d29yayAod2hlbiBlbmFibGVkKTtcbiAgICAgKiBub24tSFRUUCBsaW5rcyBhcmUgb3B0aW9uYWxseSBsb2dnZWQuICBUaGlzIGlzIHNraXBwZWQgZW50aXJlbHkgdW5sZXNzIGF0XG4gICAgICogbGVhc3Qgb25lIGNsYXNzIG9mIGNoZWNraW5nIGlzIGVuYWJsZWQuXG4gICAgICovXG4gICAgYXN5bmMgI2NoZWNrU2l0ZUxpbmtzKGNvbmZpZykge1xuICAgICAgICBjb25zdCBvcHRzID0gdGhpcy5vcHRpb25zPy5jaGVja0xpbmtzO1xuICAgICAgICBjb25zdCBjaGVja2VyID0gbmV3IExpbmtDaGVja2VyKGNvbmZpZywgdGhpcy5ha2FzaGEsIG9wdHMpO1xuICAgICAgICBpZiAoIWNoZWNrZXIuZW5hYmxlZCkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gQWxsIGRvY3VtZW50cyB0aGF0IHJlbmRlciB0byBhIC5odG1sIGZpbGUuXG4gICAgICAgIGNvbnN0IGh0bWxEb2NzID0gYXdhaXQgZG9jdW1lbnRzLnNlYXJjaCh7XG4gICAgICAgICAgICByZW5kZXJwYXRobWF0Y2g6ICdcXFxcLmh0bWwkJ1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBDb2xsZWN0IGFsbCBsaW5rcyBmaXJzdCBzbyB0aGUgZXh0ZXJuYWwgY2hlY2tlciBkZWR1cGxpY2F0ZXMgd29yay5cbiAgICAgICAgLy8gRWFjaCBlbnRyeSBwYWlycyBhbiBocmVmIHdpdGggdGhlIHJlbmRlcmVkIGRvY3VtZW50IGl0IGNhbWUgZnJvbS5cbiAgICAgICAgY29uc3QgbGlua3M6IEFycmF5PHsgaHJlZjogc3RyaW5nLCBzb3VyY2U6IHN0cmluZywgdnBhdGg6IHN0cmluZyB9PiA9IFtdO1xuICAgICAgICBmb3IgKGNvbnN0IGRvYyBvZiBodG1sRG9jcykge1xuICAgICAgICAgICAgY29uc3QgcmVuZGVyUGF0aCA9IGRvYy5yZW5kZXJQYXRoO1xuICAgICAgICAgICAgY29uc3QgZnNwYXRoID0gcGF0aC5qb2luKGNvbmZpZy5yZW5kZXJEZXN0aW5hdGlvbiwgcmVuZGVyUGF0aCk7XG4gICAgICAgICAgICBsZXQgaHRtbDogc3RyaW5nO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBodG1sID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZzcGF0aCwgJ3V0ZjgnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgZmlsZSBtYXkgbm90IGhhdmUgYmVlbiB3cml0dGVuIChlLmcuIG5vbi1IVE1MIHJlbmRlcmVyKTtcbiAgICAgICAgICAgICAgICAvLyBza2lwIGl0IHJhdGhlciB0aGFuIGZhaWxpbmcgdGhlIHdob2xlIHNjYW4uXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgJDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgJCA9IG1haGFiaHV0YS5wYXJzZShodG1sKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3QgPSAoc2VsZWN0b3I6IHN0cmluZywgYXR0cjogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgJChzZWxlY3RvcikuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaHJlZiA9ICQoZWwpLmF0dHIoYXR0cik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaHJlZiA9PT0gJ3N0cmluZycgJiYgaHJlZi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaW5rcy5wdXNoKHsgaHJlZiwgc291cmNlOiByZW5kZXJQYXRoLCB2cGF0aDogZG9jLnZwYXRoIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29sbGVjdCgnYVtocmVmXScsICdocmVmJyk7XG4gICAgICAgICAgICBjb2xsZWN0KCdsaW5rW2hyZWZdJywgJ2hyZWYnKTtcbiAgICAgICAgICAgIGNvbGxlY3QoJ3NjcmlwdFtzcmNdJywgJ3NyYycpO1xuICAgICAgICAgICAgY29sbGVjdCgnaW1nW3NyY10nLCAnc3JjJyk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGxpbmsgb2YgbGlua3MpIHtcbiAgICAgICAgICAgIGF3YWl0IGNoZWNrZXIuY2hlY2tMaW5rKGxpbmsuaHJlZiwgbGluay5zb3VyY2UsIGxpbmsudnBhdGgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhyb3dzIGlmIGFueSAnZXJyb3InLW1vZGUgZmFpbHVyZXMgd2VyZSBjb2xsZWN0ZWQsIGZhaWxpbmcgdGhlIHJ1bi5cbiAgICAgICAgY2hlY2tlci5maW5pc2goKTtcbiAgICB9XG5cbn1cblxuZXhwb3J0IGNvbnN0IG1haGFiaHV0YUFycmF5ID0gZnVuY3Rpb24oXG4gICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgY29uZmlnPzogQ29uZmlndXJhdGlvbixcbiAgICAgICAgICAgIGFrYXNoYT86IGFueSxcbiAgICAgICAgICAgIHBsdWdpbj86IFBsdWdpblxuKSB7XG4gICAgbGV0IHJldCA9IG5ldyBtYWhhYmh1dGEuTWFoYWZ1bmNBcnJheShwbHVnaW5OYW1lLCBvcHRpb25zKTtcbiAgICAvLyByZXQuYWRkTWFoYWZ1bmMobmV3IFRhZ3NGb3JEb2N1bWVudEVsZW1lbnQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU3R5bGVzaGVldHNFbGVtZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEhlYWRlckphdmFTY3JpcHQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgRm9vdGVySmF2YVNjcmlwdChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBJbnNlcnRUZWFzZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQ29kZUVtYmVkKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IENzdlRhYmxlKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEFrQm9keUNsYXNzQWRkKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZpZ3VyZUltYWdlKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IGltZzJmaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBJbWFnZVJld3JpdGVyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IERvY3VtZW50R3JvdXAoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2hvd0NvbnRlbnQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2VsZWN0RWxlbWVudHMoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQW5jaG9yQ2xlYW51cChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBIZWFkTGlua1JlbGF0aXZpemVyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNjcmlwdFJlbGF0aXZpemVyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBNdW5nZWRBdHRyUmVtb3Zlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZEZpbmFsTWFoYWZ1bmMobmV3IEJsYW5rTGlua0RlZmFuZ2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldHVybiByZXQ7XG59O1xuXG4vLyBjbGFzcyBUYWdzRm9yRG9jdW1lbnRFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4vLyAgICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay10YWdzLWZvci1kb2N1bWVudFwiOyB9XG4vLyAgICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5LCBkb25lKSB7XG4vLyAgICAgICAgIGNvbnN0IHBsdWdpbiA9IHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKTtcbi8vICAgICAgICAgcmV0dXJuIGF3YWl0IHBsdWdpbi5kb1RhZ3NGb3JEb2N1bWVudCh0aGlzLmNvbmZpZyxcbi8vICAgICAgICAgICAgICAgICBtZXRhZGF0YSwgXCJha19kb2N1bWVudF90YWdzLmh0bWwubmprXCIpO1xuLy8gICAgIH1cbi8vIH1cblxuZnVuY3Rpb24gX2RvU3R5bGVzaGVldHMobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3V0aWwuaW5zcGVjdChtZXRhZGF0YSl9YCk7XG5cbiAgICB2YXIgc2NyaXB0cztcbiAgICBpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cy5jb25jYXQobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgYWstc3R5bGVzaGVldHMgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCl9ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX0gJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvU3R5bGVzaGVldHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIGNvbmZpZycpO1xuXG4gICAgdmFyIHJldCA9ICcnO1xuICAgIGlmICh0eXBlb2Ygc2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yICh2YXIgc3R5bGUgb2Ygc2NyaXB0cykge1xuXG4gICAgICAgICAgICBsZXQgc3R5bGVocmVmID0gc3R5bGUuaHJlZjtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoc3R5bGUuaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHByb2Nlc3MgJHtzdHlsZWhyZWZ9YCk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGJpdCB3aXRoICdodHRwOi8vZXhhbXBsZS5jb20nIG1lYW5zIHRoZXJlXG4gICAgICAgICAgICAgICAgLy8gd29uJ3QgYmUgYW4gZXhjZXB0aW9uIHRocm93biBmb3IgYSBsb2NhbCBVUkwuXG4gICAgICAgICAgICAgICAgLy8gQnV0LCBpbiBzdWNoIGEgY2FzZSwgdUhyZWYucGF0aG5hbWUgd291bGRcbiAgICAgICAgICAgICAgICAvLyBzdGFydCB3aXRoIGEgc2xhc2guICBUaGVyZWZvcmUsIHRvIGNvcnJlY3RseVxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiB0aGlzIFVSTCBpcyBhYnNvbHV0ZSB3ZSBtdXN0IGNoZWNrXG4gICAgICAgICAgICAgICAgLy8gd2l0aCB0aGUgb3JpZ2luYWwgVVJMIHN0cmluZywgd2hpY2ggaXMgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgc3R5bGVocmVmIHZhcmlhYmxlLlxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHN0eWxlaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlRgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVCBSRU5ERVJUT2ApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHJlbGF0aXZlKC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfSwgJHtzdHlsZWhyZWZ9KSA9ICR7cmVsYXRpdmUoJy8nK21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvLCBzdHlsZWhyZWYpfWApXG4gICAgICAgICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3R5bGVocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIGFic29sdXRlIHN0eWxlaHJlZiAke3N0eWxlaHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRvU3R5bGVNZWRpYSA9IChtZWRpYSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtZWRpYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYG1lZGlhPVwiJHtlbmNvZGUobWVkaWEpfVwiYFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IGh0ID0gYDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiJHtlbmNvZGUoc3R5bGVocmVmKX1cIiAke2RvU3R5bGVNZWRpYShzdHlsZS5tZWRpYSl9Lz5gXG4gICAgICAgICAgICByZXQgKz0gaHQ7XG5cbiAgICAgICAgICAgIC8vIFRoZSBpc3N1ZSB3aXRoIHRoaXMgYW5kIG90aGVyIGluc3RhbmNlc1xuICAgICAgICAgICAgLy8gaXMgdGhhdCB0aGlzIHRlbmRlZCB0byByZXN1bHQgaW5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgIDxodG1sPjxib2R5PjxsaW5rLi4+PC9ib2R5PjwvaHRtbD5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXaGVuIGl0IG5lZWRlZCB0byBqdXN0IGJlIHRoZSA8bGluaz4gdGFnLlxuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIGl0IHRyaWVkIHRvIGNyZWF0ZSBhbiBlbnRpcmVcbiAgICAgICAgICAgIC8vIEhUTUwgZG9jdW1lbnQuICBXaGlsZSB0aGVyZSB3YXMgYSB3YXkgYXJvdW5kXG4gICAgICAgICAgICAvLyB0aGlzIC0gJCgnc2VsZWN0b3InKS5wcm9wKCdvdXRlckhUTUwnKVxuICAgICAgICAgICAgLy8gVGhpcyBhbHNvIHNlZW1lZCB0byBiZSBhbiBvdmVyaGVhZFxuICAgICAgICAgICAgLy8gd2UgY2FuIGF2b2lkLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoZSBwYXR0ZXJuIGlzIHRvIHVzZSBUZW1wbGF0ZSBTdHJpbmdzIHdoaWxlXG4gICAgICAgICAgICAvLyBiZWluZyBjYXJlZnVsIHRvIGVuY29kZSB2YWx1ZXMgc2FmZWx5IGZvciB1c2VcbiAgICAgICAgICAgIC8vIGluIGFuIGF0dHJpYnV0ZS4gIFRoZSBcImVuY29kZVwiIGZ1bmN0aW9uIGRvZXNcbiAgICAgICAgICAgIC8vIHRoZSBlbmNvZGluZy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzQ5XG5cbiAgICAgICAgICAgIC8vIGxldCAkID0gbWFoYWJodXRhLnBhcnNlKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIlwiLz4nKTtcbiAgICAgICAgICAgIC8vICQoJ2xpbmsnKS5hdHRyKCdocmVmJywgc3R5bGVocmVmKTtcbiAgICAgICAgICAgIC8vIGlmIChzdHlsZS5tZWRpYSkge1xuICAgICAgICAgICAgLy8gICAgICQoJ2xpbmsnKS5hdHRyKCdtZWRpYScsIHN0eWxlLm1lZGlhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIHJldCArPSAkLmh0bWwoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHtyZXR9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0phdmFTY3JpcHRzKFxuICAgIG1ldGFkYXRhLFxuICAgIHNjcmlwdHM6IGphdmFTY3JpcHRJdGVtW10sXG4gICAgb3B0aW9ucyxcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb25cbikge1xuXHR2YXIgcmV0ID0gJyc7XG5cdGlmICghc2NyaXB0cykgcmV0dXJuIHJldDtcblxuICAgIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdfZG9KYXZhU2NyaXB0cyBubyBvcHRpb25zJyk7XG4gICAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gY29uZmlnJyk7XG5cbiAgICBmb3IgKHZhciBzY3JpcHQgb2Ygc2NyaXB0cykge1xuXHRcdGlmICghc2NyaXB0LmhyZWYgJiYgIXNjcmlwdC5zY3JpcHQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTXVzdCBzcGVjaWZ5IGVpdGhlciBocmVmIG9yIHNjcmlwdCBpbiAke3V0aWwuaW5zcGVjdChzY3JpcHQpfWApO1xuXHRcdH1cbiAgICAgICAgaWYgKCFzY3JpcHQuc2NyaXB0KSBzY3JpcHQuc2NyaXB0ID0gJyc7XG5cbiAgICAgICAgY29uc3QgZG9UeXBlID0gKGxhbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGB0eXBlPVwiJHtlbmNvZGUobGFuZyl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9IcmVmID0gKGhyZWYpID0+IHtcbiAgICAgICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjcmlwdGhyZWYgPSBocmVmO1xuICAgICAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzXG4gICAgICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzY3JpcHRocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc2NyaXB0aHJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvSmF2YVNjcmlwdHMgYWJzb2x1dGUgc2NyaXB0aHJlZiAke3NjcmlwdGhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYHNyYz1cIiR7ZW5jb2RlKHNjcmlwdGhyZWYpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgaHQgPSBgPHNjcmlwdCAke2RvVHlwZShzY3JpcHQubGFuZyl9ICR7ZG9IcmVmKHNjcmlwdC5ocmVmKX0+JHtzY3JpcHQuc2NyaXB0fTwvc2NyaXB0PmA7XG4gICAgICAgIHJldCArPSBodDtcbiAgICB9XG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AuY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3ApO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AgOiB1bmRlZmluZWQ7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coYF9kb0hlYWRlckphdmFTY3JpcHQgJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX1gKTtcblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zLCBjb25maWcpO1xufVxuXG5mdW5jdGlvbiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tIDogdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuY2xhc3MgU3R5bGVzaGVldHNFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstc3R5bGVzaGVldHNcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pIHtcblx0XHRsZXQgcmV0ID0gIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFN0eWxlc2hlZXRzRWxlbWVudCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEhlYWRlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1oZWFkZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9IF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgSGVhZGVySmF2YVNjcmlwdCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEZvb3RlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1mb290ZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuXHR9XG59XG5cbmNsYXNzIEhlYWRMaW5rUmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cbiAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYW4gYWJzb2x1dGUgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgU2NyaXB0UmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignc3JjJyk7XG5cbiAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgbGlua1xuICAgICAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgSW5zZXJ0VGVhc2VyIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGVhc2VyXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWtfdGVhc2VyLmh0bWwubmprXCIsIHtcblx0XHRcdHRlYXNlcjogdHlwZW9mIG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdICE9PSBcInVuZGVmaW5lZFwiXG5cdFx0XHRcdD8gbWV0YWRhdGFbXCJhay10ZWFzZXJcIl0gOiBtZXRhZGF0YS50ZWFzZXJcblx0XHR9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW5zZXJ0VGVhc2VyIGNhdWdodCBlcnJvciBgLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cblx0fVxufVxuXG5jbGFzcyBBa0JvZHlDbGFzc0FkZCBleHRlbmRzIFBhZ2VQcm9jZXNzb3Ige1xuXHRhc3luYyBwcm9jZXNzKCQsIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0aWYgKHR5cGVvZiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPT0gJ3VuZGVmaW5lZCdcblx0XHQgJiYgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT0gJydcblx0XHQgJiYgJCgnaHRtbCBib2R5JykuZ2V0KDApKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRpZiAoISQoJ2h0bWwgYm9keScpLmhhc0NsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKSkge1xuXHRcdFx0XHRcdCQoJ2h0bWwgYm9keScpLmFkZENsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKHVuZGVmaW5lZCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2UgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnJyk7XG5cdH1cbn1cblxuY2xhc3MgQ29kZUVtYmVkIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjb2RlLWVtYmVkXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ29kZUVtYmVkIHByb2Nlc3MgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQsIGZhbHNlLCAxMCl9YCk7XG5cbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICRlbGVtZW50LmF0dHIoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgICAgIGlmICghZm4gfHwgZm4gPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgbXVzdCBoYXZlIGZpbGUtbmFtZSBhcmd1bWVudCwgZ290ICR7Zm59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHh0cGF0aDtcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmbikpIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBmbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHR4dHBhdGgpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgZmlsZS1uYW1lICR7Zm59IGRvZXMgbm90IHJlZmVyIHRvIHVzYWJsZSBmaWxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIGNvbnN0IGRvTGFuZyA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgY2xhc3M9XCJobGpzICR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdjbGFzcz1cImhsanNcIic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGRvSUQgPSAoaWQpID0+IHtcbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaWQ9XCIke2VuY29kZShpZCl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9Db2RlID0gKGxhbmcsIGNvZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQoY29kZSwge1xuICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAgICAgICAgIH0pLnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHRBdXRvKGNvZGUpLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCByZXQgPSBgPHByZSAke2RvSUQoaWQpfT48Y29kZSAke2RvTGFuZyhsYW5nKX0+JHtkb0NvZGUobGFuZywgdHh0KX08L2NvZGU+PC9wcmU+YDtcbiAgICAgICAgcmV0dXJuIHJldDtcblxuICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZShgPHByZT48Y29kZT48L2NvZGU+PC9wcmU+YCk7XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYWRkQ2xhc3MobGFuZyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gJCgnY29kZScpLmFkZENsYXNzKCdobGpzJyk7XG4gICAgICAgIC8vIGlmIChpZCAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgLy8gICAgICQoJ3ByZScpLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0KHR4dCwge1xuICAgICAgICAvLyAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgIC8vICAgICB9KS52YWx1ZSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0QXV0byh0eHQpLnZhbHVlKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyByZXR1cm4gJC5odG1sKCk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlc29sdmUgYSBgPGNzdi10YWJsZT5gIGBmaWxlLW5hbWVgIHRvIGFuIGFic29sdXRlIGZpbGVzeXN0ZW0gcGF0aC5cbiAqXG4gKiBBIGRhdGEgZmlsZSBtYXkgbGl2ZSBpbiBhbiBhc3NldHMgZGlyZWN0b3J5LCBhIGRvY3VtZW50cyBkaXJlY3RvcnksIG9yXG4gKiBvdXRzaWRlIHRoZSBwcm9qZWN0IGRpcmVjdG9yaWVzIGVudGlyZWx5IChzbyB0aGUgcmF3IGRhdGEgaXMgbm90IGNvcGllZFxuICogaW50byB0aGUgZGVwbG95ZWQgc2l0ZSkuICBSZXNvbHV0aW9uIGlzIHRyaWVkIGluIHRoYXQgb3JkZXI6XG4gKlxuICogMS4gVGhlIGFzc2V0cyBjYWNoZSwgdGhlbiB0aGUgZG9jdW1lbnRzIGNhY2hlIOKAlCBhIHJlbGF0aXZlIGBmaWxlLW5hbWVgIGlzXG4gKiAgICBmaXJzdCByZXNvbHZlZCBhZ2FpbnN0IHRoZSBjdXJyZW50IGRvY3VtZW50J3MgZGlyZWN0b3J5IChhcyBpblxuICogICAgYENvZGVFbWJlZGApLlxuICogMi4gQSByZWFsIGZpbGVzeXN0ZW0gcGF0aDogYWJzb2x1dGUgcGF0aHMgYXJlIHVzZWQgYXMtaXMsIHJlbGF0aXZlIHBhdGhzXG4gKiAgICByZXNvbHZlIGFnYWluc3QgYGNvbmZpZy5jb25maWdEaXJgICh0aGUgZGlyZWN0b3J5IG9mIHRoZSBwcm9qZWN0J3NcbiAqICAgIGNvbmZpZ3VyYXRpb24gZmlsZSksIG1hdGNoaW5nIGhvdyByZWxhdGl2ZSBgYXNzZXRzRGlyc2AvYGRvY3VtZW50c0RpcnNgXG4gKiAgICBhcmUgcmVzb2x2ZWQuXG4gKlxuICogQHJldHVybnMgVGhlIGFic29sdXRlIGZpbGVzeXN0ZW0gcGF0aCwgb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZC5cbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURhdGFGaWxlKGNvbmZpZywgYWthc2hhLCBtZXRhZGF0YSwgZm4pOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IHBhdGguaXNBYnNvbHV0ZShmbilcbiAgICAgICAgPyBmblxuICAgICAgICA6IHBhdGguam9pbihwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pLCBmbik7XG5cbiAgICBsZXQgZm91bmQgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlLmZpbmQoY2FuZGlkYXRlKTtcbiAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZC5mc3BhdGg7XG4gICAgZm91bmQgPSBhd2FpdCBha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlLmZpbmQoY2FuZGlkYXRlKTtcbiAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZC5mc3BhdGg7XG5cbiAgICAvLyBFeHRlcm5hbCBmaWxlIG91dHNpZGUgdGhlIHByb2plY3QgZGlyZWN0b3JpZXMuICBSZWxhdGl2ZSBwYXRocyByZXNvbHZlXG4gICAgLy8gYWdhaW5zdCBjb25maWcuY29uZmlnRGlyOyBhYnNvbHV0ZSBwYXRocyBhcmUgdXNlZCBhcy1pcy5cbiAgICBjb25zdCBleHRlcm5hbCA9IHBhdGguaXNBYnNvbHV0ZShmbilcbiAgICAgICAgPyBmblxuICAgICAgICA6IChjb25maWcuY29uZmlnRGlyXG4gICAgICAgICAgICA/IHBhdGgucmVzb2x2ZShjb25maWcuY29uZmlnRGlyLCBmbilcbiAgICAgICAgICAgIDogcGF0aC5yZXNvbHZlKGZuKSk7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnNwLmFjY2VzcyhleHRlcm5hbCk7XG4gICAgICAgIHJldHVybiBleHRlcm5hbDtcbiAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG59XG5cbmNsYXNzIENzdlRhYmxlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjc3YtdGFibGVcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICBjb25zdCBmbiA9ICRlbGVtZW50LmF0dHIoJ2ZpbGUtbmFtZScpO1xuICAgICAgICBpZiAoIWZuIHx8IGZuID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjc3YtdGFibGUgbXVzdCBoYXZlIGZpbGUtbmFtZSBhdHRyaWJ1dGUsIGdvdCAke2ZufWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJvd1RlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKTtcbiAgICAgICAgaWYgKCFyb3dUZW1wbGF0ZSB8fCByb3dUZW1wbGF0ZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY3N2LXRhYmxlIG11c3QgaGF2ZSB0ZW1wbGF0ZSBhdHRyaWJ1dGUsIGdvdCAke3Jvd1RlbXBsYXRlfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJlZm9yZVRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cignYmVmb3JlLXRlbXBsYXRlJykgfHwgJ2FrX2NzdnRhYmxlX2JlZm9yZS5odG1sLm5qayc7XG4gICAgICAgIGNvbnN0IGFmdGVyVGVtcGxhdGUgID0gJGVsZW1lbnQuYXR0cignYWZ0ZXItdGVtcGxhdGUnKSAgfHwgJ2FrX2NzdnRhYmxlX2FmdGVyLmh0bWwubmprJztcbiAgICAgICAgY29uc3QgZXhwbGljaXRGb3JtYXQgPSAkZWxlbWVudC5hdHRyKCdmb3JtYXQnKTtcbiAgICAgICAgY29uc3QgZGVsaW1pdGVyICAgICAgPSAkZWxlbWVudC5hdHRyKCdkZWxpbWl0ZXInKTtcbiAgICAgICAgY29uc3QgaGVhZGVyICAgICAgICAgPSAkZWxlbWVudC5hdHRyKCdoZWFkZXInKTtcblxuICAgICAgICAvLyBSZXNvbHZlIHRoZSBkYXRhIGZpbGU6IGFzc2V0cywgdGhlbiBkb2N1bWVudHMsIHRoZW4gYSBmaWxlc3lzdGVtXG4gICAgICAgIC8vIHBhdGggb3V0c2lkZSB0aGUgcHJvamVjdCBkaXJlY3Rvcmllcy5cbiAgICAgICAgY29uc3QgZnNwYXRoID0gYXdhaXQgcmVzb2x2ZURhdGFGaWxlKHRoaXMuY29uZmlnLCB0aGlzLmFrYXNoYSwgbWV0YWRhdGEsIGZuKTtcbiAgICAgICAgaWYgKCFmc3BhdGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY3N2LXRhYmxlIGZpbGUtbmFtZSAke2ZufSBub3QgZm91bmQgaW4gYXNzZXRzLCBkb2N1bWVudHMsIG9yIG9uIGRpc2tgKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICAvLyBQYXJzZSBpbnRvIHRoZSBub3JtYWxpemVkIHJvdyBtb2RlbC5cbiAgICAgICAgY29uc3QgZm9ybWF0ID0gaW5mZXJGb3JtYXQoZm4sIGV4cGxpY2l0Rm9ybWF0KTtcbiAgICAgICAgY29uc3QgeyBjb2x1bW5zLCByb3dzIH0gPSBwYXJzZVRhYmxlRGF0YSh0ZXh0LCBmb3JtYXQsIHtcbiAgICAgICAgICAgIGRlbGltaXRlcixcbiAgICAgICAgICAgIGhlYWRlcjogdHlwZW9mIGhlYWRlciA9PT0gJ3N0cmluZycgPyBoZWFkZXIgIT09ICdmYWxzZScgOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBSZW5kZXIgdGhlIGJlZm9yZSB0ZW1wbGF0ZSwgZWFjaCByb3csIHRoZW4gdGhlIGFmdGVyIHRlbXBsYXRlLlxuICAgICAgICBsZXQgb3V0ID0gYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbCh0aGlzLmNvbmZpZywgYmVmb3JlVGVtcGxhdGUsXG4gICAgICAgICAgICB7IGNvbHVtbnMsIHJvd0NvdW50OiByb3dzLmxlbmd0aCB9KTtcbiAgICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBvdXQgKz0gYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbCh0aGlzLmNvbmZpZywgcm93VGVtcGxhdGUsIHJvdyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjc3YtdGFibGUgZmFpbGVkIHJlbmRlcmluZyByb3cgJHtyb3cuaW5kZXh9IG9mICR7Zm59IHdpdGggdGVtcGxhdGUgJHtyb3dUZW1wbGF0ZX06ICR7ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBvdXQgKz0gYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbCh0aGlzLmNvbmZpZywgYWZ0ZXJUZW1wbGF0ZSxcbiAgICAgICAgICAgIHsgY29sdW1ucywgcm93Q291bnQ6IHJvd3MubGVuZ3RoIH0pO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cbn1cblxuY2xhc3MgRmlndXJlSW1hZ2UgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImZpZy1pbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19maWdpbWcuaHRtbC5uamsnO1xuICAgICAgICBjb25zdCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHRocm93IG5ldyBFcnJvcignZmlnLWltZyBtdXN0IHJlY2VpdmUgYW4gaHJlZicpO1xuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNhcHRpb24gPSAkZWxlbWVudC5odG1sKCk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgaW1nMmZpZ3VyZUltYWdlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBpbWdbZmlndXJlXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHksIGRvbmUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJykgXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpXG4gICAgICAgICAgICAgICAgOiAgXCJha19maWdpbWcuaHRtbC5uamtcIjtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzcmMgPSAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAgICAgICAgIGlkLCBjbGF6eiwgc3R5bGUsIHdpZHRoLCBocmVmOiBzcmMsIGRlc3QsIHJlc2l6ZXdpZHRoLCByZXNpemV0byxcbiAgICAgICAgICAgIGNhcHRpb246IGNvbnRlbnRcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBJbWFnZVJld3JpdGVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcblxuICAgICAgICAvLyBXZSBvbmx5IGRvIHJld3JpdGVzIGZvciBsb2NhbCBpbWFnZXNcbiAgICAgICAgbGV0IHNyYyA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuICAgICAgICAvLyBGb3IgbG9jYWwgVVJMcywgdGhpcyBuZXcgVVJMIGNhbGwgd2lsbFxuICAgICAgICAvLyBtYWtlIHVTcmMub3JpZ2luID09PSBodHRwOi8vZXhhbXBsZS5jb21cbiAgICAgICAgLy8gSGVuY2UsIGlmIHNvbWUgb3RoZXIgZG9tYWluIGFwcGVhcnNcbiAgICAgICAgLy8gdGhlbiB3ZSBrb253IGl0J3Mgbm90IGEgbG9jYWwgaW1hZ2UuXG4gICAgICAgIGNvbnN0IHVTcmMgPSBuZXcgVVJMKHNyYywgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICBpZiAodVNyYy5vcmlnaW4gIT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBcmUgd2UgYXNrZWQgdG8gcmVzaXplIHRoZSBpbWFnZT9cbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkbGluay5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkbGluay5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChyZXNpemV3aWR0aCkge1xuICAgICAgICAgICAgLy8gQWRkIHRvIGEgcXVldWUgdGhhdCBpcyBydW4gYXQgdGhlIGVuZCBcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgIC5hZGRJbWFnZVRvUmVzaXplKHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyk7XG5cbiAgICAgICAgICAgIGlmIChyZXNpemV0bykge1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIHJlc2l6ZXRvKTtcbiAgICAgICAgICAgICAgICBzcmMgPSByZXNpemV0bztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlc2UgYXJlIG5vIGxvbmdlciBuZWVkZWRcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgaWRlYSBoZXJlIGlzIGZvciBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgYSByZWxhdGl2ZSBVUkxcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShzcmMpKSB7XG4gICAgICAgICAgICBsZXQgbmV3U3JjID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNyYyk7XG4gICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdTcmMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEltYWdlUmV3cml0ZXIgYWJzb2x1dGUgaW1hZ2UgcGF0aCAke3NyY30gcmV3cm90ZSB0byAke25ld1NyY31gKTtcbiAgICAgICAgICAgIHNyYyA9IG5ld1NyYztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgfVxufVxuXG5jbGFzcyBEb2N1bWVudEdyb3VwIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJkb2N1bWVudC1ncm91cFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKTtcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCBtdXN0IGJlIGdpdmVuIGEgdGVtcGxhdGVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuXG4gICAgICAgIC8vIG1pbWU/XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgcmVuZGVycy10by1odG1sIGF0dHJpYnV0ZSBpcyBhYnNlbnQsIGxlYXZlXG4gICAgICAgIC8vIHJlbmRlcnNUb0hUTUwgdW5kZWZpbmVkIHNvIHRoYXQgdGhlIHNlYXJjaCBkb2VzIG5vdCBmaWx0ZXJcbiAgICAgICAgLy8gb24gaXQuICBPbmx5IHdoZW4gdGhlIGF0dHJpYnV0ZSBpcyBleHBsaWNpdGx5IHByZXNlbnQgZG8gd2VcbiAgICAgICAgLy8gY29uc3RyYWluIHRoZSBzZWFyY2ggdG8gKG5vbi0pSFRNTCBkb2N1bWVudHMuXG4gICAgICAgIGNvbnN0IHJlbmRlcnNUb0hUTUxBdHRyID0gJGVsZW1lbnQuYXR0cigncmVuZGVycy10by1odG1sJyk7XG4gICAgICAgIGxldCByZW5kZXJzVG9IVE1MOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHlwZW9mIHJlbmRlcnNUb0hUTUxBdHRyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCA9IHJlbmRlcnNUb0hUTUxBdHRyICE9PSAnZmFsc2UnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJvb3RQYXRoID0gJGVsZW1lbnQuYXR0cigncm9vdC1wYXRoJyk7XG4gICAgICAgIGNvbnN0IHZwYXRoR2xvYiA9ICRlbGVtZW50LmF0dHIoJ3ZwYXRoLWdsb2InKTtcbiAgICAgICAgY29uc3QgcmVuZGVyR2xvYiA9ICRlbGVtZW50LmF0dHIoJ3JlbmRlci1nbG9iJyk7XG5cbiAgICAgICAgLy8gUGFyc2UgYW4gYXR0cmlidXRlIHRoYXQgbWF5IGhvbGQgZWl0aGVyIGEgc2luZ2xlIHZhbHVlIG9yIGFcbiAgICAgICAgLy8gbGlzdCBvZiB2YWx1ZXMsIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJldHVybnMgdW5kZWZpbmVkXG4gICAgICAgIC8vIHdoZW4gdGhlIGF0dHJpYnV0ZSBpcyBhYnNlbnQgb3IgY29udGFpbnMgbm8gdXNhYmxlIHZhbHVlcywgc29cbiAgICAgICAgLy8gdGhhdCB0aGUgc2VhcmNoIGRvZXMgbm90IGZpbHRlciBvbiBpdC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQSB2YWx1ZSB3aG9zZSB0cmltbWVkIGZvcm0gYmVnaW5zIHdpdGggJ1snIGlzIHBhcnNlZCBhcyBhXG4gICAgICAgIC8vIEpTT04gYXJyYXksIGUuZy4gdGFnPSdbXCJUYWcxXCIsIFwiVGFnLXN0cmluZy0yXCJdJy4gIFRoaXMgaXNcbiAgICAgICAgLy8gdGhlIHJvYnVzdCB3YXkgdG8gZXhwcmVzcyBtdWx0aXBsZSB2YWx1ZXMgYmVjYXVzZSBKU09OXG4gICAgICAgIC8vIGhhbmRsZXMgdmFsdWVzIHRoYXQgdGhlbXNlbHZlcyBjb250YWluIGNvbW1hcywgc3BhY2VzLCBvclxuICAgICAgICAvLyBxdW90ZSBjaGFyYWN0ZXJzICh0YWdzIHN1Y2ggYXMgYFNvbWV0aGluZyBcInF1b3RlZFwiYCkuICBBbnlcbiAgICAgICAgLy8gb3RoZXIgdmFsdWUgaXMgdHJlYXRlZCBhcyBhIHNpbmdsZSBsaXRlcmFsIHN0cmluZywgc28gdGhlXG4gICAgICAgIC8vIGNvbW1vbiBjYXNlIHN0YXlzIHNpbXBsZSwgZS5nLiB0YWc9XCJUYWcxXCIuXG4gICAgICAgIGNvbnN0IGF0dHJMaXN0ID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gJGVsZW1lbnQuYXR0cihuYW1lKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgbGV0IGxpc3Q6IHN0cmluZ1tdO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKHRyaW1tZWQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCAke25hbWV9IGlzIG5vdCB2YWxpZCBKU09OOiAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50LWdyb3VwICR7bmFtZX0gSlNPTiBtdXN0IGJlIGFuIGFycmF5OiAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsaXN0ID0gcGFyc2VkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCAke25hbWV9IGFycmF5IG11c3QgY29udGFpbiBvbmx5IHN0cmluZ3M6ICR7dmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udHJpbSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ID0gWyB0cmltbWVkIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxpc3QgPSBsaXN0LmZpbHRlcihpdGVtID0+IGl0ZW0ubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICByZXR1cm4gbGlzdC5sZW5ndGggPiAwID8gbGlzdCA6IHVuZGVmaW5lZDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBFYWNoIG9mIHRoZXNlIGF0dHJpYnV0ZXMgYWNjZXB0cyBlaXRoZXIgYSBzaW5nbGUgdmFsdWUgb3IgYVxuICAgICAgICAvLyBKU09OIGFycmF5IG9mIHZhbHVlcywgc28gdGhhdCBhIGRvY3VtZW50IGdyb3VwIG1heSBtYXRjaFxuICAgICAgICAvLyBtdWx0aXBsZSBsYXlvdXRzLCBibG9ndGFncywgb3IgdGFncy5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGF0dHJMaXN0KCdsYXlvdXQnKTtcbiAgICAgICAgY29uc3QgYmxvZ3RhZ3MgPSBhdHRyTGlzdCgnYmxvZ3RhZycpO1xuICAgICAgICBjb25zdCB0YWdzID0gYXR0ckxpc3QoJ3RhZycpO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudERpciA9ICRlbGVtZW50LmF0dHIoJ3BhcmVudC1kaXInKTtcbiAgICAgICAgY29uc3QgZGlybmFtZSA9ICRlbGVtZW50LmF0dHIoJ2Rpcm5hbWUnKTtcbiAgICAgICAgY29uc3Qgc2tpcEdsb2IgPSAkZWxlbWVudC5hdHRyKCdza2lwLWdsb2InKTtcbiAgICAgICAgY29uc3QgbGltaXQgPSAkZWxlbWVudC5hdHRyKCdsaW1pdCcpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAkZWxlbWVudC5hdHRyKCdvZmZzZXQnKTtcblxuICAgICAgICBjb25zdCBzb3J0QnkgPSAkZWxlbWVudC5hdHRyKCdzb3J0LWJ5Jyk7XG4gICAgICAgIGNvbnN0IHNvcnQgICA9ICRlbGVtZW50LmF0dHIoJ3NvcnQnKTtcblxuICAgICAgICAvLyBzb3J0LWJ5IG1heSBuYW1lIGEgZG9jdW1lbnQgY29sdW1uIChzdWNoIGFzIHRpdGxlLCByZW5kZXJQYXRoLFxuICAgICAgICAvLyB2cGF0aCwgcGFyZW50RGlyLCBvciBwdWJsaWNhdGlvblRpbWUpIG9yIGFueSBmcm9udG1hdHRlciBmaWVsZFxuICAgICAgICAvLyAoc3VjaCBhcyBhIGN1c3RvbSBgc3RlcGAgb3JkZXJpbmcgZmllbGQpLiAgVGhlIHNlYXJjaCBxdWVyeVxuICAgICAgICAvLyAoc2VlIGJ1aWxkU2VhcmNoUXVlcnkgaW4gbGliL2NhY2hlL2NhY2hlLXNxbGl0ZS50cykgc29ydHMgYnkgYVxuICAgICAgICAvLyBjb2x1bW4gd2hlbiB0aGUgbmFtZSBtYXRjaGVzIG9uZSwgYW5kIG90aGVyd2lzZSBleHRyYWN0cyB0aGVcbiAgICAgICAgLy8gdmFsdWUgZnJvbSB0aGUgSlNPTiBtZXRhZGF0YS4gIFdlIG9ubHkgbmVlZCB0byBndWFyZCBhZ2FpbnN0XG4gICAgICAgIC8vIG5hbWVzIHRoYXQgY291bGQgbm90IGJlIGEgc2FmZSBmcm9udG1hdHRlciBrZXkgaGVyZTsgdGhlIHZhbHVlXG4gICAgICAgIC8vIGlzIGxhdGVyIGVzY2FwZWQgYmVmb3JlIHVzZSBpbiBTUUwuXG4gICAgICAgIGlmICh0eXBlb2Ygc29ydEJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFzb3J0QnkubWF0Y2goL15bQS1aYS16X11bQS1aYS16MC05Xy1dKiQvKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRHcm91cCBzb3J0LWJ5IGluY29ycmVjdCAke3NvcnRCeX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBzb3J0QnlEZXNjZW5kaW5nID0gZmFsc2U7XG4gICAgICAgIGlmICh0eXBlb2Ygc29ydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghc29ydC5tYXRjaCgvXihkZXNjfGFzYykkLykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50R3JvdXAgc29ydCBpbmNvcnJlY3QgJHtzb3J0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc29ydEJ5RGVzY2VuZGluZyA9IHNvcnQgPT09ICdkZXNjJztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsaW1pdE51bTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHlwZW9mIGxpbWl0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbGltaXROdW0gPSBOdW1iZXIucGFyc2VJbnQobGltaXQsIDEwKTtcbiAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4obGltaXROdW0pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudEdyb3VwIGxpbWl0IGluY29ycmVjdCAke2xpbWl0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG9mZnNldE51bTogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9mZnNldE51bSA9IE51bWJlci5wYXJzZUludChvZmZzZXQsIDEwKTtcbiAgICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ob2Zmc2V0TnVtKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRHcm91cCBvZmZzZXQgaW5jb3JyZWN0ICR7b2Zmc2V0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB7XG4gICAgICAgICAgICByZW5kZXJzVG9IVE1MLFxuICAgICAgICAgICAgcm9vdFBhdGg6IHR5cGVvZiByb290UGF0aCA9PT0gJ3N0cmluZycgPyByb290UGF0aCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGdsb2I6IHR5cGVvZiB2cGF0aEdsb2IgPT09ICdzdHJpbmcnID8gdnBhdGhHbG9iIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgcmVuZGVyZ2xvYjogdHlwZW9mIHJlbmRlckdsb2IgPT09ICdzdHJpbmcnID8gcmVuZGVyR2xvYiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGxheW91dHMsXG4gICAgICAgICAgICAvLyBUaGUgc2VhcmNoIHF1ZXJ5IG1hdGNoZXMgYW4gYXJyYXkgb2YgYmxvZ3RhZ3MgdmlhIHRoZVxuICAgICAgICAgICAgLy8gYGJsb2d0YWdzYCBvcHRpb24sIGFuZCBhIHNpbmdsZSBibG9ndGFnIHZpYSBgYmxvZ3RhZ2AuXG4gICAgICAgICAgICBibG9ndGFncyxcbiAgICAgICAgICAgIHRhZzogdGFncyxcbiAgICAgICAgICAgIHBhcmVudERpcjogdHlwZW9mIHBhcmVudERpciA9PT0gJ3N0cmluZycgPyBwYXJlbnREaXIgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBkaXJuYW1lOiB0eXBlb2YgZGlybmFtZSA9PT0gJ3N0cmluZycgPyBkaXJuYW1lIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgc2tpcGdsb2I6IHR5cGVvZiBza2lwR2xvYiA9PT0gJ3N0cmluZycgPyBza2lwR2xvYiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGxpbWl0OiBsaW1pdE51bSxcbiAgICAgICAgICAgIG9mZnNldDogb2Zmc2V0TnVtLFxuICAgICAgICAgICAgc29ydEJ5LFxuICAgICAgICAgICAgc29ydEJ5RGVzY2VuZGluZ1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHdyYXBwZXJUb3AgPSBgPGRpdmBcbiAgICAgICAgICAgICsgZG9IVE1MQXR0cmlidXRlKCdpZCcsIGlkKVxuICAgICAgICAgICAgKyBkb0hUTUxBdHRyaWJ1dGUoJ2NsYXNzJywgY2xhenopXG4gICAgICAgICAgICArIGRvSFRNTEF0dHJpYnV0ZSgnd2lkdGgnLCB3aWR0aClcbiAgICAgICAgICAgICsgZG9IVE1MQXR0cmlidXRlKCdzdHlsZScsIHN0eWxlKVxuICAgICAgICAgICAgKyBgPmA7XG4gICAgICAgIGNvbnN0IHdyYXBwZXJCb3R0b20gPSAnPC9kaXY+JztcblxuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBkb2N1bWVudHMuc2VhcmNoKHNlbGVjdG9yKTtcblxuICAgICAgICBjb25zdCBlbGVtZW50cyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHsgZW50cnkgfVxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd3JhcHBlclRvcCArIGVsZW1lbnRzLmpvaW4oJ1xcbicpICsgd3JhcHBlckJvdHRvbTtcblxuICAgIH1cbn1cblxuY2xhc3MgU2hvd0NvbnRlbnQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNob3ctY29udGVudFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX3Nob3ctY29udGVudC5odG1sLm5qayc7XG4gICAgICAgIGxldCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ3Nob3ctY29udGVudCBtdXN0IHJlY2VpdmUgYW4gaHJlZicpKTtcbiAgICAgICAgY29uc3QgY2xhenogICA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgICAgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjYXB0aW9uID0gJGVsZW1lbnQuaHRtbCgpO1xuICAgICAgICBjb25zdCB3aWR0aCAgID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgICA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRJbWFnZSA9ICRlbGVtZW50LmF0dHIoJ2NvbnRlbnQtaW1hZ2UnKTtcbiAgICAgICAgY29uc3QgZG9jMnJlYWQgPSByZXNvbHZlVnBhdGgobWV0YWRhdGEuZG9jdW1lbnQucGF0aCwgaHJlZik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9ICR7ZG9jMnJlYWR9YCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jMnJlYWQpO1xuICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3QsIGNvbnRlbnRJbWFnZSxcbiAgICAgICAgICAgIGRvY3VtZW50OiBkb2NcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJldCA9IGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCBkYXRhKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7aHJlZn0gJHt1dGlsLmluc3BlY3QoZGF0YSl9ID09PiAke3JldH1gKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbi8qXG5cblRoaXMgd2FzIG1vdmVkIGludG8gTWFoYWJodXRhXG5cbiBjbGFzcyBQYXJ0aWFsIGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInBhcnRpYWxcIjsgfVxuXHRwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblx0XHQvLyBXZSBkZWZhdWx0IHRvIG1ha2luZyBwYXJ0aWFsIHNldCB0aGUgZGlydHkgZmxhZy4gIEJ1dCBhIHVzZXJcblx0XHQvLyBvZiB0aGUgcGFydGlhbCB0YWcgY2FuIGNob29zZSB0byB0ZWxsIHVzIGl0IGlzbid0IGRpcnR5LlxuXHRcdC8vIEZvciBleGFtcGxlLCBpZiB0aGUgcGFydGlhbCBvbmx5IHN1YnN0aXR1dGVzIG5vcm1hbCB0YWdzXG5cdFx0Ly8gdGhlcmUncyBubyBuZWVkIHRvIGRvIHRoZSBkaXJ0eSB0aGluZy5cblx0XHR2YXIgZG90aGVkaXJ0eXRoaW5nID0gJGVsZW1lbnQuYXR0cignZGlydHknKTtcblx0XHRpZiAoIWRvdGhlZGlydHl0aGluZyB8fCBkb3RoZWRpcnR5dGhpbmcubWF0Y2goL3RydWUvaSkpIHtcblx0XHRcdGRpcnR5KCk7XG5cdFx0fVxuXHRcdHZhciBmbmFtZSA9ICRlbGVtZW50LmF0dHIoXCJmaWxlLW5hbWVcIik7XG5cdFx0dmFyIHR4dCAgID0gJGVsZW1lbnQuaHRtbCgpO1xuXHRcdHZhciBkID0ge307XG5cdFx0Zm9yICh2YXIgbXByb3AgaW4gbWV0YWRhdGEpIHsgZFttcHJvcF0gPSBtZXRhZGF0YVttcHJvcF07IH1cblx0XHR2YXIgZGF0YSA9ICRlbGVtZW50LmRhdGEoKTtcblx0XHRmb3IgKHZhciBkcHJvcCBpbiBkYXRhKSB7IGRbZHByb3BdID0gZGF0YVtkcHJvcF07IH1cblx0XHRkW1wicGFydGlhbEJvZHlcIl0gPSB0eHQ7XG5cdFx0bG9nKCdwYXJ0aWFsIHRhZyBmbmFtZT0nKyBmbmFtZSArJyBhdHRycyAnKyB1dGlsLmluc3BlY3QoZGF0YSkpO1xuXHRcdHJldHVybiByZW5kZXIucGFydGlhbCh0aGlzLmNvbmZpZywgZm5hbWUsIGQpXG5cdFx0LnRoZW4oaHRtbCA9PiB7IHJldHVybiBodG1sOyB9KVxuXHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0ZXJyb3IobmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycikpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycik7XG5cdFx0fSk7XG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzLm1haGFiaHV0YS5hZGRNYWhhZnVuYyhuZXcgUGFydGlhbCgpKTsgKi9cblxuLy9cbi8vIDxzZWxlY3QtZWxlbWVudHMgY2xhc3M9XCIuLlwiIGlkPVwiLi5cIiBjb3VudD1cIk5cIj5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gPC9zZWxlY3QtZWxlbWVudHM+XG4vL1xuY2xhc3MgU2VsZWN0RWxlbWVudHMgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2VsZWN0LWVsZW1lbnRzXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBsZXQgY291bnQgPSAkbGluay5hdHRyKCdjb3VudCcpXG4gICAgICAgICAgICAgICAgICAgID8gTnVtYmVyLnBhcnNlSW50KCRsaW5rLmF0dHIoJ2NvdW50JykpXG4gICAgICAgICAgICAgICAgICAgIDogMTtcbiAgICAgICAgY29uc3QgY2xhenogPSAkbGluay5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICA9ICRsaW5rLmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IHRuICAgID0gJGxpbmsuYXR0cigndGFnLW5hbWUnKVxuICAgICAgICAgICAgICAgICAgICA/ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgOiAnZGl2JztcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9ICRsaW5rLmNoaWxkcmVuKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gW107XG5cbiAgICAgICAgZm9yICg7IGNvdW50ID49IDEgJiYgY2hpbGRyZW4ubGVuZ3RoID49IDE7IGNvdW50LS0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgX24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coX24pO1xuICAgICAgICAgICAgY29uc3QgY2hvc2VuID0gJChjaGlsZHJlbltfbl0pLmh0bWwoKTtcbiAgICAgICAgICAgIHNlbGVjdGVkLnB1c2goY2hvc2VuKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaG9zZW4pO1xuICAgICAgICAgICAgZGVsZXRlIGNoaWxkcmVuW19uXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX3V1aWQgPSB1dWlkdjEoKTtcbiAgICAgICAgJGxpbmsucmVwbGFjZVdpdGgoYDwke3RufSBpZD0nJHtfdXVpZH0nPjwvJHt0bn0+YCk7XG4gICAgICAgIGNvbnN0ICRuZXdJdGVtID0gJChgJHt0bn0jJHtfdXVpZH1gKTtcbiAgICAgICAgaWYgKGlkKSAkbmV3SXRlbS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgZWxzZSAkbmV3SXRlbS5yZW1vdmVBdHRyKCdpZCcpO1xuICAgICAgICBpZiAoY2xhenopICRuZXdJdGVtLmFkZENsYXNzKGNsYXp6KTtcbiAgICAgICAgZm9yIChsZXQgY2hvc2VuIG9mIHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAkbmV3SXRlbS5hcHBlbmQoY2hvc2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbmNsYXNzIEFuY2hvckNsZWFudXAgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGFbbXVuZ2VkIT0neWVzJ11cIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGFbbXVuZ2VkIT0neWVzJ11cIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciBocmVmICAgICA9ICRsaW5rLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgdmFyIGxpbmt0ZXh0ID0gJGxpbmsudGV4dCgpO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgYXNzZXRzLmlzUmVhZHkoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHtocmVmfSAke2xpbmt0ZXh0fWApO1xuICAgICAgICBpZiAoaHJlZiAmJiBocmVmICE9PSAnIycpIHtcbiAgICAgICAgICAgIGNvbnN0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luICE9PSAnaHR0cDovL2V4YW1wbGUuY29tJykgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIGlmICghdUhyZWYucGF0aG5hbWUpIHJldHVybiBcIm9rXCI7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGlzIGxvY2FsICR7aHJlZn0gJHtsaW5rdGV4dH0gdUhyZWYgJHt1SHJlZi5wYXRobmFtZX1gKTtcblxuICAgICAgICAgICAgLyogaWYgKG1ldGFkYXRhLmRvY3VtZW50LnBhdGggPT09ICdpbmRleC5odG1sLm1kJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIG1ldGFkYXRhLmRvY3VtZW50LnBhdGggJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBocmVmICR7aHJlZn0gdUhyZWYucGF0aG5hbWUgJHt1SHJlZi5wYXRobmFtZX0gdGhpcy5jb25maWcucm9vdF91cmwgJHt0aGlzLmNvbmZpZy5yb290X3VybH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkLmh0bWwoKSk7XG4gICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAgIC8vIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGRldGVybWluZWQgdGhpcyBpcyBhIGxvY2FsIGhyZWYuXG4gICAgICAgICAgICAvLyBGb3IgcmVmZXJlbmNlIHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lIG9mIHRoZSBocmVmIHdpdGhpblxuICAgICAgICAgICAgLy8gdGhlIHByb2plY3QuICBGb3IgZXhhbXBsZSB0byByZXRyaWV2ZSB0aGUgdGl0bGUgd2hlbiB3ZSdyZSBmaWxsaW5nXG4gICAgICAgICAgICAvLyBpbiBmb3IgYW4gZW1wdHkgPGE+IHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lLlxuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgbGluayBhcyBoYXZpbmcgYmVlbiBwcm9jZXNzZWQuXG4gICAgICAgICAgICAvLyBUaGUgcHVycG9zZSBpcyBpZiBNYWhhYmh1dGEgcnVucyBtdWx0aXBsZSBwYXNzZXMsXG4gICAgICAgICAgICAvLyB0byBub3QgcHJvY2VzcyB0aGUgbGluayBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICAgIC8vIEJlZm9yZSBhZGRpbmcgdGhpcyAtIHdlIHNhdyB0aGlzIE11bmdlciB0YWtlIGFzIG11Y2hcbiAgICAgICAgICAgIC8vIGFzIDgwMG1zIHRvIGV4ZWN1dGUsIGZvciBFVkVSWSBwYXNzIG1hZGUgYnkgTWFoYWJodXRhLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGlzIGF0dHJpYnV0ZSwgYW5kIGNoZWNraW5nIGZvciBpdCBpbiB0aGUgc2VsZWN0b3IsXG4gICAgICAgICAgICAvLyBtZWFucyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGxpbmsgb25jZS5cbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ211bmdlZCcsICd5ZXMnKTtcblxuICAgICAgICAgICAgbGV0IGFic29sdXRlUGF0aCA9IHJlc29sdmVWcGF0aChtZXRhZGF0YS5kb2N1bWVudC5wYXRoLCBocmVmKTtcblxuICAgICAgICAgICAgLy8gVGhlIGlkZWEgZm9yIHRoaXMgc2VjdGlvbiBpcyB0byBlbnN1cmUgYWxsIGxvY2FsIGhyZWYncyBhcmUgXG4gICAgICAgICAgICAvLyBmb3IgYSByZWxhdGl2ZSBwYXRoIHJhdGhlciB0aGFuIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIEhlbmNlIHdlIHVzZSB0aGUgcmVsYXRpdmUgbW9kdWxlIHRvIGNvbXB1dGUgdGhlIHJlbGF0aXZlIHBhdGhcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBFeGFtcGxlOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAvaW5kZXguaHRtbCBpbiB7XG4gICAgICAgICAgICAvLyAgYmFzZWRpcjogJy9Wb2x1bWVzL0V4dHJhL2FrYXNoYXJlbmRlci9ha2FzaGFyZW5kZXIvdGVzdC9kb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gIHJlbHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbHJlbmRlcjogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbCcsXG4gICAgICAgICAgICAvLyAgcGF0aDogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbC5tZCcsXG4gICAgICAgICAgICAvLyAgcmVuZGVyVG86ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnXG4gICAgICAgICAgICAvLyB9IHRvIC4uLy4uLy4uL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3NcbiAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29rIHRvIHNlZSBpZiBpdCdzIGFuIGFzc2V0IGZpbGVcbiAgICAgICAgICAgIGxldCBmb3VuZEFzc2V0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gYXdhaXQgYXNzZXRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvdW5kQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBhc3NldCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZEFzc2V0ICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBBc2sgcGx1Z2lucyBpZiB0aGUgaHJlZiBpcyBva2F5XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcuYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmKGFic29sdXRlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBsZWdpdCBsb2NhbCBocmVmICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgbGluayBoYXMgYSBib2R5LCB0aGVuIGRvbid0IG1vZGlmeSBpdFxuICAgICAgICAgICAgaWYgKChsaW5rdGV4dCAmJiBsaW5rdGV4dC5sZW5ndGggPiAwICYmIGxpbmt0ZXh0ICE9PSBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgfHwgKCRsaW5rLmNoaWxkcmVuKCkubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBza2lwcGluZyAke2Fic29sdXRlUGF0aH0gdy8gJHt1dGlsLmluc3BlY3QobGlua3RleHQpfSBjaGlsZHJlbj0gJHskbGluay5jaGlsZHJlbigpfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvZXMgaXQgZXhpc3QgaW4gZG9jdW1lbnRzIGRpcj9cbiAgICAgICAgICAgIGlmIChhYnNvbHV0ZVBhdGggPT09ICcvJykge1xuICAgICAgICAgICAgICAgIGFic29sdXRlUGF0aCA9ICcvaW5kZXguaHRtbCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChhYnNvbHV0ZVBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluZFJlbmRlcnNUbyAke2Fic29sdXRlUGF0aH0gJHt1dGlsLmluc3BlY3QoZm91bmQpfWApO1xuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIC8vIFJlcG9ydCBhIGJyb2tlbiBpbnRlcm5hbCBsaW5rLCBnYXRlZCBvbiB0aGUgY29uZmlndXJlZFxuICAgICAgICAgICAgICAgIC8vIGludGVybmFsIGxpbmstY2hlY2sgbW9kZS4gIFRoZSBhdXRob3JpdGF0aXZlIGVycm9yL2ZhdGFsXG4gICAgICAgICAgICAgICAgLy8gZW5mb3JjZW1lbnQgKHdoaWNoIGZhaWxzIHRoZSBidWlsZCkgaGFwcGVucyBpbiB0aGVcbiAgICAgICAgICAgICAgICAvLyB3aG9sZS1zaXRlIHNjYW4gZHVyaW5nIG9uU2l0ZVJlbmRlcmVkOyBoZXJlIHdlIG9ubHkgc3VyZmFjZVxuICAgICAgICAgICAgICAgIC8vIHRoZSB3YXJuaW5nIGR1cmluZyByZW5kZXJpbmcgdW5sZXNzIGNoZWNraW5nIGlzIGRpc2FibGVkLlxuICAgICAgICAgICAgICAgIGNvbnN0IG1vZGUgPSB0aGlzLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/Lm9wdGlvbnM/LmNoZWNrTGlua3M/LmludGVybmFsO1xuICAgICAgICAgICAgICAgIGlmIChtb2RlICYmIG1vZGUgIT09ICdpZ25vcmUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyc1RvICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgZGlyZWN0b3J5LCB0aGVyZSBtaWdodCBiZSAvcGF0aC90by9pbmRleC5odG1sIHNvIHdlIHRyeSBmb3IgdGhhdC5cbiAgICAgICAgICAgIC8vIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aCB3b3VsZCBmYWlsIG9uIGp1c3QgL3BhdGgvdG8gYnV0IHN1Y2NlZWRcbiAgICAgICAgICAgIC8vIG9uIC9wYXRoL3RvL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIGlmIChmb3VuZC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aC5qb2luKGFic29sdXRlUGF0aCwgXCJpbmRleC5odG1sXCIpKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBsb29rIGludG8gZmlsbGluZyBlbXB0aW5lc3Mgd2l0aCB0aXRsZVxuXG4gICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7ZG9jbWV0YS50aXRsZX1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7aHJlZn1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZFJlbmRlcmVyUGF0aCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLyogdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvY21ldGEgPSBhd2FpdCByZW5kZXJlci5tZXRhZGF0YShmb3VuZC5mb3VuZERpciwgZm91bmQuZm91bmRQYXRoV2l0aGluRGlyKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZXRyaWV2ZSBkb2N1bWVudCBtZXRhZGF0YSBmb3IgJHtmb3VuZC5mb3VuZERpcn0gJHtmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXJ9IGJlY2F1c2UgJHtlcnJ9YCk7XG4gICAgICAgICAgICAgICAgfSAqLS0vXG4gICAgICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgaWYgKCEkbGluay5hdHRyKCd0aXRsZScpICYmIGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmlzaGVkYCk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IERPTkUgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgYm90aGVyIHRocm93aW5nIGFuIGVycm9yLiAgSnVzdCBmaWxsIGl0IGluIHdpdGhcbiAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcuXG4gICAgICAgICAgICAgICAgJGxpbmsudGV4dChocmVmKTtcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaWxsIGluIGVtcHR5ICdhJyBlbGVtZW50IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gd2l0aCBocmVmICR7aHJlZn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vICBNQUhBRlVOQ1MgRk9SIEZJTkFMIFBBU1NcblxuLyoqXG4gKiBSZW1vdmVzIHRoZSA8Y29kZT5tdW5nZWQ9eWVzPC9jb2RlPiBhdHRyaWJ1dGUgdGhhdCBpcyBhZGRlZFxuICogYnkgPGNvZGU+QW5jaG9yQ2xlYW51cDwvY29kZT4uXG4gKi9cbmNsYXNzIE11bmdlZEF0dHJSZW1vdmVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ211bmdlZCcpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vKipcbiAqIEhhbmRsZXMgdGhlIHJlY29tbWVuZGF0aW9ucyBpbjpcbiAqIGh0dHBzOi8vamF2YXNjcmlwdC5wbGFpbmVuZ2xpc2guaW8vb25lLWxpbmUtb2YtaHRtbC10aGF0LW1ha2VzLWV4dGVybmFsLWxpbmtzLXNhZmVyLTk1ZmU0YmE2ZmYyOFxuICovXG5jbGFzcyBCbGFua0xpbmtEZWZhbmdlciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW3RhcmdldD1fYmxhbmtdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVt0YXJnZXQ9X2JsYW5rXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIHRoaXMuYWthc2hhLmxpbmtSZWxTZXRBdHRyKCRlbGVtZW50LCAnbm9vcGVuZXInLCB0cnVlKTtcbiAgICAgICAgdGhpcy5ha2FzaGEubGlua1JlbFNldEF0dHIoJGVsZW1lbnQsICdub3JlZmVycmVyJywgdHJ1ZSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGFuZ2VkIHJlbCBhdHRyIHRvICR7JGVsZW1lbnQuYXR0cigncmVsJyl9YCk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8gTnVuanVja3MgRXh0ZW5zaW9uc1xuXG4vLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2Z0b25pYy9udW5qdWNrcy1pbmNsdWRlLXdpdGgvdHJlZS9tYXN0ZXJcblxuY2xhc3Mgc3R5bGVzaGVldHNFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtzdHlsZXNoZWV0cycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHN0eWxlc2hlZXRzRXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBzdHlsZXNoZWV0c0V4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRhZyB0b2tlblxuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcblxuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYXJncyBhbmQgbW92ZSBhZnRlciB0aGUgYmxvY2sgZW5kLiBwYXNzaW5nIHRydWVcbiAgICAgICAgICAgIC8vIGFzIHRoZSBzZWNvbmQgYXJnIGlzIHJlcXVpcmVkIGlmIHRoZXJlIGFyZSBubyBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGJvZHkgYW5kIHBvc3NpYmx5IHRoZSBlcnJvciBibG9jaywgd2hpY2ggaXMgb3B0aW9uYWxcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrc3R5bGVzaGVldHMnKTtcblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHN0eWxlc2hlZXRzRXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb1N0eWxlc2hlZXRzKGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5jbGFzcyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2FraGVhZGVyanMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtoZWFkZXJqcycpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb0hlYWRlckphdmFTY3JpcHQoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtmb290ZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2Zvb3RlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvRm9vdGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdGVzdEV4dGVuc2lvbigpIHtcbiAgICB0aGlzLnRhZ3MgPSBbICdha25qa3Rlc3QnIF07XG5cbiAgICB0aGlzLnBhcnNlID0gZnVuY3Rpb24ocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbmNvbnNvbGUubG9nKGBpbiB0ZXN0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZXJyb3InLCAnZW5kYWtuamt0ZXN0Jyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JCb2R5ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYocGFyc2VyLnNraXBTeW1ib2woJ2Vycm9yJykpIHtcbiAgICAgICAgICAgICAgICBwYXJzZXIuc2tpcChsZXhlci5UT0tFTl9CTE9DS19FTkQpO1xuICAgICAgICAgICAgICAgIGVycm9yQm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keSwgZXJyb3JCb2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGVzdEV4dGlvbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHRoaXMucnVuID0gZnVuY3Rpb24oY29udGV4dCwgdXJsLCBib2R5LCBlcnJvckJvZHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCAke3V0aWwuaW5zcGVjdChjb250ZXh0KX0gJHt1dGlsLmluc3BlY3QodXJsKX0gJHt1dGlsLmluc3BlY3QoYm9keSl9ICR7dXRpbC5pbnNwZWN0KGVycm9yQm9keSl9YCk7XG4gICAgfTtcblxufVxuIl19