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
import cheerio from 'cheerio';
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
                console.log(`WARNING: Did not find ${href} in ${util.inspect(this.array.options.config.documentDirs)} in ${metadata.document.path} absolutePath ${absolutePath}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFDbkMsT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDO0FBQzNCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7QUFFdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxJQUFJLE1BQU0sY0FBYyxDQUFDO0FBQ2hDLE9BQU8sT0FBTyxNQUFNLFNBQVMsQ0FBQztBQUM5QixPQUFPLFNBQVMsTUFBTSxXQUFXLENBQUM7QUFDbEMsT0FBTyxZQUFZLE1BQU0sNEJBQTRCLENBQUM7QUFFdEQsT0FBTyxTQUFTLE1BQU0sc0JBQXNCLENBQUM7QUFDN0MsTUFBTSxnQkFBZ0IsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUM7QUFFcEQsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUM7QUFFdkMsTUFBTSxPQUFPLGFBQWMsU0FBUSxNQUFNO0lBQ3hDO1FBQ0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBS2hCLHdDQUFRO1FBQ1IsOENBQWM7UUFMVix1QkFBQSxJQUFJLCtCQUFpQixFQUFFLE1BQUEsQ0FBQztJQUUvQixDQUFDO0lBS0QsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPO1FBQ2xCLHVCQUFBLElBQUkseUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3RDLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixLQUFLLFdBQVcsRUFBRSxDQUFDO1lBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1FBQzVDLENBQUM7UUFDRCxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsS0FBSyxXQUFXLEVBQUUsQ0FBQztZQUM1RCxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixHQUFHLElBQUksQ0FBQztRQUM5QyxDQUFDO1FBQ0QsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEtBQUssV0FBVyxFQUFFLENBQUM7WUFDMUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUM7UUFDNUMsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUM3QixJQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QyxnRUFBZ0U7UUFDaEUsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNoRSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLHlEQUF5RDtRQUN6RCx3REFBd0Q7UUFDeEQscURBQXFEO1FBQ3JELGlFQUFpRTtRQUNqRSx3REFBd0Q7UUFDeEQsbUVBQW1FO1FBQ25FLHNFQUFzRTtRQUN0RSw0Q0FBNEM7UUFDNUMsbURBQW1EO1FBQ25ELDJDQUEyQztRQUMzQyxPQUFPO1FBQ1AsTUFBTSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDO1FBQzVDLHNEQUFzRDtRQUN0RCx3Q0FBd0M7UUFDeEMsNEJBQTRCO1FBQzVCLDZCQUE2QjtRQUM3Qix1QkFBdUI7U0FDMUIsQ0FBQyxDQUFDLENBQUM7UUFDSixNQUFNLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRTdDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEQsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLEVBQ3JDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQ25ELENBQUM7UUFDRixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsWUFBWSxDQUFDLFlBQVksRUFDbEMsSUFBSSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsQ0FDeEQsQ0FBQztRQUNGLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxFQUNsQyxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUN4RCxDQUFDO1FBRUYsNENBQTRDO1FBQzVDLEtBQUssTUFBTSxHQUFHLElBQUk7WUFDTixlQUFlO1lBQ2YsWUFBWTtZQUNaLFlBQVk7U0FDdkIsRUFBRSxDQUFDO1lBQ0EsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2Q0FBNkMsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUN4RSxDQUFDO1FBQ0wsQ0FBQztRQUdELFFBQVE7UUFDUixtRUFBbUU7UUFDbkUsa0JBQWtCO1FBQ2xCLGtDQUFrQztRQUNsQyxJQUFJO1FBRUosaURBQWlEO1FBQ2pELHVEQUF1RDtRQUN2RCxXQUFXO1FBQ1gsdUNBQXVDO1FBQ3ZDLElBQUk7SUFDUixDQUFDO0lBRUQsSUFBSSxNQUFNLEtBQUssT0FBTyx1QkFBQSxJQUFJLDZCQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLG1EQUFtRDtJQUVuRCxJQUFJLFdBQVcsS0FBSyxPQUFPLHVCQUFBLElBQUksbUNBQWMsQ0FBQyxDQUFDLENBQUM7SUFFaEQ7OztPQUdHO0lBQ0gsSUFBSSxtQkFBbUIsQ0FBQyxHQUFHO1FBQ3ZCLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLEdBQUcsR0FBRyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLHFCQUFxQixDQUFDLEdBQUc7UUFDekIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxHQUFHLENBQUM7SUFDN0MsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksbUJBQW1CLENBQUMsR0FBRztRQUN2QixJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztJQUMzQyxDQUFDO0lBRUQsYUFBYSxDQUFDLFFBQVE7UUFDckIsT0FBTyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsa0JBQWtCLENBQUMsUUFBUTtRQUMxQixPQUFPLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELGtCQUFrQixDQUFDLFFBQVE7UUFDMUIsT0FBTyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPO1FBQ2hELHVCQUFBLElBQUksbUNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU07UUFFdkIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO1FBQ3ZELDZCQUE2QjtRQUM3QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDakQsMEJBQTBCO1FBQzFCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxJQUFJLG1DQUFjLENBQUM7ZUFDakMsdUJBQUEsSUFBSSxtQ0FBYyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUVuQyxJQUFJLFFBQVEsR0FBRyx1QkFBQSxJQUFJLG1DQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFeEMsSUFBSSxVQUFVLENBQUM7WUFDZixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDakMsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQzlCLFFBQVEsQ0FBQyxHQUFHLENBQ2YsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFVBQVUsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQzlCLENBQUM7WUFFRCxJQUFJLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFFeEIsSUFBSSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzFDLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1IsT0FBTyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDM0IsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztZQUMvQyxDQUFDO1lBQ0QsSUFBSSxDQUFDLE9BQU87Z0JBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtRUFBbUUsVUFBVSxFQUFFLENBQUMsQ0FBQztZQUUvRyxJQUFJLENBQUM7Z0JBQ0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQy9CLElBQUksT0FBTyxHQUFHLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUN0RSxrREFBa0Q7Z0JBQ2xELHdCQUF3QjtnQkFDeEIsSUFBSSxXQUFXLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUNyRSxJQUFJLFVBQVUsQ0FBQztnQkFDZixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztvQkFDL0IsVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUNsRSxDQUFDO3FCQUFNLENBQUM7b0JBQ0oseURBQXlEO29CQUN6RCwwQkFBMEI7b0JBQzFCLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUNkLE1BQU0sQ0FBQyxpQkFBaUIsRUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQzlCLFdBQVcsQ0FBQyxDQUFDO2dCQUN6QixDQUFDO2dCQUVELDZDQUE2QztnQkFDN0MsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDL0QsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNULE1BQU0sSUFBSSxLQUFLLENBQUMscUNBQXFDLE9BQU8sY0FBYyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNuSixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7Q0FFSjs7QUFFRCxNQUFNLENBQUMsTUFBTSxjQUFjLEdBQUcsVUFBUyxPQUFPO0lBQzFDLElBQUksR0FBRyxHQUFHLElBQUksU0FBUyxDQUFDLGFBQWEsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0QsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLGtCQUFrQixFQUFFLENBQUMsQ0FBQztJQUMxQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDLENBQUM7SUFDeEMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLG1CQUFtQixFQUFFLENBQUMsQ0FBQztJQUMzQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFDO0lBQ3JDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxjQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxhQUFhLEVBQUUsQ0FBQyxDQUFDO0lBRXJDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGlCQUFpQixFQUFFLENBQUMsQ0FBQztJQUU5QyxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUMsQ0FBQztBQUVGLFNBQVMsY0FBYyxDQUFDLFFBQVEsRUFBRSxPQUFPO0lBQ3JDLDJEQUEyRDtJQUUzRCxJQUFJLE9BQU8sQ0FBQztJQUNaLElBQUksT0FBTyxRQUFRLENBQUMsb0JBQW9CLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDdkQsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDdkYsQ0FBQztTQUFNLENBQUM7UUFDSixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0lBQ3RGLENBQUM7SUFDRCwyS0FBMks7SUFFM0ssSUFBSSxDQUFDLE9BQU87UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7SUFDM0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO0lBRXpFLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNiLElBQUksT0FBTyxPQUFPLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDakMsS0FBSyxJQUFJLEtBQUssSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUV4QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQzNCLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDOUMsc0RBQXNEO1lBQ3RELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkQsc0JBQXNCO2dCQUN0Qiw2QkFBNkI7Z0JBQzdCLElBQUksT0FBTyxDQUFDLG1CQUFtQjt1QkFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO29CQUM3Qjs7Ozs7Ozs7d0JBUUk7b0JBQ0osSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDcEUsNkhBQTZIO29CQUM3SCxTQUFTLEdBQUcsT0FBTyxDQUFDO2dCQUN4QixDQUFDO1lBQ0wsQ0FBQztZQUNELElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsa0RBQWtELEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3RGLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6QyxDQUFDO1lBQ0QsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNwQixDQUFDO1FBQ0Qsd0NBQXdDO0lBQzVDLENBQUM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLE9BQU87SUFDakQsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ2IsSUFBSSxDQUFDLE9BQU87UUFBRSxPQUFPLEdBQUcsQ0FBQztJQUV0QixJQUFJLENBQUMsT0FBTztRQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztJQUMzRCxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7SUFFekUsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNwQyxNQUFNLElBQUksS0FBSyxDQUFDLHlDQUF5QyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsRixDQUFDO1FBQ0ssSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO1lBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEQsSUFBSSxNQUFNLENBQUMsSUFBSTtZQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2RCxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNkLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDN0IsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMvQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ3ZELHNCQUFzQjtnQkFDdEIsNkJBQTZCO2dCQUM3QixJQUFJLE9BQU8sQ0FBQyxxQkFBcUI7dUJBQzdCLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztvQkFDOUIsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDckUsK0hBQStIO29CQUMvSCxVQUFVLEdBQUcsT0FBTyxDQUFDO2dCQUN6QixDQUFDO2dCQUNEOzs7OztvQkFLSTtZQUNSLENBQUM7WUFDRCxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUNELEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUNELHVDQUF1QztJQUN2QyxPQUFPLEdBQUcsQ0FBQztBQUNaLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxPQUFPO0lBQzdDLElBQUksT0FBTyxDQUFDO0lBQ1osSUFBSSxPQUFPLFFBQVEsQ0FBQyxzQkFBc0IsS0FBSyxXQUFXLEVBQUUsQ0FBQztRQUM1RCxPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsc0JBQXNCLENBQUMsQ0FBQztJQUN4RixDQUFDO1NBQU0sQ0FBQztRQUNQLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDckYsQ0FBQztJQUNELCtEQUErRDtJQUMvRCw4RUFBOEU7SUFDOUUsT0FBTyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsT0FBTztJQUM3QyxJQUFJLE9BQU8sQ0FBQztJQUNaLElBQUksT0FBTyxRQUFRLENBQUMseUJBQXlCLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDL0QsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUM5RixDQUFDO1NBQU0sQ0FBQztRQUNQLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUN4RixDQUFDO0lBQ0QsT0FBTyxjQUFjLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNuRCxDQUFDO0FBRUQsTUFBTSxrQkFBbUIsU0FBUSxTQUFTLENBQUMsYUFBYTtJQUN2RCxJQUFJLFdBQVcsS0FBSyxPQUFPLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBa0IsRUFBRSxJQUFlO1FBQ3BFLElBQUksR0FBRyxHQUFJLGNBQWMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsRCwyQ0FBMkM7UUFDM0MsT0FBTyxHQUFHLENBQUM7SUFDbEIsQ0FBQztDQUNEO0FBRUQsTUFBTSxnQkFBaUIsU0FBUSxTQUFTLENBQUMsYUFBYTtJQUNyRCxJQUFJLFdBQVcsS0FBSyxPQUFPLHFCQUFxQixDQUFDLENBQUMsQ0FBQztJQUNuRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBa0IsRUFBRSxJQUFlO1FBQ3BFLElBQUksR0FBRyxHQUFHLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RELHlDQUF5QztRQUN6QyxPQUFPLEdBQUcsQ0FBQztJQUNsQixDQUFDO0NBQ0Q7QUFFRCxNQUFNLGdCQUFpQixTQUFRLFNBQVMsQ0FBQyxhQUFhO0lBQ3JELElBQUksV0FBVyxLQUFLLE9BQU8scUJBQXFCLENBQUMsQ0FBQyxDQUFDO0lBQ25ELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ3RDLE9BQU8sbUJBQW1CLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUQsQ0FBQztDQUNEO0FBRUQsTUFBTSxtQkFBb0IsU0FBUSxTQUFTLENBQUMsTUFBTTtJQUM5QyxJQUFJLFFBQVEsS0FBSyxPQUFPLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUMzQyxJQUFJLFdBQVcsS0FBSyxPQUFPLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEtBQUs7UUFDbkMsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUI7WUFBRSxPQUFPO1FBQ3BELElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFOUIsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN2RCxvQkFBb0I7WUFDcEIsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ3hCLDhCQUE4QjtnQkFDOUIsSUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDL0QsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDaEMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxNQUFNLGlCQUFrQixTQUFRLFNBQVMsQ0FBQyxNQUFNO0lBQzVDLElBQUksUUFBUSxLQUFLLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNuQyxJQUFJLFdBQVcsS0FBSyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDdEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ25DLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMscUJBQXFCO1lBQUUsT0FBTztRQUN0RCxJQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTdCLElBQUksSUFBSSxFQUFFLENBQUM7WUFDUCxrQkFBa0I7WUFDbEIsSUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDdkQsb0JBQW9CO2dCQUNwQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsOEJBQThCO29CQUM5QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO29CQUMvRCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDL0IsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsTUFBTSxZQUFhLFNBQVEsU0FBUyxDQUFDLGFBQWE7SUFDakQsSUFBSSxXQUFXLEtBQUssT0FBTyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLO1FBQ2hDLElBQUksQ0FBQztZQUNYLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUMvQixvQkFBb0IsRUFBRTtnQkFDL0QsTUFBTSxFQUFFLE9BQU8sUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLFdBQVc7b0JBQ25ELENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNO2FBQzFDLENBQUMsQ0FBQztRQUNHLENBQUM7UUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1QsT0FBTyxDQUFDLEtBQUssQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUMvQyxNQUFNLENBQUMsQ0FBQztRQUNaLENBQUM7SUFDUixDQUFDO0NBQ0Q7QUFFRCxNQUFNLGNBQWUsU0FBUSxTQUFTLENBQUMsYUFBYTtJQUNuRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSztRQUMvQixJQUFJLE9BQU8sUUFBUSxDQUFDLGNBQWMsS0FBSyxXQUFXO2VBQzlDLFFBQVEsQ0FBQyxjQUFjLElBQUksRUFBRTtlQUM3QixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDbEIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtnQkFDL0MsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZELENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO2dCQUNELE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwQixDQUFDLENBQUMsQ0FBQztRQUNKLENBQUM7O1lBQU0sT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRDtBQUVELE1BQU0sU0FBVSxTQUFRLFNBQVMsQ0FBQyxhQUFhO0lBQzNDLElBQUksV0FBVyxLQUFLLE9BQU8sWUFBWSxDQUFDLENBQUMsQ0FBQztJQUMxQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbkMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvQixJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUNuQixNQUFNLElBQUksS0FBSyxDQUFDLGdEQUFnRCxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFFRCxJQUFJLE9BQU8sQ0FBQztRQUNaLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ3RCLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDakIsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEUsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUM1RSxNQUFNLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFFRCxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyRCxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDcEQsSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUNELENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0IsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ2xCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFDRCxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDdEIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtnQkFDakMsUUFBUSxFQUFFLElBQUk7YUFDakIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2QsQ0FBQzthQUFNLENBQUM7WUFDSixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEQsQ0FBQztRQUNELE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQUVELE1BQU0sV0FBWSxTQUFRLFNBQVMsQ0FBQyxhQUFhO0lBQzdDLElBQUksV0FBVyxLQUFLLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQztJQUN2QyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxRQUFRO1lBQUUsUUFBUSxHQUFHLG9CQUFvQixDQUFDO1FBQy9DLE1BQU0sSUFBSSxHQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLElBQUk7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDM0QsTUFBTSxLQUFLLEdBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLEVBQUUsR0FBUSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNoQyxNQUFNLEtBQUssR0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxJQUFJLEdBQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO1lBQ3JDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUk7U0FDL0MsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBRUQsTUFBTSxlQUFnQixTQUFRLFNBQVMsQ0FBQyxhQUFhO0lBQ2pELElBQUksV0FBVyxLQUFLLE9BQU8sdUJBQXVCLENBQUMsQ0FBQyxDQUFDO0lBQ3JELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsSUFBSTtRQUN6Qyx5QkFBeUI7UUFDekIsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDbEMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQzNCLENBQUMsQ0FBRSxvQkFBb0IsQ0FBQztRQUNoQyxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakMsTUFBTSxJQUFJLEdBQU0sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0QyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDaEMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFYixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUMzQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFO1lBQ3JDLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsUUFBUTtZQUMvRCxPQUFPLEVBQUUsT0FBTztTQUNuQixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFFRCxNQUFNLGFBQWMsU0FBUSxTQUFTLENBQUMsTUFBTTtJQUN4QyxJQUFJLFFBQVEsS0FBSyxPQUFPLGVBQWUsQ0FBQyxDQUFDLENBQUM7SUFDMUMsSUFBSSxXQUFXLEtBQUssT0FBTyxlQUFlLENBQUMsQ0FBQyxDQUFDO0lBQzdDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyx5QkFBeUI7UUFFekIsdUNBQXVDO1FBQ3ZDLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hDLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsT0FBTztZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRS9DLG9DQUFvQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQy9DLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFekMsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNkLHlDQUF5QztZQUN6QyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztpQkFDdkMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU5RSxJQUFJLFFBQVEsRUFBRSxDQUFDO2dCQUNYLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUM1QixHQUFHLEdBQUcsUUFBUSxDQUFDO1lBQ25CLENBQUM7WUFFRCw2QkFBNkI7WUFDN0IsS0FBSyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUNqQyxLQUFLLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2xDLENBQUM7UUFFRCxrRUFBa0U7UUFDbEUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDdkIsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM3RCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztZQUMxQixnRkFBZ0Y7WUFDaEYsR0FBRyxHQUFHLE1BQU0sQ0FBQztRQUNqQixDQUFDO1FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7VUFtQkU7UUFDRixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUFFRCxNQUFNLFdBQVksU0FBUSxTQUFTLENBQUMsYUFBYTtJQUM3QyxJQUFJLFdBQVcsS0FBSyxPQUFPLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLEtBQUs7UUFDbkMsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN6QyxJQUFJLENBQUMsUUFBUTtZQUFFLFFBQVEsR0FBRywwQkFBMEIsQ0FBQztRQUNyRCxJQUFJLElBQUksR0FBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxJQUFJO1lBQUUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUMsQ0FBQztRQUNqRixNQUFNLEtBQUssR0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sRUFBRSxHQUFRLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hDLE1BQU0sS0FBSyxHQUFLLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkMsTUFBTSxLQUFLLEdBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxNQUFNLElBQUksR0FBTSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDcEQsSUFBSSxRQUFRLENBQUM7UUFDYixJQUFJLENBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3pCLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7YUFBTSxDQUFDO1lBQ0osUUFBUSxHQUFHLElBQUksQ0FBQztRQUNwQixDQUFDO1FBQ0QsNkVBQTZFO1FBQzdFLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztRQUM1RSxNQUFNLEdBQUcsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0MsTUFBTSxJQUFJLEdBQUc7WUFDVCxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsWUFBWTtZQUMxRCxRQUFRLEVBQUUsR0FBRztTQUNoQixDQUFDO1FBQ0YsSUFBSSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNuRCx1RUFBdUU7UUFDdkUsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0NBQ0o7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt1REErQnVEO0FBRXZELEVBQUU7QUFDRixpREFBaUQ7QUFDakQsMEJBQTBCO0FBQzFCLDBCQUEwQjtBQUMxQixxQkFBcUI7QUFDckIsRUFBRTtBQUNGLE1BQU0sY0FBZSxTQUFRLFNBQVMsQ0FBQyxNQUFNO0lBQ3pDLElBQUksUUFBUSxLQUFLLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQzVDLElBQUksV0FBVyxLQUFLLE9BQU8saUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBRS9DLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNuQixDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsQyxNQUFNLEVBQUUsR0FBTSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLE1BQU0sRUFBRSxHQUFNLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3hCLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUN4QixDQUFDLENBQUMsS0FBSyxDQUFDO1FBRXBCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNsQyxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFFcEIsT0FBTyxLQUFLLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDakQsbURBQW1EO1lBQ25ELE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN2RCxtQkFBbUI7WUFDbkIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEIsMENBQTBDO1lBQzFDLE9BQU8sUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXhCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxNQUFNLEVBQUUsQ0FBQztRQUN2QixLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLEtBQUssT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksRUFBRTtZQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztZQUMzQixRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLElBQUksS0FBSztZQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsS0FBSyxJQUFJLE1BQU0sSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUMxQixRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFFRCxPQUFPLEVBQUUsQ0FBQztJQUNkLENBQUM7Q0FDSjtBQUVELE1BQU0sYUFBYyxTQUFRLFNBQVMsQ0FBQyxNQUFNO0lBQ3hDLElBQUksUUFBUSxLQUFLLE9BQU8sNEJBQTRCLENBQUMsQ0FBQyxDQUFDO0lBQ3ZELElBQUksV0FBVyxLQUFLLE9BQU8sNEJBQTRCLENBQUMsQ0FBQyxDQUFDO0lBRTFELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSztRQUNuQyxJQUFJLElBQUksR0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM1QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7UUFDNUUsNkJBQTZCO1FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztRQUN0RSwwQkFBMEI7UUFDMUIsb0RBQW9EO1FBQ3BELElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUN2QixJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDeEMsSUFBSSxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxPQUFPO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1lBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUTtnQkFBRSxPQUFPLElBQUksQ0FBQztZQUVqQzs7O2dCQUdJO1lBRUosOEJBQThCO1lBRTlCLDJDQUEyQztZQUMzQyxpRUFBaUU7WUFDakUscUVBQXFFO1lBQ3JFLHFEQUFxRDtZQUVyRCwyQ0FBMkM7WUFDM0Msb0RBQW9EO1lBQ3BELDBDQUEwQztZQUMxQyx1REFBdUQ7WUFDdkQseURBQXlEO1lBQ3pELEVBQUU7WUFDRiw4REFBOEQ7WUFDOUQsdUNBQXVDO1lBQ3ZDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTVCLElBQUksWUFBWSxDQUFDO1lBRWpCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNuQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMvRSxzRUFBc0U7WUFDMUUsQ0FBQztpQkFBTSxDQUFDO2dCQUNKLFlBQVksR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1lBQ2xDLENBQUM7WUFFRCwrREFBK0Q7WUFDL0QsbURBQW1EO1lBQ25ELGdFQUFnRTtZQUNoRSxFQUFFO1lBQ0YsV0FBVztZQUNYLEVBQUU7WUFDRixrREFBa0Q7WUFDbEQsdUVBQXVFO1lBQ3ZFLG9EQUFvRDtZQUNwRCxtREFBbUQ7WUFDbkQsaURBQWlEO1lBQ2pELGlEQUFpRDtZQUNqRCwyQkFBMkI7WUFDM0IsRUFBRTtZQUVGLDZCQUE2QjtZQUM3QixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG1CQUFtQjttQkFDdEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUN4QixJQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUMvRCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDNUIsNkdBQTZHO1lBQ2pILENBQUM7WUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztjQW1CRTtZQUVGLG9DQUFvQztZQUNwQyxJQUFJLFVBQVUsQ0FBQztZQUNmLElBQUksQ0FBQztnQkFDRCxVQUFVLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ2pELENBQUM7WUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUNULFVBQVUsR0FBRyxTQUFTLENBQUM7WUFDM0IsQ0FBQztZQUNELElBQUksVUFBVSxFQUFFLENBQUMsQ0FBQyw4QkFBOEI7Z0JBQzVDLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCx1SEFBdUg7WUFFdkgsa0NBQWtDO1lBQ2xDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUM7Z0JBQ25FLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFFRCxnREFBZ0Q7WUFDaEQsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxRQUFRLEtBQUssWUFBWSxDQUFDO21CQUMzRCxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDbkMsb0hBQW9IO2dCQUNwSCxPQUFPLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRUQsa0NBQWtDO1lBQ2xDLElBQUksS0FBSyxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUMvQyxxRkFBcUY7WUFDckYsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksaUJBQWlCLFlBQVksRUFBRSxDQUFDLENBQUM7Z0JBQ2xLLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUM7WUFDRCwySEFBMkg7WUFFM0gsaUZBQWlGO1lBQ2pGLHlHQUF5RztZQUN6Ryx5QkFBeUI7WUFDekIsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ3BCLEtBQUssR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNULE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ3BJLENBQUM7WUFDTCxDQUFDO1lBQ0QsbURBQW1EO1lBRW5ELElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUM7WUFDaEMsdUNBQXVDO1lBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25ELEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQ0QsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMzQixLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLENBQUM7Z0JBQ0osS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2NBMEJFO1FBQ04sQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLElBQUksQ0FBQztRQUNoQixDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsMENBQTBDO0FBRTFDOzs7R0FHRztBQUNILE1BQU0saUJBQWtCLFNBQVEsU0FBUyxDQUFDLE1BQU07SUFDNUMsSUFBSSxRQUFRLEtBQUssT0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDaEQsSUFBSSxXQUFXLEtBQUssT0FBTyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDbkQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFrQixFQUFFLElBQWU7UUFDcEUseUJBQXlCO1FBQ3pCLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUIsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0NBQ0o7QUFFRCxrQ0FBa0M7QUFFbEMscUVBQXFFO0FBRXJFLE1BQU0sb0JBQW9CO0lBS3RCLFlBQVksTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXO1FBQ25DLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBRSxlQUFlLENBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUUvQiw0SEFBNEg7SUFDaEksQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUs7UUFDdEIsa0RBQWtEO1FBQ2xELElBQUksQ0FBQztZQUNELG9CQUFvQjtZQUNwQixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7WUFHN0IsNERBQTREO1lBQzVELDREQUE0RDtZQUM1RCxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM3QyxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXZDLGlFQUFpRTtZQUNqRSxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUV2RCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUU5QiwwQ0FBMEM7WUFDMUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEQsQ0FBQztJQUNMLENBQUM7SUFFRCxHQUFHLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJO1FBQ25CLGdFQUFnRTtRQUNoRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBQUEsQ0FBQztDQUNMO0FBRUQsTUFBTSx5QkFBeUI7SUFLM0IsWUFBWSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVc7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBRS9CLGlJQUFpSTtJQUNySSxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSztRQUN0Qix1REFBdUQ7UUFDdkQsSUFBSSxDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7SUFDTCxDQUFDO0lBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtRQUNuQixxRUFBcUU7UUFDckUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQUEsQ0FBQztDQUNMO0FBRUQsTUFBTSx5QkFBeUI7SUFLM0IsWUFBWSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVc7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFFLFlBQVksQ0FBRSxDQUFDO1FBQzdCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBRS9CLGlJQUFpSTtJQUNySSxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSztRQUN0Qix1REFBdUQ7UUFDdkQsSUFBSSxDQUFDO1lBQ0QsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzdDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNELENBQUM7SUFDTCxDQUFDO0lBRUQsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSTtRQUNuQixxRUFBcUU7UUFDckUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBQUEsQ0FBQztDQUNMO0FBRUQsU0FBUyxhQUFhO0lBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBRSxXQUFXLENBQUUsQ0FBQztJQUU1QixJQUFJLENBQUMsS0FBSyxHQUFHLFVBQVMsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLO1FBQzlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUM7WUFDRCxvQkFBb0I7WUFDcEIsSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBRzdCLDREQUE0RDtZQUM1RCw0REFBNEQ7WUFDNUQsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDN0MsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUV2QyxpRUFBaUU7WUFDakUsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxjQUFjLENBQUMsQ0FBQztZQUM1RCxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFFckIsSUFBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuQyxTQUFTLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUU5QiwwQ0FBMEM7WUFDMUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUM7SUFDTCxDQUFDLENBQUM7SUFHRixJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQyxDQUFDO0FBRU4sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjIgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgZnNwIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gJ3V1aWQnO1xuY29uc3QgdXVpZHYxID0gdXVpZC52MTtcbmltcG9ydCAqIGFzIHJlbmRlciBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5pbXBvcnQgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuaW1wb3J0IGhsanMgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0IG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuaW1wb3J0IG1haGFNZXRhZGF0YSBmcm9tICdtYWhhYmh1dGEvbWFoYS9tZXRhZGF0YS5qcyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5pbXBvcnQgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmNvbnN0IE51bmp1Y2tzUmVuZGVyZXIgPSBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcblxuY29uc3QgcGx1Z2luTmFtZSA9IFwiYWthc2hhY21zLWJ1aWx0aW5cIjtcblxuZXhwb3J0IGNsYXNzIEJ1aWx0SW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcihwbHVnaW5OYW1lKTtcbiAgICAgICAgdGhpcy4jcmVzaXplX3F1ZXVlID0gW107XG5cblx0fVxuXG4gICAgI2NvbmZpZztcbiAgICAjcmVzaXplX3F1ZXVlO1xuXG5cdGNvbmZpZ3VyZShjb25maWcsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID8gb3B0aW9ucyA6IHt9O1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUJvZHlMaW5rcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgbGV0IG1vZHVsZURpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuICAgICAgICAvLyBOZWVkIHRoaXMgYXMgdGhlIHBsYWNlIHRvIHN0b3JlIE51bmp1Y2tzIG1hY3JvcyBhbmQgdGVtcGxhdGVzXG4gICAgICAgIGNvbmZpZy5hZGRMYXlvdXRzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAnbGF5b3V0cycpKTtcbiAgICAgICAgY29uZmlnLmFkZFBhcnRpYWxzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAncGFydGlhbHMnKSk7XG4gICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAvLyBpbiB0aGUgQ29uZmlndXJhdGlvbiBjb25zdHJ1Y3Rvci4gIFRoZSBpZGVhIGlzIHRvIHB1dFxuICAgICAgICAvLyBtYWhhUGFydGlhbCBhcyB0aGUgdmVyeSBmaXJzdCBNYWhhZnVuYyBzbyB0aGF0IGFsbFxuICAgICAgICAvLyBQYXJ0aWFsJ3MgYXJlIGhhbmRsZWQgYmVmb3JlIGFueXRoaW5nIGVsc2UuICBUaGUgaXNzdWUgY2F1c2luZ1xuICAgICAgICAvLyB0aGlzIGNoYW5nZSBpcyB0aGUgT3BlbkdyYXBoUHJvbW90ZUltYWdlcyBNYWhhZnVuYyBpblxuICAgICAgICAvLyBha2FzaGFjaHMtYmFzZSBhbmQgcHJvY2Vzc2luZyBhbnkgaW1hZ2VzIGJyb3VnaHQgaW4gYnkgcGFydGlhbHMuXG4gICAgICAgIC8vIEVuc3VyaW5nIHRoZSBwYXJ0aWFsIHRhZyBpcyBwcm9jZXNzZWQgYmVmb3JlIE9wZW5HcmFwaFByb21vdGVJbWFnZXNcbiAgICAgICAgLy8gbWVhbnQgc3VjaCBpbWFnZXMgd2VyZSBwcm9wZXJseSBwcm9tb3RlZC5cbiAgICAgICAgLy8gY29uZmlnLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgIC8vICAgICByZW5kZXJQYXJ0aWFsOiBvcHRpb25zLnJlbmRlclBhcnRpYWxcbiAgICAgICAgLy8gfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFNZXRhZGF0YS5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICAvLyBEbyBub3QgcGFzcyB0aGlzIHRocm91Z2ggc28gdGhhdCBNYWhhYmh1dGEgd2lsbCBub3RcbiAgICAgICAgICAgIC8vIG1ha2UgYWJzb2x1dGUgbGlua3MgdG8gc3ViZGlyZWN0b3JpZXNcbiAgICAgICAgICAgIC8vIHJvb3RfdXJsOiBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIC8vIFRPRE8gaG93IHRvIGNvbmZpZ3VyZSB0aGlzXG4gICAgICAgICAgICAvLyBzaXRlbWFwX3RpdGxlOiAuLi4uP1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYWJodXRhQXJyYXkob3B0aW9ucykpO1xuXG4gICAgICAgIGNvbnN0IG5qayA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlck5hbWUoJy5odG1sLm5qaycpO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgIG5ldyBzdHlsZXNoZWV0c0V4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgIG5ldyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG4gICAgICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrZm9vdGVyanMnLFxuICAgICAgICAgICAgbmV3IGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgZXh0ZW5zaW9ucyB3ZXJlIGluc3RhbGxlZFxuICAgICAgICBmb3IgKGNvbnN0IGV4dCBvZiBbXG4gICAgICAgICAgICAgICAgICAgICdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FraGVhZGVyanMnLFxuICAgICAgICAgICAgICAgICAgICAnYWtmb290ZXJqcydcbiAgICAgICAgXSkge1xuICAgICAgICAgICAgaWYgKCFuamsubmprZW52KCkuaGFzRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbmZpZ3VyZSAtIE5KSyBkb2VzIG5vdCBoYXZlIGV4dGVuc2lvbiAtICR7ZXh0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyB0cnkge1xuICAgICAgICAvLyAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtuamt0ZXN0JywgbmV3IHRlc3RFeHRlbnNpb24oKSk7XG4gICAgICAgIC8vIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2soKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbignYWtuamt0ZXN0JykpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoYGFrbmprdGVzdCBleHRlbnNpb24gbm90IGFkZGVkP2ApO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCBleGlzdHNgKTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICAvLyBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cblxuICAgIGdldCByZXNpemVxdWV1ZSgpIHsgcmV0dXJuIHRoaXMuI3Jlc2l6ZV9xdWV1ZTsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxsaW5rPiB0YWdzIGluIHRoZSA8aGVhZD4gZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVIZWFkTGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxzY3JpcHQ+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVTY3JpcHRMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8QT4gdGFncyBmb3IgbG9jYWxcbiAgICAgKiBVUkxzIGFyZSByZWxhdGl2aXplZCBvciBhYnNvbHV0aXplZC5cbiAgICAgKi9cbiAgICBzZXQgcmVsYXRpdml6ZUJvZHlMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIGRvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICBhZGRJbWFnZVRvUmVzaXplKHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBkb2NQYXRoKSB7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgb25TaXRlUmVuZGVyZWQoY29uZmlnKSB7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIHdoaWxlIChBcnJheS5pc0FycmF5KHRoaXMuI3Jlc2l6ZV9xdWV1ZSlcbiAgICAgICAgICAgICYmIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5sZW5ndGggPiAwKSB7XG5cbiAgICAgICAgICAgIGxldCB0b3Jlc2l6ZSA9IHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wb3AoKTtcblxuICAgICAgICAgICAgbGV0IGltZzJyZXNpemU7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZSh0b3Jlc2l6ZS5zcmMpKSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICB0b3Jlc2l6ZS5zcmNcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHRvcmVzaXplLnNyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNyY2ZpbGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGFzc2V0cy5maW5kKGltZzJyZXNpemUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kLmZzcGF0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgICAgICBzcmNmaWxlID0gZm91bmQgPyBmb3VuZC5mc3BhdGggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNyY2ZpbGUpIHRocm93IG5ldyBFcnJvcihgYWthc2hhY21zLWJ1aWx0aW46IERpZCBub3QgZmluZCBzb3VyY2UgZmlsZSBmb3IgaW1hZ2UgdG8gcmVzaXplICR7aW1nMnJlc2l6ZX1gKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgaW1nID0gYXdhaXQgc2hhcnAoc3JjZmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWQgPSBhd2FpdCBpbWcucmVzaXplKE51bWJlci5wYXJzZUludCh0b3Jlc2l6ZS5yZXNpemV3aWR0aCkpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgY29ycmVjdCBkZXN0aW5hdGlvbiBwYXRoXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSByZXNpemVkIGltYWdlXG4gICAgICAgICAgICAgICAgbGV0IGltZ3RvcmVzaXplID0gdG9yZXNpemUucmVzaXpldG8gPyB0b3Jlc2l6ZS5yZXNpemV0byA6IGltZzJyZXNpemU7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWRlc3Q7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShpbWd0b3Jlc2l6ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGZvciByZWxhdGl2ZSBpbWFnZSBwYXRocywgaGVuY2UgaXQgbmVlZHMgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGRvY1BhdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyRGVzdGluYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlc2l6ZWRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXNpemVkLnRvRmlsZShyZXNpemVkZXN0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJ1aWx0LWluOiBJbWFnZSByZXNpemUgZmFpbGVkIGZvciAke3NyY2ZpbGV9ICh0b3Jlc2l6ZSAke3V0aWwuaW5zcGVjdCh0b3Jlc2l6ZSl9IGZvdW5kICR7dXRpbC5pbnNwZWN0KGZvdW5kKX0pIGJlY2F1c2UgJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBtYWhhYmh1dGFBcnJheSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBsZXQgcmV0ID0gbmV3IG1haGFiaHV0YS5NYWhhZnVuY0FycmF5KHBsdWdpbk5hbWUsIG9wdGlvbnMpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU3R5bGVzaGVldHNFbGVtZW50KCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZGVySmF2YVNjcmlwdCgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZvb3RlckphdmFTY3JpcHQoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBIZWFkTGlua1JlbGF0aXZpemVyKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2NyaXB0UmVsYXRpdml6ZXIoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBJbnNlcnRUZWFzZXIoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBDb2RlRW1iZWQoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZCgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZpZ3VyZUltYWdlKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgaW1nMmZpZ3VyZUltYWdlKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcigpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNob3dDb250ZW50KCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2VsZWN0RWxlbWVudHMoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBbmNob3JDbGVhbnVwKCkpO1xuXG4gICAgcmV0LmFkZEZpbmFsTWFoYWZ1bmMobmV3IE11bmdlZEF0dHJSZW1vdmVyKCkpO1xuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCBvcHRpb25zKSB7XG4gICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhKX1gKTtcblxuICAgIHZhciBzY3JpcHRzO1xuICAgIGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMuY29uY2F0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY3JpcHRzID0gb3B0aW9ucy5jb25maWcuc2NyaXB0cyA/IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBhay1zdHlsZXNoZWV0cyAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKX0gJHt1dGlsLmluc3BlY3Qob3B0aW9ucy5jb25maWcuc2NyaXB0cyl9ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXG4gICAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMnKTtcbiAgICBpZiAoIW9wdGlvbnMuY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMuY29uZmlnJyk7XG5cbiAgICB2YXIgcmV0ID0gJyc7XG4gICAgaWYgKHR5cGVvZiBzY3JpcHRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IgKHZhciBzdHlsZSBvZiBzY3JpcHRzKSB7XG5cbiAgICAgICAgICAgIGxldCBzdHlsZWhyZWYgPSBzdHlsZS5ocmVmO1xuICAgICAgICAgICAgbGV0IHBIcmVmID0gdXJsLnBhcnNlKHN0eWxlLmhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHByb2Nlc3MgJHtzdHlsZWhyZWZ9YCk7XG4gICAgICAgICAgICBpZiAoIXBIcmVmLnByb3RvY29sICYmICFwSHJlZi5ob3N0bmFtZSAmJiAhcEhyZWYuc2xhc2hlcykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHN0eWxlaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlRgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVCBSRU5ERVJUT2ApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHJlbGF0aXZlKC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfSwgJHtzdHlsZWhyZWZ9KSA9ICR7cmVsYXRpdmUoJy8nK21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvLCBzdHlsZWhyZWYpfWApXG4gICAgICAgICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3R5bGVocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIGFic29sdXRlIHN0eWxlaHJlZiAke3N0eWxlaHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgJCA9IGNoZWVyaW8ubG9hZCgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCJcIi8+JywgbnVsbCwgZmFsc2UpO1xuICAgICAgICAgICAgJCgnbGluaycpLmF0dHIoJ2hyZWYnLCBzdHlsZWhyZWYpO1xuICAgICAgICAgICAgaWYgKHN0eWxlLm1lZGlhKSB7XG4gICAgICAgICAgICAgICAgJCgnbGluaycpLmF0dHIoJ21lZGlhJywgc3R5bGUubWVkaWEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ICs9ICQuaHRtbCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3JldH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMpIHtcblx0dmFyIHJldCA9ICcnO1xuXHRpZiAoIXNjcmlwdHMpIHJldHVybiByZXQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghb3B0aW9ucy5jb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucy5jb25maWcnKTtcblxuICAgIGZvciAodmFyIHNjcmlwdCBvZiBzY3JpcHRzKSB7XG5cdFx0aWYgKCFzY3JpcHQuaHJlZiAmJiAhc2NyaXB0LnNjcmlwdCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBNdXN0IHNwZWNpZnkgZWl0aGVyIGhyZWYgb3Igc2NyaXB0IGluICR7dXRpbC5pbnNwZWN0KHNjcmlwdCl9YCk7XG5cdFx0fVxuICAgICAgICBpZiAoIXNjcmlwdC5zY3JpcHQpIHNjcmlwdC5zY3JpcHQgPSAnJztcbiAgICAgICAgbGV0ICQgPSBjaGVlcmlvLmxvYWQoJzxzY3JpcHQgPjwvc2NyaXB0PicsIG51bGwsIGZhbHNlKTtcbiAgICAgICAgaWYgKHNjcmlwdC5sYW5nKSAkKCdzY3JpcHQnKS5hdHRyKCd0eXBlJywgc2NyaXB0LmxhbmcpO1xuICAgICAgICBpZiAoc2NyaXB0LmhyZWYpIHtcbiAgICAgICAgICAgIGxldCBzY3JpcHRocmVmID0gc2NyaXB0LmhyZWY7XG4gICAgICAgICAgICBsZXQgcEhyZWYgPSB1cmwucGFyc2Uoc2NyaXB0LmhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHNjcmlwdGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNjcmlwdGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvSmF2YVNjcmlwdHMgYWJzb2x1dGUgc2NyaXB0aHJlZiAke3NjcmlwdGhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHNjcmlwdGhyZWYgPSBuZXdIcmVmO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvKiBpZiAob3B0aW9ucy5jb25maWcucm9vdF91cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBSb290VXJsID0gdXJsLnBhcnNlKG9wdGlvbnMuY29uZmlnLnJvb3RfdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0aHJlZiA9IHBhdGgubm9ybWFsaXplKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgcEhyZWYucGF0aG5hbWUpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfSAqL1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJCgnc2NyaXB0JykuYXR0cignc3JjJywgc2NyaXB0aHJlZik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjcmlwdC5zY3JpcHQpIHtcbiAgICAgICAgICAgICQoJ3NjcmlwdCcpLmFwcGVuZChzY3JpcHQuc2NyaXB0KTtcbiAgICAgICAgfVxuICAgICAgICByZXQgKz0gJC5odG1sKCk7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coJ19kb0phdmFTY3JpcHRzICcrIHJldCk7XG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMpIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AuY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3ApO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBvcHRpb25zLmNvbmZpZy5zY3JpcHRzID8gb3B0aW9ucy5jb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wIDogdW5kZWZpbmVkO1xuXHR9XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXHQvLyBjb25zb2xlLmxvZyhgX2RvSGVhZGVySmF2YVNjcmlwdCAke3V0aWwuaW5zcGVjdChvcHRpb25zLmNvbmZpZy5zY3JpcHRzKX1gKTtcblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucykge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMgPyBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRCb3R0b20gOiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zKTtcbn1cblxuY2xhc3MgU3R5bGVzaGVldHNFbGVtZW50IGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXN0eWxlc2hlZXRzXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9ICBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFN0eWxlc2hlZXRzRWxlbWVudCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEhlYWRlckphdmFTY3JpcHQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstaGVhZGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbikge1xuXHRcdGxldCByZXQgPSBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgSGVhZGVySmF2YVNjcmlwdCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEZvb3RlckphdmFTY3JpcHQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstZm9vdGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMpO1xuXHR9XG59XG5cbmNsYXNzIEhlYWRMaW5rUmVsYXRpdml6ZXIgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgICAgIGxldCBwSHJlZiA9IHVybC5wYXJzZShocmVmLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBTY3JpcHRSZWxhdGl2aXplciBleHRlbmRzIG1haGFiaHV0YS5NdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignc3JjJyk7XG5cbiAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgbGlua1xuICAgICAgICAgICAgbGV0IHBIcmVmID0gdXJsLnBhcnNlKGhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIEluc2VydFRlYXNlciBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay10ZWFzZXJcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdHJ5IHtcblx0XHRyZXR1cm4gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEucGFydGlhbCh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFrX3RlYXNlci5odG1sLm5qa1wiLCB7XG5cdFx0XHR0ZWFzZXI6IHR5cGVvZiBtZXRhZGF0YVtcImFrLXRlYXNlclwiXSAhPT0gXCJ1bmRlZmluZWRcIlxuXHRcdFx0XHQ/IG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdIDogbWV0YWRhdGEudGVhc2VyXG5cdFx0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEluc2VydFRlYXNlciBjYXVnaHQgZXJyb3IgYCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG5cdH1cbn1cblxuY2xhc3MgQWtCb2R5Q2xhc3NBZGQgZXh0ZW5kcyBtYWhhYmh1dGEuUGFnZVByb2Nlc3NvciB7XG5cdGFzeW5jIHByb2Nlc3MoJCwgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRpZiAodHlwZW9mIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9PSAndW5kZWZpbmVkJ1xuXHRcdCAmJiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPSAnJ1xuXHRcdCAmJiAkKCdodG1sIGJvZHknKS5nZXQoMCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdGlmICghJCgnaHRtbCBib2R5JykuaGFzQ2xhc3MobWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQpKSB7XG5cdFx0XHRcdFx0JCgnaHRtbCBib2R5JykuYWRkQ2xhc3MobWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc29sdmUodW5kZWZpbmVkKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCcnKTtcblx0fVxufVxuXG5jbGFzcyBDb2RlRW1iZWQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjb2RlLWVtYmVkXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICRlbGVtZW50LmF0dHIoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgICAgIGlmICghZm4gfHwgZm4gPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgbXVzdCBoYXZlIGZpbGUtbmFtZSBhcmd1bWVudCwgZ290ICR7Zm59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHh0cGF0aDtcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmbikpIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBmbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHR4dHBhdGgpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgZmlsZS1uYW1lICR7Zm59IGRvZXMgbm90IHJlZmVyIHRvIHVzYWJsZSBmaWxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuICAgICAgICBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZShgPHByZT48Y29kZT48L2NvZGU+PC9wcmU+YCk7XG4gICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgICAgICAkKCdjb2RlJykuYWRkQ2xhc3MobGFuZyk7XG4gICAgICAgIH1cbiAgICAgICAgJCgnY29kZScpLmFkZENsYXNzKCdobGpzJyk7XG4gICAgICAgIGlmIChpZCAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgICAgICQoJ3ByZScpLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0KHR4dCwge1xuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgICAgICB9KS52YWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0QXV0byh0eHQpLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJC5odG1sKCk7XG4gICAgfVxufVxuXG5jbGFzcyBGaWd1cmVJbWFnZSBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImZpZy1pbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19maWdpbWcuaHRtbC5uamsnO1xuICAgICAgICBjb25zdCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHRocm93IG5ldyBFcnJvcignZmlnLWltZyBtdXN0IHJlY2VpdmUgYW4gaHJlZicpO1xuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNhcHRpb24gPSAkZWxlbWVudC5odG1sKCk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3RcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBpbWcyZmlndXJlSW1hZ2UgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBpbWdbZmlndXJlXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHksIGRvbmUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJykgXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpXG4gICAgICAgICAgICAgICAgOiAgXCJha19maWdpbWcuaHRtbC5uamtcIjtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzcmMgPSAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaWQsIGNsYXp6LCBzdHlsZSwgd2lkdGgsIGhyZWY6IHNyYywgZGVzdCwgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLFxuICAgICAgICAgICAgY2FwdGlvbjogY29udGVudFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIEltYWdlUmV3cml0ZXIgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcblxuICAgICAgICAvLyBXZSBvbmx5IGRvIHJld3JpdGVzIGZvciBsb2NhbCBpbWFnZXNcbiAgICAgICAgbGV0IHNyYyA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuICAgICAgICBjb25zdCB1U3JjID0gdXJsLnBhcnNlKHNyYywgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgIGlmICh1U3JjLnByb3RvY29sIHx8IHVTcmMuc2xhc2hlcykgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgXG4gICAgICAgIC8vIEFyZSB3ZSBhc2tlZCB0byByZXNpemUgdGhlIGltYWdlP1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJlc2l6ZXdpZHRoKSB7XG4gICAgICAgICAgICAvLyBBZGQgdG8gYSBxdWV1ZSB0aGF0IGlzIHJ1biBhdCB0aGUgZW5kIFxuICAgICAgICAgICAgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAuYWRkSW1hZ2VUb1Jlc2l6ZShzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pO1xuXG4gICAgICAgICAgICBpZiAocmVzaXpldG8pIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCByZXNpemV0byk7XG4gICAgICAgICAgICAgICAgc3JjID0gcmVzaXpldG87XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBubyBsb25nZXIgbmVlZGVkXG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGlkZWEgaGVyZSBpcyBmb3IgZXZlcnkgbG9jYWwgaW1hZ2Ugc3JjIHRvIGJlIGEgcmVsYXRpdmUgVVJMXG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjKSkge1xuICAgICAgICAgICAgbGV0IG5ld1NyYyA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBzcmMpO1xuICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBJbWFnZVJld3JpdGVyIGFic29sdXRlIGltYWdlIHBhdGggJHtzcmN9IHJld3JvdGUgdG8gJHtuZXdTcmN9YCk7XG4gICAgICAgICAgICBzcmMgPSBuZXdTcmM7XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICAvLyBUaGUgaWRlYSBoZXJlIGlzIGZvciBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgYW4gYWJzb2x1dGUgVVJMXG4gICAgICAgIC8vIFRoYXQgdGhlbiByZXF1aXJlcyBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgcHJlZml4ZWQgd2l0aCBhbnlcbiAgICAgICAgLy8gc3ViZGlyZWN0b3J5IGNvbnRhaW5lZCBpbiBjb25maWcucm9vdF91cmxcbiAgICAgICAgLy8gXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiBzcmMgbXVzdCBiZSB1cGRhdGVkIGZvciBjb25maWcucm9vdF91cmxcbiAgICAgICAgLy8gVGhpcyBkb2VzIG5vdCBhcHBseSB0byByZWxhdGl2ZSBpbWFnZSBwYXRoc1xuICAgICAgICAvLyBUaGVyZWZvcmUgaWYgaXQgaXMgYW4gYWJzb2x1dGUgbG9jYWwgaW1hZ2UgcGF0aCwgYW5kIHRoZXJlIGlzIGEgcm9vdF91cmxcbiAgICAgICAgLy8gd2UgbXVzdCByZXdyaXRlIHRoZSBzcmMgcGF0aCB0byBzdGFydCB3aXRoIHRoZSByb290X3VybFxuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKHNyYykgJiYgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgbGV0IHBSb290VXJsID0gdXJsLnBhcnNlKHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcucm9vdF91cmwpO1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIFVSTCBoYXMgYWxyZWFkeSBiZWVuIHJld3JpdHRlblxuICAgICAgICAgICAgaWYgKCFzcmMuc3RhcnRzV2l0aChwUm9vdFVybC5wYXRobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3U3JjID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgc3JjKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgIH1cbn1cblxuY2xhc3MgU2hvd0NvbnRlbnQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGxldCBkb2MycmVhZDtcbiAgICAgICAgaWYgKCEgaHJlZi5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIGxldCBkaXIgPSBwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucGF0aCk7XG4gICAgICAgICAgICBkb2MycmVhZCA9IHBhdGguam9pbignLycsIGRpciwgaHJlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2MycmVhZCA9IGhyZWY7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gJHtkb2MycmVhZH1gKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBkb2N1bWVudHMuZmluZChkb2MycmVhZCk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdCwgY29udGVudEltYWdlLFxuICAgICAgICAgICAgZG9jdW1lbnQ6IGRvY1xuICAgICAgICB9O1xuICAgICAgICBsZXQgcmV0ID0gYXdhaXQgdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCB0ZW1wbGF0ZSwgZGF0YSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke2hyZWZ9ICR7dXRpbC5pbnNwZWN0KGRhdGEpfSA9PT4gJHtyZXR9YCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG4vKlxuXG5UaGlzIHdhcyBtb3ZlZCBpbnRvIE1haGFiaHV0YVxuXG4gY2xhc3MgUGFydGlhbCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJwYXJ0aWFsXCI7IH1cblx0cHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0Ly8gV2UgZGVmYXVsdCB0byBtYWtpbmcgcGFydGlhbCBzZXQgdGhlIGRpcnR5IGZsYWcuICBCdXQgYSB1c2VyXG5cdFx0Ly8gb2YgdGhlIHBhcnRpYWwgdGFnIGNhbiBjaG9vc2UgdG8gdGVsbCB1cyBpdCBpc24ndCBkaXJ0eS5cblx0XHQvLyBGb3IgZXhhbXBsZSwgaWYgdGhlIHBhcnRpYWwgb25seSBzdWJzdGl0dXRlcyBub3JtYWwgdGFnc1xuXHRcdC8vIHRoZXJlJ3Mgbm8gbmVlZCB0byBkbyB0aGUgZGlydHkgdGhpbmcuXG5cdFx0dmFyIGRvdGhlZGlydHl0aGluZyA9ICRlbGVtZW50LmF0dHIoJ2RpcnR5Jyk7XG5cdFx0aWYgKCFkb3RoZWRpcnR5dGhpbmcgfHwgZG90aGVkaXJ0eXRoaW5nLm1hdGNoKC90cnVlL2kpKSB7XG5cdFx0XHRkaXJ0eSgpO1xuXHRcdH1cblx0XHR2YXIgZm5hbWUgPSAkZWxlbWVudC5hdHRyKFwiZmlsZS1uYW1lXCIpO1xuXHRcdHZhciB0eHQgICA9ICRlbGVtZW50Lmh0bWwoKTtcblx0XHR2YXIgZCA9IHt9O1xuXHRcdGZvciAodmFyIG1wcm9wIGluIG1ldGFkYXRhKSB7IGRbbXByb3BdID0gbWV0YWRhdGFbbXByb3BdOyB9XG5cdFx0dmFyIGRhdGEgPSAkZWxlbWVudC5kYXRhKCk7XG5cdFx0Zm9yICh2YXIgZHByb3AgaW4gZGF0YSkgeyBkW2Rwcm9wXSA9IGRhdGFbZHByb3BdOyB9XG5cdFx0ZFtcInBhcnRpYWxCb2R5XCJdID0gdHh0O1xuXHRcdGxvZygncGFydGlhbCB0YWcgZm5hbWU9JysgZm5hbWUgKycgYXR0cnMgJysgdXRpbC5pbnNwZWN0KGRhdGEpKTtcblx0XHRyZXR1cm4gcmVuZGVyLnBhcnRpYWwodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZywgZm5hbWUsIGQpXG5cdFx0LnRoZW4oaHRtbCA9PiB7IHJldHVybiBodG1sOyB9KVxuXHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0ZXJyb3IobmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycikpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycik7XG5cdFx0fSk7XG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzLm1haGFiaHV0YS5hZGRNYWhhZnVuYyhuZXcgUGFydGlhbCgpKTsgKi9cblxuLy9cbi8vIDxzZWxlY3QtZWxlbWVudHMgY2xhc3M9XCIuLlwiIGlkPVwiLi5cIiBjb3VudD1cIk5cIj5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gPC9zZWxlY3QtZWxlbWVudHM+XG4vL1xuY2xhc3MgU2VsZWN0RWxlbWVudHMgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgbGV0IGNvdW50ID0gJGxpbmsuYXR0cignY291bnQnKVxuICAgICAgICAgICAgICAgICAgICA/IE51bWJlci5wYXJzZUludCgkbGluay5hdHRyKCdjb3VudCcpKVxuICAgICAgICAgICAgICAgICAgICA6IDE7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGxpbmsuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgPSAkbGluay5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCB0biAgICA9ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgPyAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgIDogJ2Rpdic7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSAkbGluay5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoOyBjb3VudCA+PSAxICYmIGNoaWxkcmVuLmxlbmd0aCA+PSAxOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IF9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKF9uKTtcbiAgICAgICAgICAgIGNvbnN0IGNob3NlbiA9ICQoY2hpbGRyZW5bX25dKS5odG1sKCk7XG4gICAgICAgICAgICBzZWxlY3RlZC5wdXNoKGNob3Nlbik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hvc2VuKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbltfbl07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91dWlkID0gdXVpZHYxKCk7XG4gICAgICAgICRsaW5rLnJlcGxhY2VXaXRoKGA8JHt0bn0gaWQ9JyR7X3V1aWR9Jz48LyR7dG59PmApO1xuICAgICAgICBjb25zdCAkbmV3SXRlbSA9ICQoYCR7dG59IyR7X3V1aWR9YCk7XG4gICAgICAgIGlmIChpZCkgJG5ld0l0ZW0uYXR0cignaWQnLCBpZCk7XG4gICAgICAgIGVsc2UgJG5ld0l0ZW0ucmVtb3ZlQXR0cignaWQnKTtcbiAgICAgICAgaWYgKGNsYXp6KSAkbmV3SXRlbS5hZGRDbGFzcyhjbGF6eik7XG4gICAgICAgIGZvciAobGV0IGNob3NlbiBvZiBzZWxlY3RlZCkge1xuICAgICAgICAgICAgJG5ld0l0ZW0uYXBwZW5kKGNob3Nlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5jbGFzcyBBbmNob3JDbGVhbnVwIGV4dGVuZHMgbWFoYWJodXRhLk11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIGhyZWYgICAgID0gJGxpbmsuYXR0cignaHJlZicpO1xuICAgICAgICB2YXIgbGlua3RleHQgPSAkbGluay50ZXh0KCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke2hyZWZ9ICR7bGlua3RleHR9YCk7XG4gICAgICAgIGlmIChocmVmICYmIGhyZWYgIT09ICcjJykge1xuICAgICAgICAgICAgdmFyIHVIcmVmID0gdXJsLnBhcnNlKGhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLnByb3RvY29sIHx8IHVIcmVmLnNsYXNoZXMpIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICBpZiAoIXVIcmVmLnBhdGhuYW1lKSByZXR1cm4gXCJva1wiO1xuXG4gICAgICAgICAgICAvKiBpZiAobWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9PT0gJ2luZGV4Lmh0bWwubWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgbWV0YWRhdGEuZG9jdW1lbnQucGF0aCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGhyZWYgJHtocmVmfSB1SHJlZi5wYXRobmFtZSAke3VIcmVmLnBhdGhuYW1lfSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsICR7dGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkLmh0bWwoKSk7XG4gICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAgIC8vIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGRldGVybWluZWQgdGhpcyBpcyBhIGxvY2FsIGhyZWYuXG4gICAgICAgICAgICAvLyBGb3IgcmVmZXJlbmNlIHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lIG9mIHRoZSBocmVmIHdpdGhpblxuICAgICAgICAgICAgLy8gdGhlIHByb2plY3QuICBGb3IgZXhhbXBsZSB0byByZXRyaWV2ZSB0aGUgdGl0bGUgd2hlbiB3ZSdyZSBmaWxsaW5nXG4gICAgICAgICAgICAvLyBpbiBmb3IgYW4gZW1wdHkgPGE+IHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lLlxuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgbGluayBhcyBoYXZpbmcgYmVlbiBwcm9jZXNzZWQuXG4gICAgICAgICAgICAvLyBUaGUgcHVycG9zZSBpcyBpZiBNYWhhYmh1dGEgcnVucyBtdWx0aXBsZSBwYXNzZXMsXG4gICAgICAgICAgICAvLyB0byBub3QgcHJvY2VzcyB0aGUgbGluayBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICAgIC8vIEJlZm9yZSBhZGRpbmcgdGhpcyAtIHdlIHNhdyB0aGlzIE11bmdlciB0YWtlIGFzIG11Y2hcbiAgICAgICAgICAgIC8vIGFzIDgwMG1zIHRvIGV4ZWN1dGUsIGZvciBFVkVSWSBwYXNzIG1hZGUgYnkgTWFoYWJodXRhLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGlzIGF0dHJpYnV0ZSwgYW5kIGNoZWNraW5nIGZvciBpdCBpbiB0aGUgc2VsZWN0b3IsXG4gICAgICAgICAgICAvLyBtZWFucyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGxpbmsgb25jZS5cbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ211bmdlZCcsICd5ZXMnKTtcblxuICAgICAgICAgICAgbGV0IGFic29sdXRlUGF0aDtcblxuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodUhyZWYucGF0aG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5wYXRoKSwgdUhyZWYucGF0aG5hbWUpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGAqKioqKiBBbmNob3JDbGVhbnVwIEZJWEVEIGhyZWYgdG8gJHt1SHJlZi5wYXRobmFtZX1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gdUhyZWYucGF0aG5hbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gZW5zdXJlIGFsbCBsb2NhbCBocmVmJ3MgYXJlIFxuICAgICAgICAgICAgLy8gZm9yIGEgcmVsYXRpdmUgcGF0aCByYXRoZXIgdGhhbiBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSB1c2UgdGhlIHJlbGF0aXZlIG1vZHVsZSB0byBjb21wdXRlIHRoZSByZWxhdGl2ZSBwYXRoXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgL2luZGV4Lmh0bWwgaW4ge1xuICAgICAgICAgICAgLy8gIGJhc2VkaXI6ICcvVm9sdW1lcy9FeHRyYS9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL3Rlc3QvZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICByZWxwYXRoOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sLm1kJyxcbiAgICAgICAgICAgIC8vICByZWxyZW5kZXI6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnLFxuICAgICAgICAgICAgLy8gIHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbmRlclRvOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sJ1xuICAgICAgICAgICAgLy8gfSB0byAuLi8uLi8uLi9pbmRleC5odG1sXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzXG4gICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLypcbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gXG4gICAgICAgICAgICAvLyAgICAgYSkgZW5zdXJlIGFsbCByZWxhdGl2ZSBwYXRocyBhcmUgbWFkZSBhYnNvbHV0ZVxuICAgICAgICAgICAgLy8gICAgIGIpIHRoZXJlZm9yZSBhbGwgYWJzb2x1dGUgcGF0aHMgd2hlbiBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIC8vICAgICAgICBpcyBmb3IgYSBuZXN0ZWQgc3ViZGlyZWN0b3J5IG11c3QgaGF2ZSB0aGUgcGF0aFxuICAgICAgICAgICAgLy8gICAgICAgIHByZWZpeGVkIHdpdGggdGhlIHN1YmRpcmVjdG9yeVxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiBocmVmIG11c3QgYmUgdXBkYXRlZCBmb3IgY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgIGxldCBwUm9vdFVybCA9IHVybC5wYXJzZSh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsKTtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgVVJMIGhhcyBhbHJlYWR5IGJlZW4gcmV3cml0dGVuXG4gICAgICAgICAgICAgICAgaWYgKCFocmVmLnN0YXJ0c1dpdGgocFJvb3RVcmwucGF0aG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoLmpvaW4ocFJvb3RVcmwucGF0aG5hbWUsIGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgICAgICAvKiBpZiAobWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9PT0gJ2luZGV4Lmh0bWwubWQnKSBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gaHJlZiAke2hyZWZ9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCAke3RoaXMuYXJyYXkub3B0aW9ucy5jb25maWcucm9vdF91cmx9IG5ld0hyZWYgJHtuZXdIcmVmfWApOyAqIC9cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IFxuICAgICAgICAgICAgKi9cblxuICAgICAgICAgICAgLy8gTG9vayB0byBzZWUgaWYgaXQncyBhbiBhc3NldCBmaWxlXG4gICAgICAgICAgICBsZXQgZm91bmRBc3NldDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZEFzc2V0KSB7IC8vICYmIGZvdW5kQXNzZXQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kQXNzZXQgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIEFzayBwbHVnaW5zIGlmIHRoZSBocmVmIGlzIG9rYXlcbiAgICAgICAgICAgIGlmICh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihhYnNvbHV0ZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBsaW5rIGhhcyBhIGJvZHksIHRoZW4gZG9uJ3QgbW9kaWZ5IGl0XG4gICAgICAgICAgICBpZiAoKGxpbmt0ZXh0ICYmIGxpbmt0ZXh0Lmxlbmd0aCA+IDAgJiYgbGlua3RleHQgIT09IGFic29sdXRlUGF0aClcbiAgICAgICAgICAgICAgICB8fCAoJGxpbmsuY2hpbGRyZW4oKS5sZW5ndGggPiAwKSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIHNraXBwaW5nICR7YWJzb2x1dGVQYXRofSB3LyAke3V0aWwuaW5zcGVjdChsaW5rdGV4dCl9IGNoaWxkcmVuPSAkeyRsaW5rLmNoaWxkcmVuKCl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRG9lcyBpdCBleGlzdCBpbiBkb2N1bWVudHMgZGlyP1xuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmRSZW5kZXJzVG8gJHthYnNvbHV0ZVBhdGh9ICR7dXRpbC5pbnNwZWN0KGZvdW5kKX1gKTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJzVG8gJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBkaXJlY3RvcnksIHRoZXJlIG1pZ2h0IGJlIC9wYXRoL3RvL2luZGV4Lmh0bWwgc28gd2UgdHJ5IGZvciB0aGF0LlxuICAgICAgICAgICAgLy8gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGggd291bGQgZmFpbCBvbiBqdXN0IC9wYXRoL3RvIGJ1dCBzdWNjZWVkXG4gICAgICAgICAgICAvLyBvbiAvcGF0aC90by9pbmRleC5odG1sXG4gICAgICAgICAgICBpZiAoZm91bmQuaXNEaXJlY3RvcnkpIHtcbiAgICAgICAgICAgICAgICBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHBhdGguam9pbihhYnNvbHV0ZVBhdGgsIFwiaW5kZXguaHRtbFwiKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERpZCBub3QgZmluZCAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBsb29rIGludG8gZmlsbGluZyBlbXB0aW5lc3Mgd2l0aCB0aXRsZVxuXG4gICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyZXJQYXRoICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRvY21ldGEgPSBmb3VuZC5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvKiB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jbWV0YSA9IGF3YWl0IHJlbmRlcmVyLm1ldGFkYXRhKGZvdW5kLmZvdW5kRGlyLCBmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJldHJpZXZlIGRvY3VtZW50IG1ldGFkYXRhIGZvciAke2ZvdW5kLmZvdW5kRGlyfSAke2ZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcn0gYmVjYXVzZSAke2Vycn1gKTtcbiAgICAgICAgICAgICAgICB9ICotLS9cbiAgICAgICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RpdGxlJywgZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsudGV4dChkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluaXNoZWRgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gRE9ORSAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBib3RoZXIgdGhyb3dpbmcgYW4gZXJyb3IuICBKdXN0IGZpbGwgaXQgaW4gd2l0aFxuICAgICAgICAgICAgICAgIC8vIHNvbWV0aGluZy5cbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbGwgaW4gZW1wdHkgJ2EnIGVsZW1lbnQgaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSB3aXRoIGhyZWYgJHtocmVmfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8gIE1BSEFGVU5DUyBGT1IgRklOQUwgUEFTU1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIDxjb2RlPm11bmdlZD15ZXM8L2NvZGU+IGF0dHJpYnV0ZSB0aGF0IGlzIGFkZGVkXG4gKiBieSA8Y29kZT5BbmNob3JDbGVhbnVwPC9jb2RlPi5cbiAqL1xuY2xhc3MgTXVuZ2VkQXR0clJlbW92ZXIgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ211bmdlZCcpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLyBOdW5qdWNrcyBFeHRlbnNpb25zXG5cbi8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvZnRvbmljL251bmp1Y2tzLWluY2x1ZGUtd2l0aC90cmVlL21hc3RlclxuXG5jbGFzcyBzdHlsZXNoZWV0c0V4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha3N0eWxlc2hlZXRzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtzdHlsZXNoZWV0cycpO1xuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc3R5bGVzaGVldHNFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvU3R5bGVzaGVldHMoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtoZWFkZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2hlYWRlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvSGVhZGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2Zvb3RlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrZm9vdGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9Gb290ZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0ZXN0RXh0ZW5zaW9uKCkge1xuICAgIHRoaXMudGFncyA9IFsgJ2FrbmprdGVzdCcgXTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbihwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuY29uc29sZS5sb2coYGluIHRlc3RFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlcnJvcicsICdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIHZhciBlcnJvckJvZHkgPSBudWxsO1xuXG4gICAgICAgICAgICBpZihwYXJzZXIuc2tpcFN5bWJvbCgnZXJyb3InKSkge1xuICAgICAgICAgICAgICAgIHBhcnNlci5za2lwKGxleGVyLlRPS0VOX0JMT0NLX0VORCk7XG4gICAgICAgICAgICAgICAgZXJyb3JCb2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5LCBlcnJvckJvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB0ZXN0RXh0aW9uc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbihjb250ZXh0LCB1cmwsIGJvZHksIGVycm9yQm9keSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgYWtuamt0ZXN0ICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfSAke3V0aWwuaW5zcGVjdCh1cmwpfSAke3V0aWwuaW5zcGVjdChib2R5KX0gJHt1dGlsLmluc3BlY3QoZXJyb3JCb2R5KX1gKTtcbiAgICB9O1xuXG59Il19