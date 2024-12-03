/**
 *
 * Copyright 2014-2022 David Herron
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
import url from 'node:url';
import path from 'node:path';
import util from 'node:util';
import sharp from 'sharp';
import * as uuid from 'uuid';
const uuidv1 = uuid.v1;
import { Plugin } from './Plugin.js';
import relative from 'relative';
import hljs from 'highlight.js';
import * as cheerio from 'cheerio';
import mahabhuta from 'mahabhuta';
import mahaMetadata from 'mahabhuta/maha/metadata.js';
import Renderers from '@akashacms/renderers';
const NunjucksRenderer = Renderers.NunjucksRenderer;
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
        this.options = options ? options : {};
        if (typeof this.options.relativizeHeadLinks === 'undefined') {
            this.options.relativizeHeadLinks = true;
        }
        if (typeof this.options.relativizeScriptLinks === 'undefined') {
            this.options.relativizeScriptLinks = true;
        }
        if (typeof this.options.relativizeBodyLinks === 'undefined') {
            this.options.relativizeBodyLinks = true;
        }
        this.options.config = config;
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
        config.addMahabhuta(mahabhutaArray(options));
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
        return _doStylesheets(metadata, this.options);
    }
    doHeaderJavaScript(metadata) {
        return _doHeaderJavaScript(metadata, this.options);
    }
    doFooterJavaScript(metadata) {
        return _doFooterJavaScript(metadata, this.options);
    }
    addImageToResize(src, resizewidth, resizeto, docPath) {
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
export const mahabhutaArray = function (options) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    ret.addMahafunc(new StylesheetsElement());
    ret.addMahafunc(new HeaderJavaScript());
    ret.addMahafunc(new FooterJavaScript());
    ret.addMahafunc(new HeadLinkRelativizer());
    ret.addMahafunc(new ScriptRelativizer());
    ret.addMahafunc(new InsertTeaser());
    ret.addMahafunc(new CodeEmbed());
    ret.addMahafunc(new AkBodyClassAdd());
    ret.addMahafunc(new FigureImage());
    ret.addMahafunc(new img2figureImage());
    ret.addMahafunc(new ImageRewriter());
    ret.addMahafunc(new ShowContent());
    ret.addMahafunc(new SelectElements());
    ret.addMahafunc(new AnchorCleanup());
    ret.addFinalMahafunc(new MungedAttrRemover());
    return ret;
};
function _doStylesheets(metadata, options) {
    // console.log(`_doStylesheets ${util.inspect(metadata)}`);
    var scripts;
    if (typeof metadata.headerStylesheetsAdd !== "undefined") {
        scripts = options.config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
    }
    else {
        scripts = options.config.scripts ? options.config.scripts.stylesheets : undefined;
    }
    // console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(options.config.scripts)} ${util.inspect(scripts)}`);
    if (!options)
        throw new Error('_doStylesheets no options');
    if (!options.config)
        throw new Error('_doStylesheets no options.config');
    var ret = '';
    if (typeof scripts !== 'undefined') {
        for (var style of scripts) {
            let stylehref = style.href;
            let pHref = url.parse(style.href, true, true);
            // console.log(`_doStylesheets process ${stylehref}`);
            if (!pHref.protocol && !pHref.hostname && !pHref.slashes) {
                // This is a local URL
                // Only relativize if desired
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
            let $ = cheerio.load('<link rel="stylesheet" type="text/css" href=""/>', null, false);
            $('link').attr('href', stylehref);
            if (style.media) {
                $('link').attr('media', style.media);
            }
            ret += $.html();
        }
        // console.log(`_doStylesheets ${ret}`);
    }
    return ret;
}
function _doJavaScripts(metadata, scripts, options) {
    var ret = '';
    if (!scripts)
        return ret;
    if (!options)
        throw new Error('_doJavaScripts no options');
    if (!options.config)
        throw new Error('_doJavaScripts no options.config');
    for (var script of scripts) {
        if (!script.href && !script.script) {
            throw new Error(`Must specify either href or script in ${util.inspect(script)}`);
        }
        if (!script.script)
            script.script = '';
        let $ = cheerio.load('<script ></script>', null, false);
        if (script.lang)
            $('script').attr('type', script.lang);
        if (script.href) {
            let scripthref = script.href;
            let pHref = url.parse(script.href, true, true);
            if (!pHref.protocol && !pHref.hostname && !pHref.slashes) {
                // This is a local URL
                // Only relativize if desired
                if (options.relativizeScriptLinks
                    && path.isAbsolute(scripthref)) {
                    let newHref = relative(`/${metadata.document.renderTo}`, scripthref);
                    // console.log(`_doJavaScripts absolute scripthref ${scripthref} in ${util.inspect(metadata.document)} rewrote to ${newHref}`);
                    scripthref = newHref;
                }
                /* if (options.config.root_url) {
                    let pRootUrl = url.parse(options.config.root_url);
                    scripthref = path.normalize(
                            path.join(pRootUrl.pathname, pHref.pathname)
                    );
                } */
            }
            $('script').attr('src', scripthref);
        }
        if (script.script) {
            $('script').append(script.script);
        }
        ret += $.html();
    }
    // console.log('_doJavaScripts '+ ret);
    return ret;
}
function _doHeaderJavaScript(metadata, options) {
    var scripts;
    if (typeof metadata.headerJavaScriptAddTop !== "undefined") {
        scripts = options.config.scripts.javaScriptTop.concat(metadata.headerJavaScriptAddTop);
    }
    else {
        scripts = options.config.scripts ? options.config.scripts.javaScriptTop : undefined;
    }
    // console.log(`_doHeaderJavaScript ${util.inspect(scripts)}`);
    // console.log(`_doHeaderJavaScript ${util.inspect(options.config.scripts)}`);
    return _doJavaScripts(metadata, scripts, options);
}
function _doFooterJavaScript(metadata, options) {
    var scripts;
    if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
        scripts = options.config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
    }
    else {
        scripts = options.config.scripts ? options.config.scripts.javaScriptBottom : undefined;
    }
    return _doJavaScripts(metadata, scripts, options);
}
class StylesheetsElement extends mahabhuta.CustomElement {
    get elementName() { return "ak-stylesheets"; }
    async process($element, metadata, setDirty, done) {
        let ret = _doStylesheets(metadata, this.array.options);
        // console.log(`StylesheetsElement `, ret);
        return ret;
    }
}
class HeaderJavaScript extends mahabhuta.CustomElement {
    get elementName() { return "ak-headerJavaScript"; }
    async process($element, metadata, setDirty, done) {
        let ret = _doHeaderJavaScript(metadata, this.array.options);
        // console.log(`HeaderJavaScript `, ret);
        return ret;
    }
}
class FooterJavaScript extends mahabhuta.CustomElement {
    get elementName() { return "ak-footerJavaScript"; }
    async process($element, metadata, dirty) {
        return _doFooterJavaScript(metadata, this.array.options);
    }
}
class HeadLinkRelativizer extends mahabhuta.Munger {
    get selector() { return "html head link"; }
    get elementName() { return "html head link"; }
    async process($, $link, metadata, dirty) {
        // Only relativize if desired
        if (!this.array.options.relativizeHeadLinks)
            return;
        let href = $link.attr('href');
        let pHref = url.parse(href, true, true);
        if (!pHref.protocol && !pHref.hostname && !pHref.slashes) {
            // It's a local link
            if (path.isAbsolute(href)) {
                // It's an absolute local link
                let newHref = relative(`/${metadata.document.renderTo}`, href);
                $link.attr('href', newHref);
            }
        }
    }
}
class ScriptRelativizer extends mahabhuta.Munger {
    get selector() { return "script"; }
    get elementName() { return "script"; }
    async process($, $link, metadata, dirty) {
        // Only relativize if desired
        if (!this.array.options.relativizeScriptLinks)
            return;
        let href = $link.attr('src');
        if (href) {
            // There is a link
            let pHref = url.parse(href, true, true);
            if (!pHref.protocol && !pHref.hostname && !pHref.slashes) {
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
class InsertTeaser extends mahabhuta.CustomElement {
    get elementName() { return "ak-teaser"; }
    async process($element, metadata, dirty) {
        try {
            return this.array.options.config.akasha.partial(this.array.options.config, "ak_teaser.html.njk", {
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
class AkBodyClassAdd extends mahabhuta.PageProcessor {
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
class CodeEmbed extends mahabhuta.CustomElement {
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
        const documents = this.array.options.config.akasha.filecache.documentsCache;
        const found = await documents.find(txtpath);
        if (!found) {
            throw new Error(`code-embed file-name ${fn} does not refer to usable file`);
        }
        const txt = await fsp.readFile(found.fspath, 'utf8');
        let $ = mahabhuta.parse(`<pre><code></code></pre>`);
        if (lang && lang !== '') {
            $('code').addClass(lang);
        }
        $('code').addClass('hljs');
        if (id && id !== '') {
            $('pre').attr('id', id);
        }
        if (lang && lang !== '') {
            $('code').append(hljs.highlight(txt, {
                language: lang
            }).value);
        }
        else {
            $('code').append(hljs.highlightAuto(txt).value);
        }
        return $.html();
    }
}
class FigureImage extends mahabhuta.CustomElement {
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
        return this.array.options.config.akasha.partial(this.array.options.config, template, {
            href, clazz, id, caption, width, style, dest
        });
    }
}
class img2figureImage extends mahabhuta.CustomElement {
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
        return this.array.options.config.akasha.partial(this.array.options.config, template, {
            id, clazz, style, width, href: src, dest, resizewidth, resizeto,
            caption: content
        });
    }
}
class ImageRewriter extends mahabhuta.Munger {
    get selector() { return "html body img"; }
    get elementName() { return "html body img"; }
    async process($, $link, metadata, dirty) {
        // console.log($element);
        // We only do rewrites for local images
        let src = $link.attr('src');
        const uSrc = url.parse(src, true, true);
        if (uSrc.protocol || uSrc.slashes)
            return "ok";
        // Are we asked to resize the image?
        const resizewidth = $link.attr('resize-width');
        const resizeto = $link.attr('resize-to');
        if (resizewidth) {
            // Add to a queue that is run at the end 
            this.array.options.config.plugin(pluginName)
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
        /*
        // The idea here is for every local image src to be an absolute URL
        // That then requires every local image src to be prefixed with any
        // subdirectory contained in config.root_url
        //
        // Check to see if src must be updated for config.root_url
        // This does not apply to relative image paths
        // Therefore if it is an absolute local image path, and there is a root_url
        // we must rewrite the src path to start with the root_url
        if (path.isAbsolute(src) && this.array.options.config.root_url) {
            let pRootUrl = url.parse(this.array.options.config.root_url);
            // Check if the URL has already been rewritten
            if (!src.startsWith(pRootUrl.pathname)) {
                let newSrc = path.normalize(
                    path.join(pRootUrl.pathname, src)
                );
                $link.attr('src', newSrc);
            }
        }
        */
        return "ok";
    }
}
class ShowContent extends mahabhuta.CustomElement {
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
        const documents = this.array.options.config.akasha.filecache.documentsCache;
        const doc = await documents.find(doc2read);
        const data = {
            href, clazz, id, caption, width, style, dest, contentImage,
            document: doc
        };
        let ret = await this.array.options.config.akasha.partial(this.array.options.config, template, data);
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
        return render.partial(this.array.options.config, fname, d)
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
class SelectElements extends mahabhuta.Munger {
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
class AnchorCleanup extends mahabhuta.Munger {
    get selector() { return "html body a[munged!='yes']"; }
    get elementName() { return "html body a[munged!='yes']"; }
    async process($, $link, metadata, dirty) {
        var href = $link.attr('href');
        var linktext = $link.text();
        const documents = this.array.options.config.akasha.filecache.documentsCache;
        // await documents.isReady();
        const assets = this.array.options.config.akasha.filecache.assetsCache;
        // await assets.isReady();
        // console.log(`AnchorCleanup ${href} ${linktext}`);
        if (href && href !== '#') {
            var uHref = url.parse(href, true, true);
            if (uHref.protocol || uHref.slashes)
                return "ok";
            if (!uHref.pathname)
                return "ok";
            /* if (metadata.document.path === 'index.html.md') {
                console.log(`AnchorCleanup metadata.document.path ${metadata.document.path} href ${href} uHref.pathname ${uHref.pathname} this.array.options.config.root_url ${this.array.options.config.root_url}`);
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
            /*
            // The idea for this section is to
            //     a) ensure all relative paths are made absolute
            //     b) therefore all absolute paths when config.root_url
            //        is for a nested subdirectory must have the path
            //        prefixed with the subdirectory
            //
            // Check to see if href must be updated for config.root_url
            if (this.array.options.config.root_url) {
                let pRootUrl = url.parse(this.array.options.config.root_url);
                // Check if the URL has already been rewritten
                if (!href.startsWith(pRootUrl.pathname)) {
                    let newHref = path.normalize(
                        path.join(pRootUrl.pathname, absolutePath)
                    );
                    $link.attr('href', newHref);
                    /* if (metadata.document.path === 'index.html.md') console.log(`AnchorCleanup metadata.document.path ${metadata.document.path} href ${href} absolutePath ${absolutePath} this.array.options.config.root_url ${this.array.options.config.root_url} newHref ${newHref}`); * /
                }
            }
            */
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
            if (this.array.options.config.askPluginsLegitLocalHref(absolutePath)) {
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
                // console.log(`WARNING: Did not find ${href} in ${util.inspect(this.array.options.config.documentDirs)} in ${metadata.document.path} absolutePath ${absolutePath}`);
                return "ok";
            }
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findRendersTo ${(new Date() - startTime) / 1000} seconds`);
            // If this is a directory, there might be /path/to/index.html so we try for that.
            // The problem is that this.array.options.config.findRendererPath would fail on just /path/to but succeed
            // on /path/to/index.html
            if (found.isDirectory) {
                found = await documents.find(path.join(absolutePath, "index.html"));
                if (!found) {
                    throw new Error(`Did not find ${href} in ${util.inspect(this.array.options.config.documentDirs)} in ${metadata.document.path}`);
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
            var renderer = this.array.options.config.findRendererPath(found.vpath);
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
class MungedAttrRemover extends mahabhuta.Munger {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFDbkMsT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDO0FBQzNCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7QUFFdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxJQUFJLE1BQU0sY0FBYyxDQUFDO0FBQ2hDLE9BQU8sS0FBSyxPQUFPLE1BQU0sU0FBUyxDQUFDO0FBQ25DLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLFlBQVksTUFBTSw0QkFBNEIsQ0FBQztBQUV0RCxPQUFPLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztBQUVwRCxNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQztBQUV2QyxNQUFNLE9BQU8sYUFBYyxTQUFRLE1BQU07SUFDeEM7UUFDQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFLaEIsd0NBQVE7UUFDUiw4Q0FBYztRQUxWLHVCQUFBLElBQUksK0JBQWlCLEVBQUUsTUFBQSxDQUFDO0lBRS9CLENBQUM7SUFLRCxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU87UUFDbEIsdUJBQUEsSUFBSSx5QkFBVyxNQUFNLE1BQUEsQ0FBQztR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SSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDNUQsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBRXJCLElBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFDbkMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBRUQsTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFFOUIsMENBQTBDO1lBQzFDLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0lBR0YsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVILENBQUMsQ0FBQztBQUVOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDIyIERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IGZzcCBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB1cmwgZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgc2hhcnAgZnJvbSAnc2hhcnAnO1xuaW1wb3J0ICogYXMgdXVpZCBmcm9tICd1dWlkJztcbmNvbnN0IHV1aWR2MSA9IHV1aWQudjE7XG5pbXBvcnQgKiBhcyByZW5kZXIgZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuaW1wb3J0IHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcyc7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0IG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuaW1wb3J0IG1haGFNZXRhZGF0YSBmcm9tICdtYWhhYmh1dGEvbWFoYS9tZXRhZGF0YS5qcyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5pbXBvcnQgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmNvbnN0IE51bmp1Y2tzUmVuZGVyZXIgPSBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcblxuY29uc3QgcGx1Z2luTmFtZSA9IFwiYWthc2hhY21zLWJ1aWx0aW5cIjtcblxuZXhwb3J0IGNsYXNzIEJ1aWx0SW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcihwbHVnaW5OYW1lKTtcbiAgICAgICAgdGhpcy4jcmVzaXplX3F1ZXVlID0gW107XG5cblx0fVxuXG4gICAgI2NvbmZpZztcbiAgICAjcmVzaXplX3F1ZXVlO1xuXG5cdGNvbmZpZ3VyZShjb25maWcsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID8gb3B0aW9ucyA6IHt9O1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUJvZHlMaW5rcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgbGV0IG1vZHVsZURpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuICAgICAgICAvLyBOZWVkIHRoaXMgYXMgdGhlIHBsYWNlIHRvIHN0b3JlIE51bmp1Y2tzIG1hY3JvcyBhbmQgdGVtcGxhdGVzXG4gICAgICAgIGNvbmZpZy5hZGRMYXlvdXRzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAnbGF5b3V0cycpKTtcbiAgICAgICAgY29uZmlnLmFkZFBhcnRpYWxzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAncGFydGlhbHMnKSk7XG4gICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAvLyBpbiB0aGUgQ29uZmlndXJhdGlvbiBjb25zdHJ1Y3Rvci4gIFRoZSBpZGVhIGlzIHRvIHB1dFxuICAgICAgICAvLyBtYWhhUGFydGlhbCBhcyB0aGUgdmVyeSBmaXJzdCBNYWhhZnVuYyBzbyB0aGF0IGFsbFxuICAgICAgICAvLyBQYXJ0aWFsJ3MgYXJlIGhhbmRsZWQgYmVmb3JlIGFueXRoaW5nIGVsc2UuICBUaGUgaXNzdWUgY2F1c2luZ1xuICAgICAgICAvLyB0aGlzIGNoYW5nZSBpcyB0aGUgT3BlbkdyYXBoUHJvbW90ZUltYWdlcyBNYWhhZnVuYyBpblxuICAgICAgICAvLyBha2FzaGFjaHMtYmFzZSBhbmQgcHJvY2Vzc2luZyBhbnkgaW1hZ2VzIGJyb3VnaHQgaW4gYnkgcGFydGlhbHMuXG4gICAgICAgIC8vIEVuc3VyaW5nIHRoZSBwYXJ0aWFsIHRhZyBpcyBwcm9jZXNzZWQgYmVmb3JlIE9wZW5HcmFwaFByb21vdGVJbWFnZXNcbiAgICAgICAgLy8gbWVhbnQgc3VjaCBpbWFnZXMgd2VyZSBwcm9wZXJseSBwcm9tb3RlZC5cbiAgICAgICAgLy8gY29uZmlnLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgIC8vICAgICByZW5kZXJQYXJ0aWFsOiBvcHRpb25zLnJlbmRlclBhcnRpYWxcbiAgICAgICAgLy8gfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFNZXRhZGF0YS5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICAvLyBEbyBub3QgcGFzcyB0aGlzIHRocm91Z2ggc28gdGhhdCBNYWhhYmh1dGEgd2lsbCBub3RcbiAgICAgICAgICAgIC8vIG1ha2UgYWJzb2x1dGUgbGlua3MgdG8gc3ViZGlyZWN0b3JpZXNcbiAgICAgICAgICAgIC8vIHJvb3RfdXJsOiBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIC8vIFRPRE8gaG93IHRvIGNvbmZpZ3VyZSB0aGlzXG4gICAgICAgICAgICAvLyBzaXRlbWFwX3RpdGxlOiAuLi4uP1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYWJodXRhQXJyYXkob3B0aW9ucykpO1xuXG4gICAgICAgIGNvbnN0IG5qayA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlck5hbWUoJy5odG1sLm5qaycpO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgIG5ldyBzdHlsZXNoZWV0c0V4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgIG5ldyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG4gICAgICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrZm9vdGVyanMnLFxuICAgICAgICAgICAgbmV3IGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgZXh0ZW5zaW9ucyB3ZXJlIGluc3RhbGxlZFxuICAgICAgICBmb3IgKGNvbnN0IGV4dCBvZiBbXG4gICAgICAgICAgICAgICAgICAgICdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FraGVhZGVyanMnLFxuICAgICAgICAgICAgICAgICAgICAnYWtmb290ZXJqcydcbiAgICAgICAgXSkge1xuICAgICAgICAgICAgaWYgKCFuamsubmprZW52KCkuaGFzRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbmZpZ3VyZSAtIE5KSyBkb2VzIG5vdCBoYXZlIGV4dGVuc2lvbiAtICR7ZXh0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyB0cnkge1xuICAgICAgICAvLyAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtuamt0ZXN0JywgbmV3IHRlc3RFeHRlbnNpb24oKSk7XG4gICAgICAgIC8vIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2soKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbignYWtuamt0ZXN0JykpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoYGFrbmprdGVzdCBleHRlbnNpb24gbm90IGFkZGVkP2ApO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCBleGlzdHNgKTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICAvLyBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cblxuICAgIGdldCByZXNpemVxdWV1ZSgpIHsgcmV0dXJuIHRoaXMuI3Jlc2l6ZV9xdWV1ZTsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxsaW5rPiB0YWdzIGluIHRoZSA8aGVhZD4gZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVIZWFkTGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxzY3JpcHQ+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVTY3JpcHRMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8QT4gdGFncyBmb3IgbG9jYWxcbiAgICAgKiBVUkxzIGFyZSByZWxhdGl2aXplZCBvciBhYnNvbHV0aXplZC5cbiAgICAgKi9cbiAgICBzZXQgcmVsYXRpdml6ZUJvZHlMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIGRvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICBhZGRJbWFnZVRvUmVzaXplKHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBkb2NQYXRoKSB7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgb25TaXRlUmVuZGVyZWQoY29uZmlnKSB7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIHdoaWxlIChBcnJheS5pc0FycmF5KHRoaXMuI3Jlc2l6ZV9xdWV1ZSlcbiAgICAgICAgICAgICYmIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5sZW5ndGggPiAwKSB7XG5cbiAgICAgICAgICAgIGxldCB0b3Jlc2l6ZSA9IHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wb3AoKTtcblxuICAgICAgICAgICAgbGV0IGltZzJyZXNpemU7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZSh0b3Jlc2l6ZS5zcmMpKSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICB0b3Jlc2l6ZS5zcmNcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHRvcmVzaXplLnNyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNyY2ZpbGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGFzc2V0cy5maW5kKGltZzJyZXNpemUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kLmZzcGF0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgICAgICBzcmNmaWxlID0gZm91bmQgPyBmb3VuZC5mc3BhdGggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNyY2ZpbGUpIHRocm93IG5ldyBFcnJvcihgYWthc2hhY21zLWJ1aWx0aW46IERpZCBub3QgZmluZCBzb3VyY2UgZmlsZSBmb3IgaW1hZ2UgdG8gcmVzaXplICR7aW1nMnJlc2l6ZX1gKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgaW1nID0gYXdhaXQgc2hhcnAoc3JjZmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWQgPSBhd2FpdCBpbWcucmVzaXplKE51bWJlci5wYXJzZUludCh0b3Jlc2l6ZS5yZXNpemV3aWR0aCkpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgY29ycmVjdCBkZXN0aW5hdGlvbiBwYXRoXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSByZXNpemVkIGltYWdlXG4gICAgICAgICAgICAgICAgbGV0IGltZ3RvcmVzaXplID0gdG9yZXNpemUucmVzaXpldG8gPyB0b3Jlc2l6ZS5yZXNpemV0byA6IGltZzJyZXNpemU7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWRlc3Q7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShpbWd0b3Jlc2l6ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGZvciByZWxhdGl2ZSBpbWFnZSBwYXRocywgaGVuY2UgaXQgbmVlZHMgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGRvY1BhdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyRGVzdGluYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlc2l6ZWRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXNpemVkLnRvRmlsZShyZXNpemVkZXN0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJ1aWx0LWluOiBJbWFnZSByZXNpemUgZmFpbGVkIGZvciAke3NyY2ZpbGV9ICh0b3Jlc2l6ZSAke3V0aWwuaW5zcGVjdCh0b3Jlc2l6ZSl9IGZvdW5kICR7dXRpbC5pbnNwZWN0KGZvdW5kKX0pIGJlY2F1c2UgJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBtYWhhYmh1dGFBcnJheSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBsZXQgcmV0ID0gbmV3IG1haGFiaHV0YS5NYWhhZnVuY0FycmF5KHBsdWdpbk5hbWUsIG9wdGlvbnMpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU3R5bGVzaGVldHNFbGVtZW50KCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZGVySmF2YVNjcmlwdCgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZvb3RlckphdmFTY3JpcHQoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBIZWFkTGlua1JlbGF0aXZpemVyKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2NyaXB0UmVsYXRpdml6ZXIoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBJbnNlcnRUZWFzZXIoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBDb2RlRW1iZWQoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZCgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZpZ3VyZUltYWdlKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgaW1nMmZpZ3VyZUltYWdlKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcigpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNob3dDb250ZW50KCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2VsZWN0RWxlbWVudHMoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBbmNob3JDbGVhbnVwKCkpO1xuXG4gICAgcmV0LmFkZEZpbmFsTWFoYWZ1bmMobmV3IE11bmdlZEF0dHJSZW1vdmVyKCkpO1xuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCBvcHRpb25zKSB7XG4gICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhKX1gKTtcblxuICAgIHZhciBzY3JpcHRzO1xuICAgIGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMuY29uY2F0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY3JpcHRzID0gb3B0aW9ucy5jb25maWcuc2NyaXB0cyA/IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBhay1zdHlsZXNoZWV0cyAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKX0gJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5jb25maWcuc2NyaXB0cyl9ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXG4gICAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMnKTtcbiAgICBpZiAoIW9wdGlvbnMuY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMuY29uZmlnJyk7XG5cbiAgICB2YXIgcmV0ID0gJyc7XG4gICAgaWYgKHR5cGVvZiBzY3JpcHRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IgKHZhciBzdHlsZSBvZiBzY3JpcHRzKSB7XG5cbiAgICAgICAgICAgIGxldCBzdHlsZWhyZWYgPSBzdHlsZS5ocmVmO1xuICAgICAgICAgICAgbGV0IHBIcmVmID0gdXJsLnBhcnNlKHN0eWxlLmhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHByb2Nlc3MgJHtzdHlsZWhyZWZ9YCk7XG4gICAgICAgICAgICBpZiAoIXBIcmVmLnByb3RvY29sICYmICFwSHJlZi5ob3N0bmFtZSAmJiAhcEhyZWYuc2xhc2hlcykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHN0eWxlaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlRgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVCBSRU5ERVJUT2ApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHJlbGF0aXZlKC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfSwgJHtzdHlsZWhyZWZ9KSA9ICR7cmVsYXRpdmUoJy8nK21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvLCBzdHlsZWhyZWYpfWApXG4gICAgICAgICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3R5bGVocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIGFic29sdXRlIHN0eWxlaHJlZiAke3N0eWxlaHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgJCA9IGNoZWVyaW8ubG9hZCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCJcIi8+JywgbnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgJCgnbGluaycpLmF0dHIoJ2hyZWYnLCBzdHlsZWhyZWYpO1xuICAgICAgICAgICAgaWYgKHN0eWxlLm1lZGlhKSB7XG4gICAgICAgICAgICAgICAgJCgnbGluaycpLmF0dHIoJ21lZGlhJywgc3R5bGUubWVkaWEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ICs9ICQuaHRtbCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3JldH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMpIHtcblx0dmFyIHJldCA9ICcnO1xuXHRpZiAoIXNjcmlwdHMpIHJldHVybiByZXQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghb3B0aW9ucy5jb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucy5jb25maWcnKTtcblxuICAgIGZvciAodmFyIHNjcmlwdCBvZiBzY3JpcHRzKSB7XG5cdFx0aWYgKCFzY3JpcHQuaHJlZiAmJiAhc2NyaXB0LnNjcmlwdCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBNdXN0IHNwZWNpZnkgZWl0aGVyIGhyZWYgb3Igc2NyaXB0IGluICR7dXRpbC5pbnNwZWN0KHNjcmlwdCl9YCk7XG5cdFx0fVxuICAgICAgICBpZiAoIXNjcmlwdC5zY3JpcHQpIHNjcmlwdC5zY3JpcHQgPSAnJztcbiAgICAgICAgbGV0ICQgPSBjaGVlcmlvLmxvYWQoJzxzY3JpcHQgPjwvc2NyaXB0PicsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgaWYgKHNjcmlwdC5sYW5nKSAkKCdzY3JpcHQnKS5hdHRyKCd0eXBlJywgc2NyaXB0LmxhbmcpO1xuICAgICAgICBpZiAoc2NyaXB0LmhyZWYpIHtcbiAgICAgICAgICAgIGxldCBzY3JpcHRocmVmID0gc2NyaXB0LmhyZWY7XG4gICAgICAgICAgICBsZXQgcEhyZWYgPSB1cmwucGFyc2Uoc2NyaXB0LmhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHNjcmlwdGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNjcmlwdGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvSmF2YVNjcmlwdHMgYWJzb2x1dGUgc2NyaXB0aHJlZiAke3NjcmlwdGhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdGhyZWYgPSBuZXdIcmVmO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBpZiAob3B0aW9ucy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBSb290VXJsID0gdXJsLnBhcnNlKG9wdGlvbnMuY29uZmlnLnJvb3RfdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0aHJlZiA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgcEhyZWYucGF0aG5hbWUpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSAqL1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCgnc2NyaXB0JykuYXR0cignc3JjJywgc2NyaXB0aHJlZik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjcmlwdC5zY3JpcHQpIHtcbiAgICAgICAgICAgICQoJ3NjcmlwdCcpLmFwcGVuZChzY3JpcHQuc2NyaXB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXQgKz0gJC5odG1sKCk7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coJ19kb0phdmFTY3JpcHRzICcrIHJldCk7XG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMpIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AuY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3ApO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBvcHRpb25zLmNvbmZpZy5zY3JpcHRzID8gb3B0aW9ucy5jb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wIDogdW5kZWZpbmVkO1xuXHR9XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXHQvLyBjb25zb2xlLmxvZyhgX2RvSGVhZGVySmF2YVNjcmlwdCAke3V0aWwuaW5zcGVjdChvcHRpb25zLmNvbmZpZy5zY3JpcHRzKX1gKTtcblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucykge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMgPyBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRCb3R0b20gOiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zKTtcbn1cblxuY2xhc3MgU3R5bGVzaGVldHNFbGVtZW50IGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXN0eWxlc2hlZXRzXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9ICBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFN0eWxlc2hlZXRzRWxlbWVudCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEhlYWRlckphdmFTY3JpcHQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstaGVhZGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbikge1xuXHRcdGxldCByZXQgPSBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgSGVhZGVySmF2YVNjcmlwdCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEZvb3RlckphdmFTY3JpcHQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstZm9vdGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMpO1xuXHR9XG59XG5cbmNsYXNzIEhlYWRMaW5rUmVsYXRpdml6ZXIgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgICAgIGxldCBwSHJlZiA9IHVybC5wYXJzZShocmVmLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBTY3JpcHRSZWxhdGl2aXplciBleHRlbmRzIG1haGFiaHV0YS5NdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignc3JjJyk7XG5cbiAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgbGlua1xuICAgICAgICAgICAgbGV0IHBIcmVmID0gdXJsLnBhcnNlKGhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIEluc2VydFRlYXNlciBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay10ZWFzZXJcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdHJ5IHtcblx0XHRyZXR1cm4gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEucGFydGlhbCh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFrX3RlYXNlci5odG1sLm5qa1wiLCB7XG5cdFx0XHR0ZWFzZXI6IHR5cGVvZiBtZXRhZGF0YVtcImFrLXRlYXNlclwiXSAhPT0gXCJ1bmRlZmluZWRcIlxuXHRcdFx0XHQ/IG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdIDogbWV0YWRhdGEudGVhc2VyXG5cdFx0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEluc2VydFRlYXNlciBjYXVnaHQgZXJyb3IgYCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG5cdH1cbn1cblxuY2xhc3MgQWtCb2R5Q2xhc3NBZGQgZXh0ZW5kcyBtYWhhYmh1dGEuUGFnZVByb2Nlc3NvciB7XG5cdGFzeW5jIHByb2Nlc3MoJCwgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRpZiAodHlwZW9mIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9PSAndW5kZWZpbmVkJ1xuXHRcdCAmJiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPSAnJ1xuXHRcdCAmJiAkKCdodG1sIGJvZHknKS5nZXQoMCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdGlmICghJCgnaHRtbCBib2R5JykuaGFzQ2xhc3MobWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQpKSB7XG5cdFx0XHRcdFx0JCgnaHRtbCBib2R5JykuYWRkQ2xhc3MobWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc29sdmUodW5kZWZpbmVkKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCcnKTtcblx0fVxufVxuXG5jbGFzcyBDb2RlRW1iZWQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjb2RlLWVtYmVkXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICRlbGVtZW50LmF0dHIoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgICAgIGlmICghZm4gfHwgZm4gPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgbXVzdCBoYXZlIGZpbGUtbmFtZSBhcmd1bWVudCwgZ290ICR7Zm59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHh0cGF0aDtcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmbikpIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBmbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHR4dHBhdGgpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgZmlsZS1uYW1lICR7Zm59IGRvZXMgbm90IHJlZmVyIHRvIHVzYWJsZSBmaWxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgICAgICBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZShgPHByZT48Y29kZT48L2NvZGU+PC9wcmU+YCk7XG4gICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgICAgICAkKCdjb2RlJykuYWRkQ2xhc3MobGFuZyk7XG4gICAgICAgIH1cbiAgICAgICAgJCgnY29kZScpLmFkZENsYXNzKCdobGpzJyk7XG4gICAgICAgIGlmIChpZCAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgICAgICQoJ3ByZScpLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0KHR4dCwge1xuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgICAgICB9KS52YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0QXV0byh0eHQpLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJC5odG1sKCk7XG4gICAgfVxufVxuXG5jbGFzcyBGaWd1cmVJbWFnZSBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImZpZy1pbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19maWdpbWcuaHRtbC5uamsnO1xuICAgICAgICBjb25zdCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHRocm93IG5ldyBFcnJvcignZmlnLWltZyBtdXN0IHJlY2VpdmUgYW4gaHJlZicpO1xuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNhcHRpb24gPSAkZWxlbWVudC5odG1sKCk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3RcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBpbWcyZmlndXJlSW1hZ2UgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBpbWdbZmlndXJlXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHksIGRvbmUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJykgXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpXG4gICAgICAgICAgICAgICAgOiAgXCJha19maWdpbWcuaHRtbC5uamtcIjtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzcmMgPSAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaWQsIGNsYXp6LCBzdHlsZSwgd2lkdGgsIGhyZWY6IHNyYywgZGVzdCwgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLFxuICAgICAgICAgICAgY2FwdGlvbjogY29udGVudFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIEltYWdlUmV3cml0ZXIgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcblxuICAgICAgICAvLyBXZSBvbmx5IGRvIHJld3JpdGVzIGZvciBsb2NhbCBpbWFnZXNcbiAgICAgICAgbGV0IHNyYyA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuICAgICAgICBjb25zdCB1U3JjID0gdXJsLnBhcnNlKHNyYywgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIGlmICh1U3JjLnByb3RvY29sIHx8IHVTcmMuc2xhc2hlcykgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgXG4gICAgICAgIC8vIEFyZSB3ZSBhc2tlZCB0byByZXNpemUgdGhlIGltYWdlP1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJlc2l6ZXdpZHRoKSB7XG4gICAgICAgICAgICAvLyBBZGQgdG8gYSBxdWV1ZSB0aGF0IGlzIHJ1biBhdCB0aGUgZW5kIFxuICAgICAgICAgICAgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAuYWRkSW1hZ2VUb1Jlc2l6ZShzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pO1xuXG4gICAgICAgICAgICBpZiAocmVzaXpldG8pIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCByZXNpemV0byk7XG4gICAgICAgICAgICAgICAgc3JjID0gcmVzaXpldG87XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBubyBsb25nZXIgbmVlZGVkXG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGlkZWEgaGVyZSBpcyBmb3IgZXZlcnkgbG9jYWwgaW1hZ2Ugc3JjIHRvIGJlIGEgcmVsYXRpdmUgVVJMXG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjKSkge1xuICAgICAgICAgICAgbGV0IG5ld1NyYyA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBzcmMpO1xuICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBJbWFnZVJld3JpdGVyIGFic29sdXRlIGltYWdlIHBhdGggJHtzcmN9IHJld3JvdGUgdG8gJHtuZXdTcmN9YCk7XG4gICAgICAgICAgICBzcmMgPSBuZXdTcmM7XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICAvLyBUaGUgaWRlYSBoZXJlIGlzIGZvciBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgYW4gYWJzb2x1dGUgVVJMXG4gICAgICAgIC8vIFRoYXQgdGhlbiByZXF1aXJlcyBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgcHJlZml4ZWQgd2l0aCBhbnlcbiAgICAgICAgLy8gc3ViZGlyZWN0b3J5IGNvbnRhaW5lZCBpbiBjb25maWcucm9vdF91cmxcbiAgICAgICAgLy8gXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiBzcmMgbXVzdCBiZSB1cGRhdGVkIGZvciBjb25maWcucm9vdF91cmxcbiAgICAgICAgLy8gVGhpcyBkb2VzIG5vdCBhcHBseSB0byByZWxhdGl2ZSBpbWFnZSBwYXRoc1xuICAgICAgICAvLyBUaGVyZWZvcmUgaWYgaXQgaXMgYW4gYWJzb2x1dGUgbG9jYWwgaW1hZ2UgcGF0aCwgYW5kIHRoZXJlIGlzIGEgcm9vdF91cmxcbiAgICAgICAgLy8gd2UgbXVzdCByZXdyaXRlIHRoZSBzcmMgcGF0aCB0byBzdGFydCB3aXRoIHRoZSByb290X3VybFxuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKHNyYykgJiYgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgbGV0IHBSb290VXJsID0gdXJsLnBhcnNlKHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcucm9vdF91cmwpO1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIFVSTCBoYXMgYWxyZWFkeSBiZWVuIHJld3JpdHRlblxuICAgICAgICAgICAgaWYgKCFzcmMuc3RhcnRzV2l0aChwUm9vdFVybC5wYXRobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3U3JjID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgc3JjKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgIH1cbn1cblxuY2xhc3MgU2hvd0NvbnRlbnQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGxldCBkb2MycmVhZDtcbiAgICAgICAgaWYgKCEgaHJlZi5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIGxldCBkaXIgPSBwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucGF0aCk7XG4gICAgICAgICAgICBkb2MycmVhZCA9IHBhdGguam9pbignLycsIGRpciwgaHJlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2MycmVhZCA9IGhyZWY7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gJHtkb2MycmVhZH1gKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBkb2N1bWVudHMuZmluZChkb2MycmVhZCk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdCwgY29udGVudEltYWdlLFxuICAgICAgICAgICAgZG9jdW1lbnQ6IGRvY1xuICAgICAgICB9O1xuICAgICAgICBsZXQgcmV0ID0gYXdhaXQgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCB0ZW1wbGF0ZSwgZGF0YSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke2hyZWZ9ICR7dXRpbC5pbnNwZWN0KGRhdGEpfSA9PT4gJHtyZXR9YCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG4vKlxuXG5UaGlzIHdhcyBtb3ZlZCBpbnRvIE1haGFiaHV0YVxuXG4gY2xhc3MgUGFydGlhbCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJwYXJ0aWFsXCI7IH1cblx0cHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0Ly8gV2UgZGVmYXVsdCB0byBtYWtpbmcgcGFydGlhbCBzZXQgdGhlIGRpcnR5IGZsYWcuICBCdXQgYSB1c2VyXG5cdFx0Ly8gb2YgdGhlIHBhcnRpYWwgdGFnIGNhbiBjaG9vc2UgdG8gdGVsbCB1cyBpdCBpc24ndCBkaXJ0eS5cblx0XHQvLyBGb3IgZXhhbXBsZSwgaWYgdGhlIHBhcnRpYWwgb25seSBzdWJzdGl0dXRlcyBub3JtYWwgdGFnc1xuXHRcdC8vIHRoZXJlJ3Mgbm8gbmVlZCB0byBkbyB0aGUgZGlydHkgdGhpbmcuXG5cdFx0dmFyIGRvdGhlZGlydHl0aGluZyA9ICRlbGVtZW50LmF0dHIoJ2RpcnR5Jyk7XG5cdFx0aWYgKCFkb3RoZWRpcnR5dGhpbmcgfHwgZG90aGVkaXJ0eXRoaW5nLm1hdGNoKC90cnVlL2kpKSB7XG5cdFx0XHRkaXJ0eSgpO1xuXHRcdH1cblx0XHR2YXIgZm5hbWUgPSAkZWxlbWVudC5hdHRyKFwiZmlsZS1uYW1lXCIpO1xuXHRcdHZhciB0eHQgICA9ICRlbGVtZW50Lmh0bWwoKTtcblx0XHR2YXIgZCA9IHt9O1xuXHRcdGZvciAodmFyIG1wcm9wIGluIG1ldGFkYXRhKSB7IGRbbXByb3BdID0gbWV0YWRhdGFbbXByb3BdOyB9XG5cdFx0dmFyIGRhdGEgPSAkZWxlbWVudC5kYXRhKCk7XG5cdFx0Zm9yICh2YXIgZHByb3AgaW4gZGF0YSkgeyBkW2Rwcm9wXSA9IGRhdGFbZHByb3BdOyB9XG5cdFx0ZFtcInBhcnRpYWxCb2R5XCJdID0gdHh0O1xuXHRcdGxvZygncGFydGlhbCB0YWcgZm5hbWU9JysgZm5hbWUgKycgYXR0cnMgJysgdXRpbC5pbnNwZWN0KGRhdGEpKTtcblx0XHRyZXR1cm4gcmVuZGVyLnBhcnRpYWwodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZywgZm5hbWUsIGQpXG5cdFx0LnRoZW4oaHRtbCA9PiB7IHJldHVybiBodG1sOyB9KVxuXHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0ZXJyb3IobmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycikpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycik7XG5cdFx0fSk7XG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzLm1haGFiaHV0YS5hZGRNYWhhZnVuYyhuZXcgUGFydGlhbCgpKTsgKi9cblxuLy9cbi8vIDxzZWxlY3QtZWxlbWVudHMgY2xhc3M9XCIuLlwiIGlkPVwiLi5cIiBjb3VudD1cIk5cIj5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gPC9zZWxlY3QtZWxlbWVudHM+XG4vL1xuY2xhc3MgU2VsZWN0RWxlbWVudHMgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgbGV0IGNvdW50ID0gJGxpbmsuYXR0cignY291bnQnKVxuICAgICAgICAgICAgICAgICAgICA/IE51bWJlci5wYXJzZUludCgkbGluay5hdHRyKCdjb3VudCcpKVxuICAgICAgICAgICAgICAgICAgICA6IDE7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGxpbmsuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgPSAkbGluay5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCB0biAgICA9ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgPyAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgIDogJ2Rpdic7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSAkbGluay5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoOyBjb3VudCA+PSAxICYmIGNoaWxkcmVuLmxlbmd0aCA+PSAxOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IF9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKF9uKTtcbiAgICAgICAgICAgIGNvbnN0IGNob3NlbiA9ICQoY2hpbGRyZW5bX25dKS5odG1sKCk7XG4gICAgICAgICAgICBzZWxlY3RlZC5wdXNoKGNob3Nlbik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hvc2VuKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbltfbl07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91dWlkID0gdXVpZHYxKCk7XG4gICAgICAgICRsaW5rLnJlcGxhY2VXaXRoKGA8JHt0bn0gaWQ9JyR7X3V1aWR9Jz48LyR7dG59PmApO1xuICAgICAgICBjb25zdCAkbmV3SXRlbSA9ICQoYCR7dG59IyR7X3V1aWR9YCk7XG4gICAgICAgIGlmIChpZCkgJG5ld0l0ZW0uYXR0cignaWQnLCBpZCk7XG4gICAgICAgIGVsc2UgJG5ld0l0ZW0ucmVtb3ZlQXR0cignaWQnKTtcbiAgICAgICAgaWYgKGNsYXp6KSAkbmV3SXRlbS5hZGRDbGFzcyhjbGF6eik7XG4gICAgICAgIGZvciAobGV0IGNob3NlbiBvZiBzZWxlY3RlZCkge1xuICAgICAgICAgICAgJG5ld0l0ZW0uYXBwZW5kKGNob3Nlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5jbGFzcyBBbmNob3JDbGVhbnVwIGV4dGVuZHMgbWFoYWJodXRhLk11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIGhyZWYgICAgID0gJGxpbmsuYXR0cignaHJlZicpO1xuICAgICAgICB2YXIgbGlua3RleHQgPSAkbGluay50ZXh0KCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke2hyZWZ9ICR7bGlua3RleHR9YCk7XG4gICAgICAgIGlmIChocmVmICYmIGhyZWYgIT09ICcjJykge1xuICAgICAgICAgICAgdmFyIHVIcmVmID0gdXJsLnBhcnNlKGhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLnByb3RvY29sIHx8IHVIcmVmLnNsYXNoZXMpIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICBpZiAoIXVIcmVmLnBhdGhuYW1lKSByZXR1cm4gXCJva1wiO1xuXG4gICAgICAgICAgICAvKiBpZiAobWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9PT0gJ2luZGV4Lmh0bWwubWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgbWV0YWRhdGEuZG9jdW1lbnQucGF0aCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGhyZWYgJHtocmVmfSB1SHJlZi5wYXRobmFtZSAke3VIcmVmLnBhdGhuYW1lfSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsICR7dGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkLmh0bWwoKSk7XG4gICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAgIC8vIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGRldGVybWluZWQgdGhpcyBpcyBhIGxvY2FsIGhyZWYuXG4gICAgICAgICAgICAvLyBGb3IgcmVmZXJlbmNlIHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lIG9mIHRoZSBocmVmIHdpdGhpblxuICAgICAgICAgICAgLy8gdGhlIHByb2plY3QuICBGb3IgZXhhbXBsZSB0byByZXRyaWV2ZSB0aGUgdGl0bGUgd2hlbiB3ZSdyZSBmaWxsaW5nXG4gICAgICAgICAgICAvLyBpbiBmb3IgYW4gZW1wdHkgPGE+IHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lLlxuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgbGluayBhcyBoYXZpbmcgYmVlbiBwcm9jZXNzZWQuXG4gICAgICAgICAgICAvLyBUaGUgcHVycG9zZSBpcyBpZiBNYWhhYmh1dGEgcnVucyBtdWx0aXBsZSBwYXNzZXMsXG4gICAgICAgICAgICAvLyB0byBub3QgcHJvY2VzcyB0aGUgbGluayBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICAgIC8vIEJlZm9yZSBhZGRpbmcgdGhpcyAtIHdlIHNhdyB0aGlzIE11bmdlciB0YWtlIGFzIG11Y2hcbiAgICAgICAgICAgIC8vIGFzIDgwMG1zIHRvIGV4ZWN1dGUsIGZvciBFVkVSWSBwYXNzIG1hZGUgYnkgTWFoYWJodXRhLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGlzIGF0dHJpYnV0ZSwgYW5kIGNoZWNraW5nIGZvciBpdCBpbiB0aGUgc2VsZWN0b3IsXG4gICAgICAgICAgICAvLyBtZWFucyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGxpbmsgb25jZS5cbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ211bmdlZCcsICd5ZXMnKTtcblxuICAgICAgICAgICAgbGV0IGFic29sdXRlUGF0aDtcblxuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodUhyZWYucGF0aG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5wYXRoKSwgdUhyZWYucGF0aG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAqKioqKiBBbmNob3JDbGVhbnVwIEZJWEVEIGhyZWYgdG8gJHt1SHJlZi5wYXRobmFtZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gdUhyZWYucGF0aG5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gZW5zdXJlIGFsbCBsb2NhbCBocmVmJ3MgYXJlIFxuICAgICAgICAgICAgLy8gZm9yIGEgcmVsYXRpdmUgcGF0aCByYXRoZXIgdGhhbiBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSB1c2UgdGhlIHJlbGF0aXZlIG1vZHVsZSB0byBjb21wdXRlIHRoZSByZWxhdGl2ZSBwYXRoXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgL2luZGV4Lmh0bWwgaW4ge1xuICAgICAgICAgICAgLy8gIGJhc2VkaXI6ICcvVm9sdW1lcy9FeHRyYS9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL3Rlc3QvZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICByZWxwYXRoOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sLm1kJyxcbiAgICAgICAgICAgIC8vICByZWxyZW5kZXI6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnLFxuICAgICAgICAgICAgLy8gIHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbmRlclRvOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sJ1xuICAgICAgICAgICAgLy8gfSB0byAuLi8uLi8uLi9pbmRleC5odG1sXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzXG4gICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gXG4gICAgICAgICAgICAvLyAgICAgYSkgZW5zdXJlIGFsbCByZWxhdGl2ZSBwYXRocyBhcmUgbWFkZSBhYnNvbHV0ZVxuICAgICAgICAgICAgLy8gICAgIGIpIHRoZXJlZm9yZSBhbGwgYWJzb2x1dGUgcGF0aHMgd2hlbiBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIC8vICAgICAgICBpcyBmb3IgYSBuZXN0ZWQgc3ViZGlyZWN0b3J5IG11c3QgaGF2ZSB0aGUgcGF0aFxuICAgICAgICAgICAgLy8gICAgICAgIHByZWZpeGVkIHdpdGggdGhlIHN1YmRpcmVjdG9yeVxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiBocmVmIG11c3QgYmUgdXBkYXRlZCBmb3IgY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgIGxldCBwUm9vdFVybCA9IHVybC5wYXJzZSh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsKTtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgVVJMIGhhcyBhbHJlYWR5IGJlZW4gcmV3cml0dGVuXG4gICAgICAgICAgICAgICAgaWYgKCFocmVmLnN0YXJ0c1dpdGgocFJvb3RVcmwucGF0aG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocFJvb3RVcmwucGF0aG5hbWUsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgICAgICAvKiBpZiAobWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9PT0gJ2luZGV4Lmh0bWwubWQnKSBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gaHJlZiAke2hyZWZ9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCAke3RoaXMuYXJyYXkub3B0aW9ucy5jb25maWcucm9vdF91cmx9IG5ld0hyZWYgJHtuZXdIcmVmfWApOyAqIC9cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgLy8gTG9vayB0byBzZWUgaWYgaXQncyBhbiBhc3NldCBmaWxlXG4gICAgICAgICAgICBsZXQgZm91bmRBc3NldDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZEFzc2V0KSB7IC8vICYmIGZvdW5kQXNzZXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kQXNzZXQgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIEFzayBwbHVnaW5zIGlmIHRoZSBocmVmIGlzIG9rYXlcbiAgICAgICAgICAgIGlmICh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihhYnNvbHV0ZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBsaW5rIGhhcyBhIGJvZHksIHRoZW4gZG9uJ3QgbW9kaWZ5IGl0XG4gICAgICAgICAgICBpZiAoKGxpbmt0ZXh0ICYmIGxpbmt0ZXh0Lmxlbmd0aCA+IDAgJiYgbGlua3RleHQgIT09IGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICB8fCAoJGxpbmsuY2hpbGRyZW4oKS5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIHNraXBwaW5nICR7YWJzb2x1dGVQYXRofSB3LyAke3V0aWwuaW5zcGVjdChsaW5rdGV4dCl9IGNoaWxkcmVuPSAkeyRsaW5rLmNoaWxkcmVuKCl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRG9lcyBpdCBleGlzdCBpbiBkb2N1bWVudHMgZGlyP1xuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmRSZW5kZXJzVG8gJHthYnNvbHV0ZVBhdGh9ICR7dXRpbC5pbnNwZWN0KGZvdW5kKX1gKTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJzVG8gJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBkaXJlY3RvcnksIHRoZXJlIG1pZ2h0IGJlIC9wYXRoL3RvL2luZGV4Lmh0bWwgc28gd2UgdHJ5IGZvciB0aGF0LlxuICAgICAgICAgICAgLy8gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGggd291bGQgZmFpbCBvbiBqdXN0IC9wYXRoL3RvIGJ1dCBzdWNjZWVkXG4gICAgICAgICAgICAvLyBvbiAvcGF0aC90by9pbmRleC5odG1sXG4gICAgICAgICAgICBpZiAoZm91bmQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIFwiaW5kZXguaHRtbFwiKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBsb29rIGludG8gZmlsbGluZyBlbXB0aW5lc3Mgd2l0aCB0aXRsZVxuXG4gICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyZXJQYXRoICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRvY21ldGEgPSBmb3VuZC5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvKiB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jbWV0YSA9IGF3YWl0IHJlbmRlcmVyLm1ldGFkYXRhKGZvdW5kLmZvdW5kRGlyLCBmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJldHJpZXZlIGRvY3VtZW50IG1ldGFkYXRhIGZvciAke2ZvdW5kLmZvdW5kRGlyfSAke2ZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcn0gYmVjYXVzZSAke2Vycn1gKTtcbiAgICAgICAgICAgICAgICB9ICotLS9cbiAgICAgICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RpdGxlJywgZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsudGV4dChkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluaXNoZWRgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gRE9ORSAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBib3RoZXIgdGhyb3dpbmcgYW4gZXJyb3IuICBKdXN0IGZpbGwgaXQgaW4gd2l0aFxuICAgICAgICAgICAgICAgIC8vIHNvbWV0aGluZy5cbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbGwgaW4gZW1wdHkgJ2EnIGVsZW1lbnQgaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSB3aXRoIGhyZWYgJHtocmVmfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8gIE1BSEFGVU5DUyBGT1IgRklOQUwgUEFTU1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIDxjb2RlPm11bmdlZD15ZXM8L2NvZGU+IGF0dHJpYnV0ZSB0aGF0IGlzIGFkZGVkXG4gKiBieSA8Y29kZT5BbmNob3JDbGVhbnVwPC9jb2RlPi5cbiAqL1xuY2xhc3MgTXVuZ2VkQXR0clJlbW92ZXIgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ211bmdlZCcpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLyBOdW5qdWNrcyBFeHRlbnNpb25zXG5cbi8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvZnRvbmljL251bmp1Y2tzLWluY2x1ZGUtd2l0aC90cmVlL21hc3RlclxuXG5jbGFzcyBzdHlsZXNoZWV0c0V4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha3N0eWxlc2hlZXRzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtzdHlsZXNoZWV0cycpO1xuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc3R5bGVzaGVldHNFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvU3R5bGVzaGVldHMoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtoZWFkZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2hlYWRlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvSGVhZGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2Zvb3RlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrZm9vdGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9Gb290ZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0ZXN0RXh0ZW5zaW9uKCkge1xuICAgIHRoaXMudGFncyA9IFsgJ2FrbmprdGVzdCcgXTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbihwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuY29uc29sZS5sb2coYGluIHRlc3RFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlcnJvcicsICdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIHZhciBlcnJvckJvZHkgPSBudWxsO1xuXG4gICAgICAgICAgICBpZihwYXJzZXIuc2tpcFN5bWJvbCgnZXJyb3InKSkge1xuICAgICAgICAgICAgICAgIHBhcnNlci5za2lwKGxleGVyLlRPS0VOX0JMT0NLX0VORCk7XG4gICAgICAgICAgICAgICAgZXJyb3JCb2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5LCBlcnJvckJvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB0ZXN0RXh0aW9uc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbihjb250ZXh0LCB1cmwsIGJvZHksIGVycm9yQm9keSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgYWtuamt0ZXN0ICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfSAke3V0aWwuaW5zcGVjdCh1cmwpfSAke3V0aWwuaW5zcGVjdChib2R5KX0gJHt1dGlsLmluc3BlY3QoZXJyb3JCb2R5KX1gKTtcbiAgICB9O1xuXG59Il19