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
var _BuiltInPlugin_config, _BuiltInPlugin_resize_queue;
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
import { CustomElement, Munger, PageProcessor } from './index.js';
const pluginName = "akashacms-builtin";
export class BuiltInPlugin extends Plugin {
    constructor() {
        super(pluginName);
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
    }
}
_BuiltInPlugin_config = new WeakMap(), _BuiltInPlugin_resize_queue = new WeakMap();
export const mahabhutaArray = function (options, config, akasha, plugin) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    ret.addMahafunc(new StylesheetsElement(config, akasha, plugin));
    ret.addMahafunc(new HeaderJavaScript(config, akasha, plugin));
    ret.addMahafunc(new FooterJavaScript(config, akasha, plugin));
    ret.addMahafunc(new HeadLinkRelativizer(config, akasha, plugin));
    ret.addMahafunc(new ScriptRelativizer(config, akasha, plugin));
    ret.addMahafunc(new InsertTeaser(config, akasha, plugin));
    ret.addMahafunc(new CodeEmbed(config, akasha, plugin));
    ret.addMahafunc(new AkBodyClassAdd(config, akasha, plugin));
    ret.addMahafunc(new FigureImage(config, akasha, plugin));
    ret.addMahafunc(new img2figureImage(config, akasha, plugin));
    ret.addMahafunc(new ImageRewriter(config, akasha, plugin));
    ret.addMahafunc(new ShowContent(config, akasha, plugin));
    ret.addMahafunc(new SelectElements(config, akasha, plugin));
    ret.addMahafunc(new AnchorCleanup(config, akasha, plugin));
    ret.addFinalMahafunc(new MungedAttrRemover(config, akasha, plugin));
    return ret;
};
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
        let doc2read;
        if (!href.startsWith('/')) {
            let dir = path.dirname(metadata.document.path);
            doc2read = path.join('/', dir, href);
        }
        else {
            doc2read = href;
        }
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
            let absolutePath;
            if (!path.isAbsolute(uHref.pathname)) {
                absolutePath = path.join(path.dirname(metadata.document.path), uHref.pathname);
                // console.log(`***** AnchorCleanup FIXED href to ${uHref.pathname}`);
            }
            else {
                absolutePath = uHref.pathname;
            }
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
            if (foundAsset) { // && foundAsset.length > 0) {
                return "ok";
            }
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findAsset ${(new Date() - startTime) / 1000} seconds`);
            // Ask plugins if the href is okay
            if (this.config.askPluginsLegitLocalHref(absolutePath)) {
                return "ok";
            }
            // If this link has a body, then don't modify it
            if ((linktext && linktext.length > 0 && linktext !== absolutePath)
                || ($link.children().length > 0)) {
                // console.log(`AnchorCleanup skipping ${absolutePath} w/ ${util.inspect(linktext)} children= ${$link.children()}`);
                return "ok";
            }
            // Does it exist in documents dir?
            let found = await documents.find(absolutePath);
            // console.log(`AnchorCleanup findRendersTo ${absolutePath} ${util.inspect(found)}`);
            if (!found) {
                // console.log(`WARNING: Did not find ${href} in ${util.inspect(this.config.documentDirs)} in ${metadata.document.path} absolutePath ${absolutePath}`);
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
                $link.text(docmeta.title);
            }
            else {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsTUFBTSxZQUFZLENBQUM7QUFFakcsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUM7QUFFdkMsTUFBTSxPQUFPLGFBQWMsU0FBUSxNQUFNO0lBQ3hDO1FBQ0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBS2hCLHdDQUFRO1FBQ1IsOENBQWM7UUFMVix1QkFBQSxJQUFJLCtCQUFpQixFQUFFLE1BQUEsQ0FBQztJQUUvQixDQUFDO0lBS0QsU0FBUyxDQUFDLE1BQXFCLEVBQUUsT0FBTztRQUNqQyx1QkFBQSxJQUFJLHlCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUM3QixJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUMxRCxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztRQUM1QyxDQUFDO1FBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMscUJBQXFCLEtBQUssV0FBVyxFQUFFLENBQUM7WUFDNUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUM7UUFDOUMsQ0FBQztRQUNELElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixLQUFLLFdBQVcsRUFBRSxDQUFDO1lBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1FBQzVDLENBQUM7UUFDRCxJQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QyxnRUFBZ0U7UUFDaEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLHlEQUF5RDtRQUN6RCx3REFBd0Q7UUFDeEQscURBQXFEO1FBQ3JELGlFQUFpRTtRQUNqRSx3REFBd0Q7UUFDeEQsbUVBQW1FO1FBQ25FLHNFQUFzRTtRQUN0RSw0Q0FBNEM7UUFDNUMsbURBQW1EO1FBQ25ELDJDQUEyQztRQUMzQyxPQUFPO1FBQ1AsTUFBTSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDO1FBQzVDLHNEQUFzRDtRQUN0RCx3Q0FBd0M7UUFDeEMsNEJBQTRCO1FBQzVCLDZCQUE2QjtRQUM3Qix1QkFBdUI7U0FDMUIsQ0FBQyxDQUFDLENBQUM7UUFDSixNQUFNLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUV4RSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBK0IsQ0FBQztRQUNwRixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsWUFBWSxDQUFDLGVBQWUsRUFDckMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FDbkQsQ0FBQztRQUNGLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUNsQyxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUN4RCxDQUFDO1FBQ0YsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZLEVBQ2xDLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQ3hELENBQUM7UUFFRiw0Q0FBNEM7UUFDNUMsS0FBSyxNQUFNLEdBQUcsSUFBSTtZQUNOLGVBQWU7WUFDZixZQUFZO1lBQ1osWUFBWTtTQUN2QixFQUFFLENBQUM7WUFDQSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxNQUFNLElBQUksS0FBSyxDQUFDLDZDQUE2QyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7UUFDTCxDQUFDO1FBR0QsUUFBUTtRQUNSLG1FQUFtRTtRQUNuRSxrQkFBa0I7UUFDbEIsa0NBQWtDO1FBQ2xDLElBQUk7UUFFSixpREFBaUQ7UUFDakQsdURBQXVEO1FBQ3ZELFdBQVc7UUFDWCx1Q0FBdUM7UUFDdkMsSUFBSTtJQUNSLENBQUM7SUFFRCxJQUFJLE1BQU0sS0FBSyxPQUFPLHVCQUFBLElBQUksNkJBQVEsQ0FBQyxDQUFDLENBQUM7SUFDckMsbURBQW1EO0lBRW5ELElBQUksV0FBVyxLQUFLLE9BQU8sdUJBQUEsSUFBSSxtQ0FBYyxDQUFDLENBQUMsQ0FBQztJQUVoRDs7O09BR0c7SUFDSCxJQUFJLG1CQUFtQixDQUFDLEdBQUc7UUFDdkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLENBQUM7SUFDM0MsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUkscUJBQXFCLENBQUMsR0FBRztRQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixHQUFHLEdBQUcsQ0FBQztJQUM3QyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0lBQzNDLENBQUM7SUFFRCxhQUFhLENBQUMsUUFBUTtRQUNyQixPQUFPLGNBQWMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDNUQsQ0FBQztJQUVELGtCQUFrQixDQUFDLFFBQVE7UUFDMUIsT0FBTyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVELGtCQUFrQixDQUFDLFFBQVE7UUFDMUIsT0FBTyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVELGdCQUFnQixDQUFDLEdBQVcsRUFBRSxXQUFtQixFQUFFLFFBQWdCLEVBQUUsT0FBZTtRQUNoRix5RkFBeUY7UUFDekYsdUJBQUEsSUFBSSxtQ0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTTtRQUV2QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7UUFDdkQsNkJBQTZCO1FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztRQUNqRCwwQkFBMEI7UUFDMUIsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksbUNBQWMsQ0FBQztlQUNqQyx1QkFBQSxJQUFJLG1DQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBRW5DLElBQUksUUFBUSxHQUFHLHVCQUFBLElBQUksbUNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUV4QyxJQUFJLFVBQVUsQ0FBQztZQUNmLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNqQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFDOUIsUUFBUSxDQUFDLEdBQUcsQ0FDZixDQUFDLENBQUM7WUFDUCxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osVUFBVSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDOUIsQ0FBQztZQUVELElBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQztZQUV4QixJQUFJLEtBQUssR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDMUMsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDUixPQUFPLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUMzQixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDekMsT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQy9DLENBQUM7WUFDRCxJQUFJLENBQUMsT0FBTztnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1FQUFtRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBRS9HLElBQUksQ0FBQztnQkFDRCxJQUFJLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDL0IsSUFBSSxPQUFPLEdBQUcsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RFLGtEQUFrRDtnQkFDbEQsd0JBQXdCO2dCQUN4QixJQUFJLFdBQVcsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7Z0JBQ3JFLElBQUksVUFBVSxDQUFDO2dCQUNmLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO29CQUMvQixVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7cUJBQU0sQ0FBQztvQkFDSix5REFBeUQ7b0JBQ3pELDBCQUEwQjtvQkFDMUIsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQ2QsTUFBTSxDQUFDLGlCQUFpQixFQUN4QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFDOUIsV0FBVyxDQUFDLENBQUM7Z0JBQ3pCLENBQUM7Z0JBRUQsNkNBQTZDO2dCQUM3QyxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckMsQ0FBQztZQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQ0FBcUMsT0FBTyxjQUFjLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25KLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUVKOztBQUVELE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBRyxVQUNsQixPQUFPLEVBQ1AsTUFBc0IsRUFDdEIsTUFBWSxFQUNaLE1BQWU7SUFFdkIsSUFBSSxHQUFHLEdBQUcsSUFBSSxTQUFTLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzRCxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksa0JBQWtCLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDOUQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM5RCxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksbUJBQW1CLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDL0QsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDMUQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdkQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDNUQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDekQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDN0QsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0QsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDekQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGNBQWMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDNUQsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFM0QsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRXBFLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyxDQUFDO0FBRUYsU0FBUyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFxQjtJQUM1RCwyREFBMkQ7SUFFM0QsSUFBSSxPQUFPLENBQUM7SUFDWixJQUFJLE9BQU8sUUFBUSxDQUFDLG9CQUFvQixLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQ3ZELE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDL0UsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUN0RSxDQUFDO0lBQ0QsbUtBQW1LO0lBRW5LLElBQUksQ0FBQyxPQUFPO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQzNELElBQUksQ0FBQyxNQUFNO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXpELElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDakMsS0FBSyxJQUFJLEtBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUV4QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNCLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztZQUN0RCxzREFBc0Q7WUFDdEQsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLG9CQUFvQixFQUFFLENBQUM7Z0JBQ3hDLHNCQUFzQjtnQkFDdEIsNkJBQTZCO2dCQUU3QixnREFBZ0Q7Z0JBQ2hELGdEQUFnRDtnQkFDaEQsNENBQTRDO2dCQUM1QywrQ0FBK0M7Z0JBQy9DLGtEQUFrRDtnQkFDbEQsNENBQTRDO2dCQUM1QywwQkFBMEI7Z0JBQzFCLElBQUksT0FBTyxDQUFDLG1CQUFtQjt1QkFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUM3Qjs7Ozs7Ozs7d0JBUUk7b0JBQ0osSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDcEUsNkhBQTZIO29CQUM3SCxTQUFTLEdBQUcsT0FBTyxDQUFDO2dCQUN4QixDQUFDO1lBQ0wsQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQzNCLElBQUksS0FBSyxFQUFFLENBQUM7b0JBQ1IsT0FBTyxVQUFVLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFBO2dCQUNyQyxDQUFDO3FCQUFNLENBQUM7b0JBQ0osT0FBTyxFQUFFLENBQUM7Z0JBQ2QsQ0FBQztZQUNMLENBQUMsQ0FBQztZQUNGLElBQUksRUFBRSxHQUFHLGdEQUFnRCxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFBO1lBQzVHLEdBQUcsSUFBSSxFQUFFLENBQUM7WUFFViwwQ0FBMEM7WUFDMUMsbUNBQW1DO1lBQ25DLEVBQUU7WUFDRix1Q0FBdUM7WUFDdkMsRUFBRTtZQUNGLDRDQUE0QztZQUM1QywrQ0FBK0M7WUFDL0MsK0NBQStDO1lBQy9DLHlDQUF5QztZQUN6QyxxQ0FBcUM7WUFDckMsZ0JBQWdCO1lBQ2hCLEVBQUU7WUFDRiwrQ0FBK0M7WUFDL0MsZ0RBQWdEO1lBQ2hELCtDQUErQztZQUMvQyxnQkFBZ0I7WUFDaEIsRUFBRTtZQUNGLDBEQUEwRDtZQUUxRCwrRUFBK0U7WUFDL0UscUNBQXFDO1lBQ3JDLHFCQUFxQjtZQUNyQiw0Q0FBNEM7WUFDNUMsSUFBSTtZQUNKLG1CQUFtQjtRQUN2QixDQUFDO1FBQ0Qsd0NBQXdDO0lBQzVDLENBQUM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FDbkIsUUFBUSxFQUNSLE9BQXlCLEVBQ3pCLE9BQU8sRUFDUCxNQUFxQjtJQUV4QixJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDYixJQUFJLENBQUMsT0FBTztRQUFFLE9BQU8sR0FBRyxDQUFDO0lBRXRCLElBQUksQ0FBQyxPQUFPO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0lBQzNELElBQUksQ0FBQyxNQUFNO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0lBRXpELEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDcEMsTUFBTSxJQUFJLEtBQUssQ0FBQyx5Q0FBeUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEYsQ0FBQztRQUNLLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTtZQUFFLE1BQU0sQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBRXZDLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDcEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDUCxPQUFPLFNBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDcEMsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQztRQUNMLENBQUMsQ0FBQTtRQUNELE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDcEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDUCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUM7Z0JBQ3RCLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssb0JBQW9CLEVBQUUsQ0FBQztvQkFDeEMsc0JBQXNCO29CQUN0Qiw2QkFBNkI7b0JBQzdCLElBQUksT0FBTyxDQUFDLHFCQUFxQjsyQkFDOUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO3dCQUM3QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO3dCQUNyRSwrSEFBK0g7d0JBQy9ILFVBQVUsR0FBRyxPQUFPLENBQUM7b0JBQ3pCLENBQUM7Z0JBQ0wsQ0FBQztnQkFDRCxPQUFPLFFBQVEsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7WUFDekMsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUNGLElBQUksRUFBRSxHQUFHLFdBQVcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLFdBQVcsQ0FBQztRQUMzRixHQUFHLElBQUksRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUNKLE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQUVELFNBQVMsbUJBQW1CLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFxQjtJQUNwRSxJQUFJLE9BQU8sQ0FBQztJQUNaLElBQUksT0FBTyxRQUFRLENBQUMsc0JBQXNCLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDNUQsT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUNoRixDQUFDO1NBQU0sQ0FBQztRQUNQLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ3JFLENBQUM7SUFDRCwrREFBK0Q7SUFDL0Qsc0VBQXNFO0lBQ3RFLE9BQU8sY0FBYyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsTUFBcUI7SUFDcEUsSUFBSSxPQUFPLENBQUM7SUFDWixJQUFJLE9BQU8sUUFBUSxDQUFDLHlCQUF5QixLQUFLLFdBQVcsRUFBRSxDQUFDO1FBQy9ELE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUN0RixDQUFDO1NBQU0sQ0FBQztRQUNQLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDeEUsQ0FBQztJQUNELE9BQU8sY0FBYyxDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRCxNQUFNLGtCQUFtQixTQUFRLGFBQWE7SUFDN0MsSUFBSSxXQUFXLEtBQUssT0FBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQWtCLEVBQUUsSUFBZTtRQUNwRSxJQUFJLEdBQUcsR0FBSSxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvRCwyQ0FBMkM7UUFDM0MsT0FBTyxHQUFHLENBQUM7SUFDbEIsQ0FBQztDQUNEO0FBRUQsTUFBTSxnQkFBaUIsU0FBUSxhQUFhO0lBQzNDLElBQUksV0FBVyxLQUFLLE9BQU8scUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBQ25ELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFrQixFQUFFLElBQWU7UUFDcEUsSUFBSSxHQUFHLEdBQUcsbUJBQW1CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuRSx5Q0FBeUM7UUFDekMsT0FBTyxHQUFHLENBQUM7SUFDbEIsQ0FBQztDQUNEO0FBRUQsTUFBTSxnQkFBaUIsU0FBUSxhQUFhO0lBQzNDLElBQUksV0FBVyxLQUFLLE9BQU8scUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBQ25ELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ3RDLE9BQU8sbUJBQW1CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2RSxDQUFDO0NBQ0Q7QUFFRCxNQUFNLG1CQUFvQixTQUFRLE1BQU07SUFDcEMsSUFBSSxRQUFRLEtBQUssT0FBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDM0MsSUFBSSxXQUFXLEtBQUssT0FBTyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDOUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ25DLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CO1lBQUUsT0FBTztRQUNwRCxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTlCLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ2hELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxvQkFBb0IsRUFBRSxDQUFDO1lBQ3hDLG9CQUFvQjtZQUNwQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDeEIsOEJBQThCO2dCQUM5QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNoQyxDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQUVELE1BQU0saUJBQWtCLFNBQVEsTUFBTTtJQUNsQyxJQUFJLFFBQVEsS0FBSyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDbkMsSUFBSSxXQUFXLEtBQUssT0FBTyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHFCQUFxQjtZQUFFLE9BQU87UUFDdEQsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUU3QixJQUFJLElBQUksRUFBRSxDQUFDO1lBQ1Asa0JBQWtCO1lBQ2xCLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2hELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4QyxvQkFBb0I7Z0JBQ3BCLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO29CQUN4Qiw4QkFBOEI7b0JBQzlCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQy9ELEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMvQixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxNQUFNLFlBQWEsU0FBUSxhQUFhO0lBQ3ZDLElBQUksV0FBVyxLQUFLLE9BQU8sV0FBVyxDQUFDLENBQUMsQ0FBQztJQUN6QyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNoQyxJQUFJLENBQUM7WUFDWCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQ0ksb0JBQW9CLEVBQUU7Z0JBQy9ELE1BQU0sRUFBRSxPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxXQUFXO29CQUNuRCxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTTthQUMxQyxDQUFDLENBQUM7UUFDRyxDQUFDO1FBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLENBQUM7UUFDWixDQUFDO0lBQ1IsQ0FBQztDQUNEO0FBRUQsTUFBTSxjQUFlLFNBQVEsYUFBYTtJQUN6QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSztRQUMvQixJQUFJLE9BQU8sUUFBUSxDQUFDLGNBQWMsS0FBSyxXQUFXO2VBQzlDLFFBQVEsQ0FBQyxjQUFjLElBQUksRUFBRTtlQUM3QixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDbEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZELENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7O1lBQU0sT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRDtBQUVELE1BQU0sU0FBVSxTQUFRLGFBQWE7SUFDakMsSUFBSSxXQUFXLEtBQUssT0FBTyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ25DLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNuQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDMUUsQ0FBQztRQUVELElBQUksT0FBTyxDQUFDO1FBQ1osSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDdEIsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNqQixDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO1FBQ3ZELE1BQU0sS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDVCxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixFQUFFLGdDQUFnQyxDQUFDLENBQUM7UUFDaEYsQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXJELE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDcEIsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDUCxPQUFPLGVBQWUsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDMUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sY0FBYyxDQUFDO1lBQzFCLENBQUM7UUFDTCxDQUFDLENBQUM7UUFDRixNQUFNLElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ2hCLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ0wsT0FBTyxPQUFPLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO1lBQ2hDLENBQUM7aUJBQU0sQ0FBQztnQkFDSixPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUM7UUFDTCxDQUFDLENBQUE7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMxQixJQUFJLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLENBQUM7Z0JBQ3JCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUU7b0JBQ3hCLFFBQVEsRUFBRSxJQUFJO2lCQUNqQixDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ2IsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDMUMsQ0FBQztRQUNMLENBQUMsQ0FBQTtRQUNELElBQUksR0FBRyxHQUFHLFFBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUM7UUFDckYsT0FBTyxHQUFHLENBQUM7UUFFWCx1REFBdUQ7UUFDdkQsNkJBQTZCO1FBQzdCLGdDQUFnQztRQUNoQyxJQUFJO1FBQ0osOEJBQThCO1FBQzlCLHlCQUF5QjtRQUN6QiwrQkFBK0I7UUFDL0IsSUFBSTtRQUNKLDZCQUE2QjtRQUM3Qiw2Q0FBNkM7UUFDN0MseUJBQXlCO1FBQ3pCLGlCQUFpQjtRQUNqQixXQUFXO1FBQ1gsdURBQXVEO1FBQ3ZELElBQUk7UUFDSixtQkFBbUI7SUFDdkIsQ0FBQztDQUNKO0FBRUQsTUFBTSxXQUFZLFNBQVEsYUFBYTtJQUNuQyxJQUFJLFdBQVcsS0FBSyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDdkMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUs7UUFDbkMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsUUFBUTtZQUFFLFFBQVEsR0FBRyxvQkFBb0IsQ0FBQztRQUMvQyxNQUFNLElBQUksR0FBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxJQUFJO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQzNELE1BQU0sS0FBSyxHQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxFQUFFLEdBQVEsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEMsTUFBTSxLQUFLLEdBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLEtBQUssR0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sSUFBSSxHQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDdEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7WUFDdkIsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSTtTQUMvQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFFRCxNQUFNLGVBQWdCLFNBQVEsYUFBYTtJQUN2QyxJQUFJLFdBQVcsS0FBSyxPQUFPLHVCQUF1QixDQUFDLENBQUMsQ0FBQztJQUNyRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUk7UUFDekMseUJBQXlCO1FBQ3pCLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2xDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUMzQixDQUFDLENBQUUsb0JBQW9CLENBQUM7UUFDaEMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMvQixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sSUFBSSxHQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ2hDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUMxQixDQUFDLENBQUMsRUFBRSxDQUFDO1FBRWIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDdEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUU7WUFDdkIsRUFBRSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxRQUFRO1lBQy9ELE9BQU8sRUFBRSxPQUFPO1NBQ25CLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQUVELE1BQU0sYUFBYyxTQUFRLE1BQU07SUFDOUIsSUFBSSxRQUFRLEtBQUssT0FBTyxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBQzFDLElBQUksV0FBVyxLQUFLLE9BQU8sZUFBZSxDQUFDLENBQUMsQ0FBQztJQUM3QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUs7UUFDbkMseUJBQXlCO1FBRXpCLHVDQUF1QztRQUN2QyxJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVCLHlDQUF5QztRQUN6QywwQ0FBMEM7UUFDMUMsc0NBQXNDO1FBQ3RDLHVDQUF1QztRQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNoRCxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssb0JBQW9CLEVBQUUsQ0FBQztZQUN2QyxPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO1FBRUQsb0NBQW9DO1FBQ3BDLE1BQU0sV0FBVyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDL0MsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUV6QyxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ2QseUNBQXlDO1lBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztpQkFDekIsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU5RSxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNYLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QixHQUFHLEdBQUcsUUFBUSxDQUFDO1lBQ25CLENBQUM7WUFFRCw2QkFBNkI7WUFDN0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNqQyxLQUFLLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxrRUFBa0U7UUFDbEUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdkIsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxQixnRkFBZ0Y7WUFDaEYsR0FBRyxHQUFHLE1BQU0sQ0FBQztRQUNqQixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUNKO0FBRUQsTUFBTSxXQUFZLFNBQVEsYUFBYTtJQUNuQyxJQUFJLFdBQVcsS0FBSyxPQUFPLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUs7UUFDbkMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsUUFBUTtZQUFFLFFBQVEsR0FBRywwQkFBMEIsQ0FBQztRQUNyRCxJQUFJLElBQUksR0FBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxJQUFJO1lBQUUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztRQUNqRixNQUFNLEtBQUssR0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sRUFBRSxHQUFRLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hDLE1BQU0sS0FBSyxHQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxLQUFLLEdBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksR0FBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDcEQsSUFBSSxRQUFRLENBQUM7UUFDYixJQUFJLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7YUFBTSxDQUFDO1lBQ0osUUFBUSxHQUFHLElBQUksQ0FBQztRQUNwQixDQUFDO1FBQ0QsNkVBQTZFO1FBQzdFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUN2RCxNQUFNLEdBQUcsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsTUFBTSxJQUFJLEdBQUc7WUFDVCxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWTtZQUMxRCxRQUFRLEVBQUUsR0FBRztTQUNoQixDQUFDO1FBQ0YsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDM0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckMsdUVBQXVFO1FBQ3ZFLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztDQUNKO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7dURBK0J1RDtBQUV2RCxFQUFFO0FBQ0YsaURBQWlEO0FBQ2pELDBCQUEwQjtBQUMxQiwwQkFBMEI7QUFDMUIscUJBQXFCO0FBQ3JCLEVBQUU7QUFDRixNQUFNLGNBQWUsU0FBUSxNQUFNO0lBQy9CLElBQUksUUFBUSxLQUFLLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQzVDLElBQUksV0FBVyxLQUFLLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBRS9DLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNuQixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxNQUFNLEVBQUUsR0FBTSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLE1BQU0sRUFBRSxHQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN4QixDQUFDLENBQUMsS0FBSyxDQUFDO1FBRXBCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFFcEIsT0FBTyxLQUFLLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDakQsbURBQW1EO1lBQ25ELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2RCxtQkFBbUI7WUFDbkIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEIsMENBQTBDO1lBQzFDLE9BQU8sUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXhCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUN2QixLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLEtBQUssT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksRUFBRTtZQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztZQUMzQixRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksS0FBSztZQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsS0FBSyxJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUMxQixRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7Q0FDSjtBQUVELE1BQU0sYUFBYyxTQUFRLE1BQU07SUFDOUIsSUFBSSxRQUFRLEtBQUssT0FBTyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7SUFDdkQsSUFBSSxXQUFXLEtBQUssT0FBTyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7SUFFMUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ25DLElBQUksSUFBSSxHQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUN2RCw2QkFBNkI7UUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDO1FBQ2pELDBCQUEwQjtRQUMxQixvREFBb0Q7UUFDcEQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2xELElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxvQkFBb0I7Z0JBQUUsT0FBTyxJQUFJLENBQUM7WUFDdkQsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1lBRWpDOzs7Z0JBR0k7WUFFSiw4QkFBOEI7WUFFOUIsMkNBQTJDO1lBQzNDLGlFQUFpRTtZQUNqRSxxRUFBcUU7WUFDckUscURBQXFEO1lBRXJELDJDQUEyQztZQUMzQyxvREFBb0Q7WUFDcEQsMENBQTBDO1lBQzFDLHVEQUF1RDtZQUN2RCx5REFBeUQ7WUFDekQsRUFBRTtZQUNGLDhEQUE4RDtZQUM5RCx1Q0FBdUM7WUFDdkMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFFNUIsSUFBSSxZQUFZLENBQUM7WUFFakIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLFlBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQy9FLHNFQUFzRTtZQUMxRSxDQUFDO2lCQUFNLENBQUM7Z0JBQ0osWUFBWSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7WUFDbEMsQ0FBQztZQUVELCtEQUErRDtZQUMvRCxtREFBbUQ7WUFDbkQsZ0VBQWdFO1lBQ2hFLEVBQUU7WUFDRixXQUFXO1lBQ1gsRUFBRTtZQUNGLGtEQUFrRDtZQUNsRCx1RUFBdUU7WUFDdkUsb0RBQW9EO1lBQ3BELG1EQUFtRDtZQUNuRCxpREFBaUQ7WUFDakQsaURBQWlEO1lBQ2pELDJCQUEyQjtZQUMzQixFQUFFO1lBRUYsNkJBQTZCO1lBQzdCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsbUJBQW1CO21CQUN0QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLElBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQy9ELEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM1Qiw2R0FBNkc7WUFDakgsQ0FBQztZQUVELG9DQUFvQztZQUNwQyxJQUFJLFVBQVUsQ0FBQztZQUNmLElBQUksQ0FBQztnQkFDRCxVQUFVLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNULFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDM0IsQ0FBQztZQUNELElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQyw4QkFBOEI7Z0JBQzVDLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCx1SEFBdUg7WUFFdkgsa0NBQWtDO1lBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUNyRCxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRUQsZ0RBQWdEO1lBQ2hELElBQUksQ0FBQyxRQUFRLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksUUFBUSxLQUFLLFlBQVksQ0FBQzttQkFDM0QsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLG9IQUFvSDtnQkFDcEgsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUVELGtDQUFrQztZQUNsQyxJQUFJLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0MscUZBQXFGO1lBQ3JGLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDVCx1SkFBdUo7Z0JBQ3ZKLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFDRCwySEFBMkg7WUFFM0gsaUZBQWlGO1lBQ2pGLDJGQUEyRjtZQUMzRix5QkFBeUI7WUFDekIsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUN0SCxDQUFDO1lBQ0wsQ0FBQztZQUNELG1EQUFtRDtZQUVuRCxJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1lBQ2hDLHVDQUF1QztZQUN2QyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNuRCxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsQ0FBQztZQUNELElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDOUIsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckIsQ0FBQztZQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQTBCRTtRQUNOLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxJQUFJLENBQUM7UUFDaEIsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQUVELDBDQUEwQztBQUUxQzs7O0dBR0c7QUFDSCxNQUFNLGlCQUFrQixTQUFRLE1BQU07SUFDbEMsSUFBSSxRQUFRLEtBQUssT0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDaEQsSUFBSSxXQUFXLEtBQUssT0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDbkQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFrQixFQUFFLElBQWU7UUFDcEUseUJBQXlCO1FBQ3pCLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUIsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0NBQ0o7QUFFRCxrQ0FBa0M7QUFFbEMscUVBQXFFO0FBRXJFLE1BQU0sb0JBQW9CO0lBS3RCLFlBQVksTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXO1FBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUUvQiw0SEFBNEg7SUFDaEksQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUs7UUFDdEIsa0RBQWtEO1FBQ2xELElBQUksQ0FBQztZQUNELG9CQUFvQjtZQUNwQixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7WUFHN0IsNERBQTREO1lBQzVELDREQUE0RDtZQUM1RCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXZDLGlFQUFpRTtZQUNqRSxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV2RCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUU5QiwwQ0FBMEM7WUFDMUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEQsQ0FBQztJQUNMLENBQUM7SUFFRCxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1FBQ25CLGdFQUFnRTtRQUNoRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQUEsQ0FBQztDQUNMO0FBRUQsTUFBTSx5QkFBeUI7SUFLM0IsWUFBWSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVc7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBRS9CLGlJQUFpSTtJQUNySSxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSztRQUN0Qix1REFBdUQ7UUFDdkQsSUFBSSxDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7SUFDTCxDQUFDO0lBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtRQUNuQixxRUFBcUU7UUFDckUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQUEsQ0FBQztDQUNMO0FBRUQsTUFBTSx5QkFBeUI7SUFLM0IsWUFBWSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVc7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBRS9CLGlJQUFpSTtJQUNySSxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSztRQUN0Qix1REFBdUQ7UUFDdkQsSUFBSSxDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7SUFDTCxDQUFDO0lBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtRQUNuQixxRUFBcUU7UUFDckUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQUEsQ0FBQztDQUNMO0FBRUQsU0FBUyxhQUFhO0lBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBRSxXQUFXLENBQUUsQ0FBQztJQUU1QixJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLO1FBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUM7WUFDRCxvQkFBb0I7WUFDcEIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBRzdCLDREQUE0RDtZQUM1RCw0REFBNEQ7WUFDNUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV2QyxpRUFBaUU7WUFDakUsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM1RCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFFckIsSUFBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuQyxTQUFTLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUU5QiwwQ0FBMEM7WUFDMUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUM7SUFDTCxDQUFDLENBQUM7SUFHRixJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQyxDQUFDO0FBRU4sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgZnNwIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gJ3V1aWQnO1xuY29uc3QgdXVpZHYxID0gdXVpZC52MTtcbmltcG9ydCAqIGFzIHJlbmRlciBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5pbXBvcnQgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuaW1wb3J0IGhsanMgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmltcG9ydCBtYWhhTWV0YWRhdGEgZnJvbSAnbWFoYWJodXRhL21haGEvbWV0YWRhdGEuanMnO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuaW1wb3J0IFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge2VuY29kZX0gZnJvbSAnaHRtbC1lbnRpdGllcyc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBDdXN0b21FbGVtZW50LCBNdW5nZXIsIFBhZ2VQcm9jZXNzb3IsIGphdmFTY3JpcHRJdGVtIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5cbmNvbnN0IHBsdWdpbk5hbWUgPSBcImFrYXNoYWNtcy1idWlsdGluXCI7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdEluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIocGx1Z2luTmFtZSk7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZSA9IFtdO1xuXG5cdH1cblxuICAgICNjb25maWc7XG4gICAgI3Jlc2l6ZV9xdWV1ZTtcblxuXHRjb25maWd1cmUoY29uZmlnOiBDb25maWd1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtb2R1bGVEaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbiAgICAgICAgLy8gTmVlZCB0aGlzIGFzIHRoZSBwbGFjZSB0byBzdG9yZSBOdW5qdWNrcyBtYWNyb3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICBjb25maWcuYWRkTGF5b3V0c0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ2xheW91dHMnKSk7XG4gICAgICAgIGNvbmZpZy5hZGRQYXJ0aWFsc0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ3BhcnRpYWxzJykpO1xuICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gdGhlIENvbmZpZ3VyYXRpb24gY29uc3RydWN0b3IuICBUaGUgaWRlYSBpcyB0byBwdXRcbiAgICAgICAgLy8gbWFoYVBhcnRpYWwgYXMgdGhlIHZlcnkgZmlyc3QgTWFoYWZ1bmMgc28gdGhhdCBhbGxcbiAgICAgICAgLy8gUGFydGlhbCdzIGFyZSBoYW5kbGVkIGJlZm9yZSBhbnl0aGluZyBlbHNlLiAgVGhlIGlzc3VlIGNhdXNpbmdcbiAgICAgICAgLy8gdGhpcyBjaGFuZ2UgaXMgdGhlIE9wZW5HcmFwaFByb21vdGVJbWFnZXMgTWFoYWZ1bmMgaW5cbiAgICAgICAgLy8gYWthc2hhY2hzLWJhc2UgYW5kIHByb2Nlc3NpbmcgYW55IGltYWdlcyBicm91Z2h0IGluIGJ5IHBhcnRpYWxzLlxuICAgICAgICAvLyBFbnN1cmluZyB0aGUgcGFydGlhbCB0YWcgaXMgcHJvY2Vzc2VkIGJlZm9yZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzXG4gICAgICAgIC8vIG1lYW50IHN1Y2ggaW1hZ2VzIHdlcmUgcHJvcGVybHkgcHJvbW90ZWQuXG4gICAgICAgIC8vIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAvLyAgICAgcmVuZGVyUGFydGlhbDogb3B0aW9ucy5yZW5kZXJQYXJ0aWFsXG4gICAgICAgIC8vIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhTWV0YWRhdGEubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgLy8gRG8gbm90IHBhc3MgdGhpcyB0aHJvdWdoIHNvIHRoYXQgTWFoYWJodXRhIHdpbGwgbm90XG4gICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIGxpbmtzIHRvIHN1YmRpcmVjdG9yaWVzXG4gICAgICAgICAgICAvLyByb290X3VybDogY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICAvLyBUT0RPIGhvdyB0byBjb25maWd1cmUgdGhpc1xuICAgICAgICAgICAgLy8gc2l0ZW1hcF90aXRsZTogLi4uLj9cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFiaHV0YUFycmF5KG9wdGlvbnMsIGNvbmZpZywgdGhpcy5ha2FzaGEsIHRoaXMpKTtcblxuICAgICAgICBjb25zdCBuamsgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJOYW1lKCcuaHRtbC5uamsnKSBhcyBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICBuZXcgc3R5bGVzaGVldHNFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtoZWFkZXJqcycsXG4gICAgICAgICAgICBuZXcgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2Zvb3RlcmpzJyxcbiAgICAgICAgICAgIG5ldyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIGV4dGVuc2lvbnMgd2VyZSBpbnN0YWxsZWRcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgW1xuICAgICAgICAgICAgICAgICAgICAnYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICAgICAgICAgICdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FrZm9vdGVyanMnXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbihleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmUgLSBOSksgZG9lcyBub3QgaGF2ZSBleHRlbnNpb24gLSAke2V4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gdHJ5IHtcbiAgICAgICAgLy8gICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrbmprdGVzdCcsIG5ldyB0ZXN0RXh0ZW5zaW9uKCkpO1xuICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKCkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIFxuICAgICAgICAvLyBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oJ2FrbmprdGVzdCcpKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBha25qa3Rlc3QgZXh0ZW5zaW9uIG5vdCBhZGRlZD9gKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgZXhpc3RzYCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgLy8gZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG5cbiAgICBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8bGluaz4gdGFncyBpbiB0aGUgPGhlYWQ+IGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplSGVhZExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8c2NyaXB0PiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplU2NyaXB0TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPEE+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVCb2R5TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIGRvU3R5bGVzaGVldHMobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgYWRkSW1hZ2VUb1Jlc2l6ZShzcmM6IHN0cmluZywgcmVzaXpld2lkdGg6IG51bWJlciwgcmVzaXpldG86IHN0cmluZywgZG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGRJbWFnZVRvUmVzaXplICR7c3JjfSByZXNpemV3aWR0aCAke3Jlc2l6ZXdpZHRofSByZXNpemV0byAke3Jlc2l6ZXRvfWApXG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgb25TaXRlUmVuZGVyZWQoY29uZmlnKSB7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIHdoaWxlIChBcnJheS5pc0FycmF5KHRoaXMuI3Jlc2l6ZV9xdWV1ZSlcbiAgICAgICAgICAgICYmIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5sZW5ndGggPiAwKSB7XG5cbiAgICAgICAgICAgIGxldCB0b3Jlc2l6ZSA9IHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wb3AoKTtcblxuICAgICAgICAgICAgbGV0IGltZzJyZXNpemU7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZSh0b3Jlc2l6ZS5zcmMpKSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICB0b3Jlc2l6ZS5zcmNcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHRvcmVzaXplLnNyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNyY2ZpbGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGFzc2V0cy5maW5kKGltZzJyZXNpemUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kLmZzcGF0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgICAgICBzcmNmaWxlID0gZm91bmQgPyBmb3VuZC5mc3BhdGggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNyY2ZpbGUpIHRocm93IG5ldyBFcnJvcihgYWthc2hhY21zLWJ1aWx0aW46IERpZCBub3QgZmluZCBzb3VyY2UgZmlsZSBmb3IgaW1hZ2UgdG8gcmVzaXplICR7aW1nMnJlc2l6ZX1gKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgaW1nID0gYXdhaXQgc2hhcnAoc3JjZmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWQgPSBhd2FpdCBpbWcucmVzaXplKE51bWJlci5wYXJzZUludCh0b3Jlc2l6ZS5yZXNpemV3aWR0aCkpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgY29ycmVjdCBkZXN0aW5hdGlvbiBwYXRoXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSByZXNpemVkIGltYWdlXG4gICAgICAgICAgICAgICAgbGV0IGltZ3RvcmVzaXplID0gdG9yZXNpemUucmVzaXpldG8gPyB0b3Jlc2l6ZS5yZXNpemV0byA6IGltZzJyZXNpemU7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWRlc3Q7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShpbWd0b3Jlc2l6ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGZvciByZWxhdGl2ZSBpbWFnZSBwYXRocywgaGVuY2UgaXQgbmVlZHMgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGRvY1BhdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyRGVzdGluYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlc2l6ZWRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXNpemVkLnRvRmlsZShyZXNpemVkZXN0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJ1aWx0LWluOiBJbWFnZSByZXNpemUgZmFpbGVkIGZvciAke3NyY2ZpbGV9ICh0b3Jlc2l6ZSAke3V0aWwuaW5zcGVjdCh0b3Jlc2l6ZSl9IGZvdW5kICR7dXRpbC5pbnNwZWN0KGZvdW5kKX0pIGJlY2F1c2UgJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBtYWhhYmh1dGFBcnJheSA9IGZ1bmN0aW9uKFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGNvbmZpZz86IENvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBha2FzaGE/OiBhbnksXG4gICAgICAgICAgICBwbHVnaW4/OiBQbHVnaW5cbikge1xuICAgIGxldCByZXQgPSBuZXcgbWFoYWJodXRhLk1haGFmdW5jQXJyYXkocGx1Z2luTmFtZSwgb3B0aW9ucyk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTdHlsZXNoZWV0c0VsZW1lbnQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZGVySmF2YVNjcmlwdChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGb290ZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEhlYWRMaW5rUmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2NyaXB0UmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW5zZXJ0VGVhc2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IENvZGVFbWJlZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBpbWcyZmlndXJlSW1hZ2UoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTaG93Q29udGVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTZWxlY3RFbGVtZW50cyhjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBbmNob3JDbGVhbnVwKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBNdW5nZWRBdHRyUmVtb3Zlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gX2RvU3R5bGVzaGVldHMobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3V0aWwuaW5zcGVjdChtZXRhZGF0YSl9YCk7XG5cbiAgICB2YXIgc2NyaXB0cztcbiAgICBpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cy5jb25jYXQobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgYWstc3R5bGVzaGVldHMgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCl9ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX0gJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvU3R5bGVzaGVldHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIGNvbmZpZycpO1xuXG4gICAgdmFyIHJldCA9ICcnO1xuICAgIGlmICh0eXBlb2Ygc2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yICh2YXIgc3R5bGUgb2Ygc2NyaXB0cykge1xuXG4gICAgICAgICAgICBsZXQgc3R5bGVocmVmID0gc3R5bGUuaHJlZjtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoc3R5bGUuaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHByb2Nlc3MgJHtzdHlsZWhyZWZ9YCk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGJpdCB3aXRoICdodHRwOi8vZXhhbXBsZS5jb20nIG1lYW5zIHRoZXJlXG4gICAgICAgICAgICAgICAgLy8gd29uJ3QgYmUgYW4gZXhjZXB0aW9uIHRocm93biBmb3IgYSBsb2NhbCBVUkwuXG4gICAgICAgICAgICAgICAgLy8gQnV0LCBpbiBzdWNoIGEgY2FzZSwgdUhyZWYucGF0aG5hbWUgd291bGRcbiAgICAgICAgICAgICAgICAvLyBzdGFydCB3aXRoIGEgc2xhc2guICBUaGVyZWZvcmUsIHRvIGNvcnJlY3RseVxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiB0aGlzIFVSTCBpcyBhYnNvbHV0ZSB3ZSBtdXN0IGNoZWNrXG4gICAgICAgICAgICAgICAgLy8gd2l0aCB0aGUgb3JpZ2luYWwgVVJMIHN0cmluZywgd2hpY2ggaXMgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgc3R5bGVocmVmIHZhcmlhYmxlLlxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHN0eWxlaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlRgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVCBSRU5ERVJUT2ApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHJlbGF0aXZlKC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfSwgJHtzdHlsZWhyZWZ9KSA9ICR7cmVsYXRpdmUoJy8nK21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvLCBzdHlsZWhyZWYpfWApXG4gICAgICAgICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3R5bGVocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIGFic29sdXRlIHN0eWxlaHJlZiAke3N0eWxlaHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRvU3R5bGVNZWRpYSA9IChtZWRpYSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtZWRpYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYG1lZGlhPVwiJHtlbmNvZGUobWVkaWEpfVwiYFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IGh0ID0gYDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiJHtlbmNvZGUoc3R5bGVocmVmKX1cIiAke2RvU3R5bGVNZWRpYShzdHlsZS5tZWRpYSl9Lz5gXG4gICAgICAgICAgICByZXQgKz0gaHQ7XG5cbiAgICAgICAgICAgIC8vIFRoZSBpc3N1ZSB3aXRoIHRoaXMgYW5kIG90aGVyIGluc3RhbmNlc1xuICAgICAgICAgICAgLy8gaXMgdGhhdCB0aGlzIHRlbmRlZCB0byByZXN1bHQgaW5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgIDxodG1sPjxib2R5PjxsaW5rLi4+PC9ib2R5PjwvaHRtbD5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXaGVuIGl0IG5lZWRlZCB0byBqdXN0IGJlIHRoZSA8bGluaz4gdGFnLlxuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIGl0IHRyaWVkIHRvIGNyZWF0ZSBhbiBlbnRpcmVcbiAgICAgICAgICAgIC8vIEhUTUwgZG9jdW1lbnQuICBXaGlsZSB0aGVyZSB3YXMgYSB3YXkgYXJvdW5kXG4gICAgICAgICAgICAvLyB0aGlzIC0gJCgnc2VsZWN0b3InKS5wcm9wKCdvdXRlckhUTUwnKVxuICAgICAgICAgICAgLy8gVGhpcyBhbHNvIHNlZW1lZCB0byBiZSBhbiBvdmVyaGVhZFxuICAgICAgICAgICAgLy8gd2UgY2FuIGF2b2lkLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoZSBwYXR0ZXJuIGlzIHRvIHVzZSBUZW1wbGF0ZSBTdHJpbmdzIHdoaWxlXG4gICAgICAgICAgICAvLyBiZWluZyBjYXJlZnVsIHRvIGVuY29kZSB2YWx1ZXMgc2FmZWx5IGZvciB1c2VcbiAgICAgICAgICAgIC8vIGluIGFuIGF0dHJpYnV0ZS4gIFRoZSBcImVuY29kZVwiIGZ1bmN0aW9uIGRvZXNcbiAgICAgICAgICAgIC8vIHRoZSBlbmNvZGluZy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzQ5XG5cbiAgICAgICAgICAgIC8vIGxldCAkID0gbWFoYWJodXRhLnBhcnNlKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIlwiLz4nKTtcbiAgICAgICAgICAgIC8vICQoJ2xpbmsnKS5hdHRyKCdocmVmJywgc3R5bGVocmVmKTtcbiAgICAgICAgICAgIC8vIGlmIChzdHlsZS5tZWRpYSkge1xuICAgICAgICAgICAgLy8gICAgICQoJ2xpbmsnKS5hdHRyKCdtZWRpYScsIHN0eWxlLm1lZGlhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIHJldCArPSAkLmh0bWwoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHtyZXR9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0phdmFTY3JpcHRzKFxuICAgIG1ldGFkYXRhLFxuICAgIHNjcmlwdHM6IGphdmFTY3JpcHRJdGVtW10sXG4gICAgb3B0aW9ucyxcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb25cbikge1xuXHR2YXIgcmV0ID0gJyc7XG5cdGlmICghc2NyaXB0cykgcmV0dXJuIHJldDtcblxuICAgIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdfZG9KYXZhU2NyaXB0cyBubyBvcHRpb25zJyk7XG4gICAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gY29uZmlnJyk7XG5cbiAgICBmb3IgKHZhciBzY3JpcHQgb2Ygc2NyaXB0cykge1xuXHRcdGlmICghc2NyaXB0LmhyZWYgJiYgIXNjcmlwdC5zY3JpcHQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTXVzdCBzcGVjaWZ5IGVpdGhlciBocmVmIG9yIHNjcmlwdCBpbiAke3V0aWwuaW5zcGVjdChzY3JpcHQpfWApO1xuXHRcdH1cbiAgICAgICAgaWYgKCFzY3JpcHQuc2NyaXB0KSBzY3JpcHQuc2NyaXB0ID0gJyc7XG5cbiAgICAgICAgY29uc3QgZG9UeXBlID0gKGxhbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGB0eXBlPVwiJHtlbmNvZGUobGFuZyl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9IcmVmID0gKGhyZWYpID0+IHtcbiAgICAgICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjcmlwdGhyZWYgPSBocmVmO1xuICAgICAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzXG4gICAgICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzY3JpcHRocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc2NyaXB0aHJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvSmF2YVNjcmlwdHMgYWJzb2x1dGUgc2NyaXB0aHJlZiAke3NjcmlwdGhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYHNyYz1cIiR7ZW5jb2RlKHNjcmlwdGhyZWYpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgaHQgPSBgPHNjcmlwdCAke2RvVHlwZShzY3JpcHQubGFuZyl9ICR7ZG9IcmVmKHNjcmlwdC5ocmVmKX0+JHtzY3JpcHQuc2NyaXB0fTwvc2NyaXB0PmA7XG4gICAgICAgIHJldCArPSBodDtcbiAgICB9XG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AuY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3ApO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AgOiB1bmRlZmluZWQ7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coYF9kb0hlYWRlckphdmFTY3JpcHQgJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX1gKTtcblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zLCBjb25maWcpO1xufVxuXG5mdW5jdGlvbiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tIDogdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuY2xhc3MgU3R5bGVzaGVldHNFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstc3R5bGVzaGVldHNcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pIHtcblx0XHRsZXQgcmV0ID0gIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFN0eWxlc2hlZXRzRWxlbWVudCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEhlYWRlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1oZWFkZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9IF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgSGVhZGVySmF2YVNjcmlwdCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEZvb3RlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1mb290ZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuXHR9XG59XG5cbmNsYXNzIEhlYWRMaW5rUmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cbiAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYW4gYWJzb2x1dGUgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgU2NyaXB0UmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignc3JjJyk7XG5cbiAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgbGlua1xuICAgICAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgSW5zZXJ0VGVhc2VyIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGVhc2VyXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWtfdGVhc2VyLmh0bWwubmprXCIsIHtcblx0XHRcdHRlYXNlcjogdHlwZW9mIG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdICE9PSBcInVuZGVmaW5lZFwiXG5cdFx0XHRcdD8gbWV0YWRhdGFbXCJhay10ZWFzZXJcIl0gOiBtZXRhZGF0YS50ZWFzZXJcblx0XHR9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW5zZXJ0VGVhc2VyIGNhdWdodCBlcnJvciBgLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cblx0fVxufVxuXG5jbGFzcyBBa0JvZHlDbGFzc0FkZCBleHRlbmRzIFBhZ2VQcm9jZXNzb3Ige1xuXHRhc3luYyBwcm9jZXNzKCQsIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0aWYgKHR5cGVvZiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPT0gJ3VuZGVmaW5lZCdcblx0XHQgJiYgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT0gJydcblx0XHQgJiYgJCgnaHRtbCBib2R5JykuZ2V0KDApKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRpZiAoISQoJ2h0bWwgYm9keScpLmhhc0NsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKSkge1xuXHRcdFx0XHRcdCQoJ2h0bWwgYm9keScpLmFkZENsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKHVuZGVmaW5lZCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2UgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnJyk7XG5cdH1cbn1cblxuY2xhc3MgQ29kZUVtYmVkIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjb2RlLWVtYmVkXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICRlbGVtZW50LmF0dHIoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgICAgIGlmICghZm4gfHwgZm4gPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgbXVzdCBoYXZlIGZpbGUtbmFtZSBhcmd1bWVudCwgZ290ICR7Zm59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHh0cGF0aDtcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmbikpIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBmbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHR4dHBhdGgpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgZmlsZS1uYW1lICR7Zm59IGRvZXMgbm90IHJlZmVyIHRvIHVzYWJsZSBmaWxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIGNvbnN0IGRvTGFuZyA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgY2xhc3M9XCJobGpzICR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdjbGFzcz1cImhsanNcIic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGRvSUQgPSAoaWQpID0+IHtcbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaWQ9XCIke2VuY29kZShpZCl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9Db2RlID0gKGxhbmcsIGNvZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQoY29kZSwge1xuICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAgICAgICAgIH0pLnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHRBdXRvKGNvZGUpLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCByZXQgPSBgPHByZSAke2RvSUQoaWQpfT48Y29kZSAke2RvTGFuZyhsYW5nKX0+JHtkb0NvZGUobGFuZywgdHh0KX08L2NvZGU+PC9wcmU+YDtcbiAgICAgICAgcmV0dXJuIHJldDtcblxuICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZShgPHByZT48Y29kZT48L2NvZGU+PC9wcmU+YCk7XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYWRkQ2xhc3MobGFuZyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gJCgnY29kZScpLmFkZENsYXNzKCdobGpzJyk7XG4gICAgICAgIC8vIGlmIChpZCAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgLy8gICAgICQoJ3ByZScpLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0KHR4dCwge1xuICAgICAgICAvLyAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgIC8vICAgICB9KS52YWx1ZSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0QXV0byh0eHQpLnZhbHVlKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyByZXR1cm4gJC5odG1sKCk7XG4gICAgfVxufVxuXG5jbGFzcyBGaWd1cmVJbWFnZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiZmlnLWltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX2ZpZ2ltZy5odG1sLm5qayc7XG4gICAgICAgIGNvbnN0IGhyZWYgICAgPSAkZWxlbWVudC5hdHRyKCdocmVmJyk7XG4gICAgICAgIGlmICghaHJlZikgdGhyb3cgbmV3IEVycm9yKCdmaWctaW1nIG11c3QgcmVjZWl2ZSBhbiBocmVmJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3RcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBpbWcyZmlndXJlSW1hZ2UgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGltZ1tmaWd1cmVdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKSBcbiAgICAgICAgICAgICAgICA/ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJylcbiAgICAgICAgICAgICAgICA6ICBcImFrX2ZpZ2ltZy5odG1sLm5qa1wiO1xuICAgICAgICBjb25zdCBpZCA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCB3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHNyYyA9ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCdjYXB0aW9uJylcbiAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaWQsIGNsYXp6LCBzdHlsZSwgd2lkdGgsIGhyZWY6IHNyYywgZGVzdCwgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLFxuICAgICAgICAgICAgY2FwdGlvbjogY29udGVudFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIEltYWdlUmV3cml0ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgaW1nXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuXG4gICAgICAgIC8vIFdlIG9ubHkgZG8gcmV3cml0ZXMgZm9yIGxvY2FsIGltYWdlc1xuICAgICAgICBsZXQgc3JjID0gJGxpbmsuYXR0cignc3JjJyk7XG4gICAgICAgIC8vIEZvciBsb2NhbCBVUkxzLCB0aGlzIG5ldyBVUkwgY2FsbCB3aWxsXG4gICAgICAgIC8vIG1ha2UgdVNyYy5vcmlnaW4gPT09IGh0dHA6Ly9leGFtcGxlLmNvbVxuICAgICAgICAvLyBIZW5jZSwgaWYgc29tZSBvdGhlciBkb21haW4gYXBwZWFyc1xuICAgICAgICAvLyB0aGVuIHdlIGtvbncgaXQncyBub3QgYSBsb2NhbCBpbWFnZS5cbiAgICAgICAgY29uc3QgdVNyYyA9IG5ldyBVUkwoc3JjLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1U3JjLm9yaWdpbiAhPT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFyZSB3ZSBhc2tlZCB0byByZXNpemUgdGhlIGltYWdlP1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJlc2l6ZXdpZHRoKSB7XG4gICAgICAgICAgICAvLyBBZGQgdG8gYSBxdWV1ZSB0aGF0IGlzIHJ1biBhdCB0aGUgZW5kIFxuICAgICAgICAgICAgdGhpcy5jb25maWcucGx1Z2luKHBsdWdpbk5hbWUpXG4gICAgICAgICAgICAgICAgLmFkZEltYWdlVG9SZXNpemUoc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKTtcblxuICAgICAgICAgICAgaWYgKHJlc2l6ZXRvKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgcmVzaXpldG8pO1xuICAgICAgICAgICAgICAgIHNyYyA9IHJlc2l6ZXRvO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGVzZSBhcmUgbm8gbG9uZ2VyIG5lZWRlZFxuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBpZGVhIGhlcmUgaXMgZm9yIGV2ZXJ5IGxvY2FsIGltYWdlIHNyYyB0byBiZSBhIHJlbGF0aXZlIFVSTFxuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKHNyYykpIHtcbiAgICAgICAgICAgIGxldCBuZXdTcmMgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3JjKTtcbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld1NyYyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgSW1hZ2VSZXdyaXRlciBhYnNvbHV0ZSBpbWFnZSBwYXRoICR7c3JjfSByZXdyb3RlIHRvICR7bmV3U3JjfWApO1xuICAgICAgICAgICAgc3JjID0gbmV3U3JjO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICB9XG59XG5cbmNsYXNzIFNob3dDb250ZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGxldCBkb2MycmVhZDtcbiAgICAgICAgaWYgKCEgaHJlZi5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIGxldCBkaXIgPSBwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucGF0aCk7XG4gICAgICAgICAgICBkb2MycmVhZCA9IHBhdGguam9pbignLycsIGRpciwgaHJlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2MycmVhZCA9IGhyZWY7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gJHtkb2MycmVhZH1gKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBkb2N1bWVudHMuZmluZChkb2MycmVhZCk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdCwgY29udGVudEltYWdlLFxuICAgICAgICAgICAgZG9jdW1lbnQ6IGRvY1xuICAgICAgICB9O1xuICAgICAgICBsZXQgcmV0ID0gYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIGRhdGEpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2hvd0NvbnRlbnQgJHtocmVmfSAke3V0aWwuaW5zcGVjdChkYXRhKX0gPT0+ICR7cmV0fWApO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbn1cblxuLypcblxuVGhpcyB3YXMgbW92ZWQgaW50byBNYWhhYmh1dGFcblxuIGNsYXNzIFBhcnRpYWwgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwicGFydGlhbFwiOyB9XG5cdHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdC8vIFdlIGRlZmF1bHQgdG8gbWFraW5nIHBhcnRpYWwgc2V0IHRoZSBkaXJ0eSBmbGFnLiAgQnV0IGEgdXNlclxuXHRcdC8vIG9mIHRoZSBwYXJ0aWFsIHRhZyBjYW4gY2hvb3NlIHRvIHRlbGwgdXMgaXQgaXNuJ3QgZGlydHkuXG5cdFx0Ly8gRm9yIGV4YW1wbGUsIGlmIHRoZSBwYXJ0aWFsIG9ubHkgc3Vic3RpdHV0ZXMgbm9ybWFsIHRhZ3Ncblx0XHQvLyB0aGVyZSdzIG5vIG5lZWQgdG8gZG8gdGhlIGRpcnR5IHRoaW5nLlxuXHRcdHZhciBkb3RoZWRpcnR5dGhpbmcgPSAkZWxlbWVudC5hdHRyKCdkaXJ0eScpO1xuXHRcdGlmICghZG90aGVkaXJ0eXRoaW5nIHx8IGRvdGhlZGlydHl0aGluZy5tYXRjaCgvdHJ1ZS9pKSkge1xuXHRcdFx0ZGlydHkoKTtcblx0XHR9XG5cdFx0dmFyIGZuYW1lID0gJGVsZW1lbnQuYXR0cihcImZpbGUtbmFtZVwiKTtcblx0XHR2YXIgdHh0ICAgPSAkZWxlbWVudC5odG1sKCk7XG5cdFx0dmFyIGQgPSB7fTtcblx0XHRmb3IgKHZhciBtcHJvcCBpbiBtZXRhZGF0YSkgeyBkW21wcm9wXSA9IG1ldGFkYXRhW21wcm9wXTsgfVxuXHRcdHZhciBkYXRhID0gJGVsZW1lbnQuZGF0YSgpO1xuXHRcdGZvciAodmFyIGRwcm9wIGluIGRhdGEpIHsgZFtkcHJvcF0gPSBkYXRhW2Rwcm9wXTsgfVxuXHRcdGRbXCJwYXJ0aWFsQm9keVwiXSA9IHR4dDtcblx0XHRsb2coJ3BhcnRpYWwgdGFnIGZuYW1lPScrIGZuYW1lICsnIGF0dHJzICcrIHV0aWwuaW5zcGVjdChkYXRhKSk7XG5cdFx0cmV0dXJuIHJlbmRlci5wYXJ0aWFsKHRoaXMuY29uZmlnLCBmbmFtZSwgZClcblx0XHQudGhlbihodG1sID0+IHsgcmV0dXJuIGh0bWw7IH0pXG5cdFx0LmNhdGNoKGVyciA9PiB7XG5cdFx0XHRlcnJvcihuZXcgRXJyb3IoXCJGQUlMIHBhcnRpYWwgZmlsZS1uYW1lPVwiKyBmbmFtZSArXCIgYmVjYXVzZSBcIisgZXJyKSk7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGQUlMIHBhcnRpYWwgZmlsZS1uYW1lPVwiKyBmbmFtZSArXCIgYmVjYXVzZSBcIisgZXJyKTtcblx0XHR9KTtcblx0fVxufVxubW9kdWxlLmV4cG9ydHMubWFoYWJodXRhLmFkZE1haGFmdW5jKG5ldyBQYXJ0aWFsKCkpOyAqL1xuXG4vL1xuLy8gPHNlbGVjdC1lbGVtZW50cyBjbGFzcz1cIi4uXCIgaWQ9XCIuLlwiIGNvdW50PVwiTlwiPlxuLy8gICAgIDxlbGVtZW50PjwvZWxlbWVudD5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyA8L3NlbGVjdC1lbGVtZW50cz5cbi8vXG5jbGFzcyBTZWxlY3RFbGVtZW50cyBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwic2VsZWN0LWVsZW1lbnRzXCI7IH1cblxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGxldCBjb3VudCA9ICRsaW5rLmF0dHIoJ2NvdW50JylcbiAgICAgICAgICAgICAgICAgICAgPyBOdW1iZXIucGFyc2VJbnQoJGxpbmsuYXR0cignY291bnQnKSlcbiAgICAgICAgICAgICAgICAgICAgOiAxO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRsaW5rLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgID0gJGxpbmsuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgdG4gICAgPSAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgID8gJGxpbmsuYXR0cigndGFnLW5hbWUnKVxuICAgICAgICAgICAgICAgICAgICA6ICdkaXYnO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gJGxpbmsuY2hpbGRyZW4oKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSBbXTtcblxuICAgICAgICBmb3IgKDsgY291bnQgPj0gMSAmJiBjaGlsZHJlbi5sZW5ndGggPj0gMTsgY291bnQtLSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFNlbGVjdEVsZW1lbnRzIGAsIGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCBfbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhfbik7XG4gICAgICAgICAgICBjb25zdCBjaG9zZW4gPSAkKGNoaWxkcmVuW19uXSkuaHRtbCgpO1xuICAgICAgICAgICAgc2VsZWN0ZWQucHVzaChjaG9zZW4pO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFNlbGVjdEVsZW1lbnRzIGAsIGNob3Nlbik7XG4gICAgICAgICAgICBkZWxldGUgY2hpbGRyZW5bX25dO1xuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfdXVpZCA9IHV1aWR2MSgpO1xuICAgICAgICAkbGluay5yZXBsYWNlV2l0aChgPCR7dG59IGlkPScke191dWlkfSc+PC8ke3RufT5gKTtcbiAgICAgICAgY29uc3QgJG5ld0l0ZW0gPSAkKGAke3RufSMke191dWlkfWApO1xuICAgICAgICBpZiAoaWQpICRuZXdJdGVtLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICBlbHNlICRuZXdJdGVtLnJlbW92ZUF0dHIoJ2lkJyk7XG4gICAgICAgIGlmIChjbGF6eikgJG5ld0l0ZW0uYWRkQ2xhc3MoY2xhenopO1xuICAgICAgICBmb3IgKGxldCBjaG9zZW4gb2Ygc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICRuZXdJdGVtLmFwcGVuZChjaG9zZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuY2xhc3MgQW5jaG9yQ2xlYW51cCBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIGhyZWYgICAgID0gJGxpbmsuYXR0cignaHJlZicpO1xuICAgICAgICB2YXIgbGlua3RleHQgPSAkbGluay50ZXh0KCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke2hyZWZ9ICR7bGlua3RleHR9YCk7XG4gICAgICAgIGlmIChocmVmICYmIGhyZWYgIT09ICcjJykge1xuICAgICAgICAgICAgY29uc3QgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gIT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgaWYgKCF1SHJlZi5wYXRobmFtZSkgcmV0dXJuIFwib2tcIjtcblxuICAgICAgICAgICAgLyogaWYgKG1ldGFkYXRhLmRvY3VtZW50LnBhdGggPT09ICdpbmRleC5odG1sLm1kJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIG1ldGFkYXRhLmRvY3VtZW50LnBhdGggJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBocmVmICR7aHJlZn0gdUhyZWYucGF0aG5hbWUgJHt1SHJlZi5wYXRobmFtZX0gdGhpcy5jb25maWcucm9vdF91cmwgJHt0aGlzLmNvbmZpZy5yb290X3VybH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkLmh0bWwoKSk7XG4gICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAgIC8vIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGRldGVybWluZWQgdGhpcyBpcyBhIGxvY2FsIGhyZWYuXG4gICAgICAgICAgICAvLyBGb3IgcmVmZXJlbmNlIHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lIG9mIHRoZSBocmVmIHdpdGhpblxuICAgICAgICAgICAgLy8gdGhlIHByb2plY3QuICBGb3IgZXhhbXBsZSB0byByZXRyaWV2ZSB0aGUgdGl0bGUgd2hlbiB3ZSdyZSBmaWxsaW5nXG4gICAgICAgICAgICAvLyBpbiBmb3IgYW4gZW1wdHkgPGE+IHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lLlxuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgbGluayBhcyBoYXZpbmcgYmVlbiBwcm9jZXNzZWQuXG4gICAgICAgICAgICAvLyBUaGUgcHVycG9zZSBpcyBpZiBNYWhhYmh1dGEgcnVucyBtdWx0aXBsZSBwYXNzZXMsXG4gICAgICAgICAgICAvLyB0byBub3QgcHJvY2VzcyB0aGUgbGluayBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICAgIC8vIEJlZm9yZSBhZGRpbmcgdGhpcyAtIHdlIHNhdyB0aGlzIE11bmdlciB0YWtlIGFzIG11Y2hcbiAgICAgICAgICAgIC8vIGFzIDgwMG1zIHRvIGV4ZWN1dGUsIGZvciBFVkVSWSBwYXNzIG1hZGUgYnkgTWFoYWJodXRhLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGlzIGF0dHJpYnV0ZSwgYW5kIGNoZWNraW5nIGZvciBpdCBpbiB0aGUgc2VsZWN0b3IsXG4gICAgICAgICAgICAvLyBtZWFucyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGxpbmsgb25jZS5cbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ211bmdlZCcsICd5ZXMnKTtcblxuICAgICAgICAgICAgbGV0IGFic29sdXRlUGF0aDtcblxuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodUhyZWYucGF0aG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5wYXRoKSwgdUhyZWYucGF0aG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAqKioqKiBBbmNob3JDbGVhbnVwIEZJWEVEIGhyZWYgdG8gJHt1SHJlZi5wYXRobmFtZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gdUhyZWYucGF0aG5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gZW5zdXJlIGFsbCBsb2NhbCBocmVmJ3MgYXJlIFxuICAgICAgICAgICAgLy8gZm9yIGEgcmVsYXRpdmUgcGF0aCByYXRoZXIgdGhhbiBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSB1c2UgdGhlIHJlbGF0aXZlIG1vZHVsZSB0byBjb21wdXRlIHRoZSByZWxhdGl2ZSBwYXRoXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgL2luZGV4Lmh0bWwgaW4ge1xuICAgICAgICAgICAgLy8gIGJhc2VkaXI6ICcvVm9sdW1lcy9FeHRyYS9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL3Rlc3QvZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICByZWxwYXRoOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sLm1kJyxcbiAgICAgICAgICAgIC8vICByZWxyZW5kZXI6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnLFxuICAgICAgICAgICAgLy8gIHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbmRlclRvOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sJ1xuICAgICAgICAgICAgLy8gfSB0byAuLi8uLi8uLi9pbmRleC5odG1sXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzXG4gICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vayB0byBzZWUgaWYgaXQncyBhbiBhc3NldCBmaWxlXG4gICAgICAgICAgICBsZXQgZm91bmRBc3NldDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZEFzc2V0KSB7IC8vICYmIGZvdW5kQXNzZXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kQXNzZXQgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIEFzayBwbHVnaW5zIGlmIHRoZSBocmVmIGlzIG9rYXlcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5hc2tQbHVnaW5zTGVnaXRMb2NhbEhyZWYoYWJzb2x1dGVQYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgbGluayBoYXMgYSBib2R5LCB0aGVuIGRvbid0IG1vZGlmeSBpdFxuICAgICAgICAgICAgaWYgKChsaW5rdGV4dCAmJiBsaW5rdGV4dC5sZW5ndGggPiAwICYmIGxpbmt0ZXh0ICE9PSBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgfHwgKCRsaW5rLmNoaWxkcmVuKCkubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBza2lwcGluZyAke2Fic29sdXRlUGF0aH0gdy8gJHt1dGlsLmluc3BlY3QobGlua3RleHQpfSBjaGlsZHJlbj0gJHskbGluay5jaGlsZHJlbigpfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvZXMgaXQgZXhpc3QgaW4gZG9jdW1lbnRzIGRpcj9cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBmaW5kUmVuZGVyc1RvICR7YWJzb2x1dGVQYXRofSAke3V0aWwuaW5zcGVjdChmb3VuZCl9YCk7XG4gICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFdBUk5JTkc6IERpZCBub3QgZmluZCAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnLmRvY3VtZW50RGlycyl9IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gYWJzb2x1dGVQYXRoICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZFJlbmRlcnNUbyAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGRpcmVjdG9yeSwgdGhlcmUgbWlnaHQgYmUgL3BhdGgvdG8vaW5kZXguaHRtbCBzbyB3ZSB0cnkgZm9yIHRoYXQuXG4gICAgICAgICAgICAvLyBUaGUgcHJvYmxlbSBpcyB0aGF0IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGggd291bGQgZmFpbCBvbiBqdXN0IC9wYXRoL3RvIGJ1dCBzdWNjZWVkXG4gICAgICAgICAgICAvLyBvbiAvcGF0aC90by9pbmRleC5odG1sXG4gICAgICAgICAgICBpZiAoZm91bmQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIFwiaW5kZXguaHRtbFwiKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnLmRvY3VtZW50RGlycyl9IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBPdGhlcndpc2UgbG9vayBpbnRvIGZpbGxpbmcgZW1wdGluZXNzIHdpdGggdGl0bGVcblxuICAgICAgICAgICAgbGV0IGRvY21ldGEgPSBmb3VuZC5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgIC8vIEF1dG9tYXRpY2FsbHkgYWRkIGEgdGl0bGU9IGF0dHJpYnV0ZVxuICAgICAgICAgICAgaWYgKCEkbGluay5hdHRyKCd0aXRsZScpICYmIGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RpdGxlJywgZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsudGV4dChkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJGxpbmsudGV4dChocmVmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIHZhciByZW5kZXJlciA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJlclBhdGggJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG4gICAgICAgICAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8qIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkb2NtZXRhID0gYXdhaXQgcmVuZGVyZXIubWV0YWRhdGEoZm91bmQuZm91bmREaXIsIGZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmV0cmlldmUgZG9jdW1lbnQgbWV0YWRhdGEgZm9yICR7Zm91bmQuZm91bmREaXJ9ICR7Zm91bmQuZm91bmRQYXRoV2l0aGluRGlyfSBiZWNhdXNlICR7ZXJyfWApO1xuICAgICAgICAgICAgICAgIH0gKi0tL1xuICAgICAgICAgICAgICAgIC8vIEF1dG9tYXRpY2FsbHkgYWRkIGEgdGl0bGU9IGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgIGlmICghJGxpbmsuYXR0cigndGl0bGUnKSAmJiBkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBmaW5pc2hlZGApO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBET05FICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIERvbid0IGJvdGhlciB0aHJvd2luZyBhbiBlcnJvci4gIEp1c3QgZmlsbCBpdCBpbiB3aXRoXG4gICAgICAgICAgICAgICAgLy8gc29tZXRoaW5nLlxuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoaHJlZik7XG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmlsbCBpbiBlbXB0eSAnYScgZWxlbWVudCBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IHdpdGggaHJlZiAke2hyZWZ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLyAgTUFIQUZVTkNTIEZPUiBGSU5BTCBQQVNTXG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgPGNvZGU+bXVuZ2VkPXllczwvY29kZT4gYXR0cmlidXRlIHRoYXQgaXMgYWRkZWRcbiAqIGJ5IDxjb2RlPkFuY2hvckNsZWFudXA8L2NvZGU+LlxuICovXG5jbGFzcyBNdW5nZWRBdHRyUmVtb3ZlciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW211bmdlZF0nOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW211bmdlZF0nOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuICAgICAgICAkZWxlbWVudC5yZW1vdmVBdHRyKCdtdW5nZWQnKTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8gTnVuanVja3MgRXh0ZW5zaW9uc1xuXG4vLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2Z0b25pYy9udW5qdWNrcy1pbmNsdWRlLXdpdGgvdHJlZS9tYXN0ZXJcblxuY2xhc3Mgc3R5bGVzaGVldHNFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtzdHlsZXNoZWV0cycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHN0eWxlc2hlZXRzRXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBzdHlsZXNoZWV0c0V4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRhZyB0b2tlblxuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcblxuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYXJncyBhbmQgbW92ZSBhZnRlciB0aGUgYmxvY2sgZW5kLiBwYXNzaW5nIHRydWVcbiAgICAgICAgICAgIC8vIGFzIHRoZSBzZWNvbmQgYXJnIGlzIHJlcXVpcmVkIGlmIHRoZXJlIGFyZSBubyBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGJvZHkgYW5kIHBvc3NpYmx5IHRoZSBlcnJvciBibG9jaywgd2hpY2ggaXMgb3B0aW9uYWxcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrc3R5bGVzaGVldHMnKTtcblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHN0eWxlc2hlZXRzRXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb1N0eWxlc2hlZXRzKGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5jbGFzcyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2FraGVhZGVyanMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtoZWFkZXJqcycpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb0hlYWRlckphdmFTY3JpcHQoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtmb290ZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2Zvb3RlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvRm9vdGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdGVzdEV4dGVuc2lvbigpIHtcbiAgICB0aGlzLnRhZ3MgPSBbICdha25qa3Rlc3QnIF07XG5cbiAgICB0aGlzLnBhcnNlID0gZnVuY3Rpb24ocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbmNvbnNvbGUubG9nKGBpbiB0ZXN0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZXJyb3InLCAnZW5kYWtuamt0ZXN0Jyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JCb2R5ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYocGFyc2VyLnNraXBTeW1ib2woJ2Vycm9yJykpIHtcbiAgICAgICAgICAgICAgICBwYXJzZXIuc2tpcChsZXhlci5UT0tFTl9CTE9DS19FTkQpO1xuICAgICAgICAgICAgICAgIGVycm9yQm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keSwgZXJyb3JCb2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGVzdEV4dGlvbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHRoaXMucnVuID0gZnVuY3Rpb24oY29udGV4dCwgdXJsLCBib2R5LCBlcnJvckJvZHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCAke3V0aWwuaW5zcGVjdChjb250ZXh0KX0gJHt1dGlsLmluc3BlY3QodXJsKX0gJHt1dGlsLmluc3BlY3QoYm9keSl9ICR7dXRpbC5pbnNwZWN0KGVycm9yQm9keSl9YCk7XG4gICAgfTtcblxufSJdfQ==