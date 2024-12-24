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
            let $ = mahabhuta.parse('<link rel="stylesheet" type="text/css" href=""/>');
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
        let $ = mahabhuta.parse('<script ></script>');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFDbkMsT0FBTyxHQUFHLE1BQU0sVUFBVSxDQUFDO0FBQzNCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFDN0IsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sS0FBSyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQzdCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7QUFFdkIsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLFFBQVEsTUFBTSxVQUFVLENBQUM7QUFDaEMsT0FBTyxJQUFJLE1BQU0sY0FBYyxDQUFDO0FBQ2hDLE9BQU8sU0FBUyxNQUFNLFdBQVcsQ0FBQztBQUNsQyxPQUFPLFlBQVksTUFBTSw0QkFBNEIsQ0FBQztBQUV0RCxPQUFPLFNBQVMsTUFBTSxzQkFBc0IsQ0FBQztBQUM3QyxNQUFNLGdCQUFnQixHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztBQUVwRCxNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQztBQUV2QyxNQUFNLE9BQU8sYUFBYyxTQUFRLE1BQU07SUFDeEM7UUFDQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFLaEIsd0NBQVE7UUFDUiw4Q0FBYztRQUxWLHVCQUFBLElBQUksK0JBQWlCLEVBQUUsTUFBQSxDQUFDO0lBRS9CLENBQUM7SUFLRCxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU87UUFDbEIsdUJBQUEsSUFBSSx5QkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxD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QUFJLENBQUM7WUFFckIsSUFBRyxNQUFNLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuQyxTQUFTLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFFRCxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUU5QiwwQ0FBMEM7WUFDMUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUM7SUFDTCxDQUFDLENBQUM7SUFHRixJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQyxDQUFDO0FBRU4sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjIgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgZnNwIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gJ3V1aWQnO1xuY29uc3QgdXVpZHYxID0gdXVpZC52MTtcbmltcG9ydCAqIGFzIHJlbmRlciBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5pbXBvcnQgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuaW1wb3J0IGhsanMgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmltcG9ydCBtYWhhTWV0YWRhdGEgZnJvbSAnbWFoYWJodXRhL21haGEvbWV0YWRhdGEuanMnO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuaW1wb3J0IFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5jb25zdCBOdW5qdWNrc1JlbmRlcmVyID0gUmVuZGVyZXJzLk51bmp1Y2tzUmVuZGVyZXI7XG5cbmNvbnN0IHBsdWdpbk5hbWUgPSBcImFrYXNoYWNtcy1idWlsdGluXCI7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdEluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIocGx1Z2luTmFtZSk7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZSA9IFtdO1xuXG5cdH1cblxuICAgICNjb25maWc7XG4gICAgI3Jlc2l6ZV9xdWV1ZTtcblxuXHRjb25maWd1cmUoY29uZmlnLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3B0aW9ucy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIGxldCBtb2R1bGVEaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbiAgICAgICAgLy8gTmVlZCB0aGlzIGFzIHRoZSBwbGFjZSB0byBzdG9yZSBOdW5qdWNrcyBtYWNyb3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICBjb25maWcuYWRkTGF5b3V0c0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ2xheW91dHMnKSk7XG4gICAgICAgIGNvbmZpZy5hZGRQYXJ0aWFsc0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ3BhcnRpYWxzJykpO1xuICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gdGhlIENvbmZpZ3VyYXRpb24gY29uc3RydWN0b3IuICBUaGUgaWRlYSBpcyB0byBwdXRcbiAgICAgICAgLy8gbWFoYVBhcnRpYWwgYXMgdGhlIHZlcnkgZmlyc3QgTWFoYWZ1bmMgc28gdGhhdCBhbGxcbiAgICAgICAgLy8gUGFydGlhbCdzIGFyZSBoYW5kbGVkIGJlZm9yZSBhbnl0aGluZyBlbHNlLiAgVGhlIGlzc3VlIGNhdXNpbmdcbiAgICAgICAgLy8gdGhpcyBjaGFuZ2UgaXMgdGhlIE9wZW5HcmFwaFByb21vdGVJbWFnZXMgTWFoYWZ1bmMgaW5cbiAgICAgICAgLy8gYWthc2hhY2hzLWJhc2UgYW5kIHByb2Nlc3NpbmcgYW55IGltYWdlcyBicm91Z2h0IGluIGJ5IHBhcnRpYWxzLlxuICAgICAgICAvLyBFbnN1cmluZyB0aGUgcGFydGlhbCB0YWcgaXMgcHJvY2Vzc2VkIGJlZm9yZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzXG4gICAgICAgIC8vIG1lYW50IHN1Y2ggaW1hZ2VzIHdlcmUgcHJvcGVybHkgcHJvbW90ZWQuXG4gICAgICAgIC8vIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAvLyAgICAgcmVuZGVyUGFydGlhbDogb3B0aW9ucy5yZW5kZXJQYXJ0aWFsXG4gICAgICAgIC8vIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhTWV0YWRhdGEubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgLy8gRG8gbm90IHBhc3MgdGhpcyB0aHJvdWdoIHNvIHRoYXQgTWFoYWJodXRhIHdpbGwgbm90XG4gICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIGxpbmtzIHRvIHN1YmRpcmVjdG9yaWVzXG4gICAgICAgICAgICAvLyByb290X3VybDogY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICAvLyBUT0RPIGhvdyB0byBjb25maWd1cmUgdGhpc1xuICAgICAgICAgICAgLy8gc2l0ZW1hcF90aXRsZTogLi4uLj9cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFiaHV0YUFycmF5KG9wdGlvbnMpKTtcblxuICAgICAgICBjb25zdCBuamsgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJOYW1lKCcuaHRtbC5uamsnKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICBuZXcgc3R5bGVzaGVldHNFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtoZWFkZXJqcycsXG4gICAgICAgICAgICBuZXcgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2Zvb3RlcmpzJyxcbiAgICAgICAgICAgIG5ldyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIGV4dGVuc2lvbnMgd2VyZSBpbnN0YWxsZWRcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgW1xuICAgICAgICAgICAgICAgICAgICAnYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICAgICAgICAgICdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FrZm9vdGVyanMnXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbihleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmUgLSBOSksgZG9lcyBub3QgaGF2ZSBleHRlbnNpb24gLSAke2V4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gdHJ5IHtcbiAgICAgICAgLy8gICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrbmprdGVzdCcsIG5ldyB0ZXN0RXh0ZW5zaW9uKCkpO1xuICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKCkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIFxuICAgICAgICAvLyBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oJ2FrbmprdGVzdCcpKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBha25qa3Rlc3QgZXh0ZW5zaW9uIG5vdCBhZGRlZD9gKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgZXhpc3RzYCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgLy8gZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG5cbiAgICBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8bGluaz4gdGFncyBpbiB0aGUgPGhlYWQ+IGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplSGVhZExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8c2NyaXB0PiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplU2NyaXB0TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPEE+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVCb2R5TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIGRvU3R5bGVzaGVldHMobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICBkb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIGRvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuXG4gICAgYWRkSW1hZ2VUb1Jlc2l6ZShzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgZG9jUGF0aCkge1xuICAgICAgICB0aGlzLiNyZXNpemVfcXVldWUucHVzaCh7IHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBkb2NQYXRoIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIG9uU2l0ZVJlbmRlcmVkKGNvbmZpZykge1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICB3aGlsZSAoQXJyYXkuaXNBcnJheSh0aGlzLiNyZXNpemVfcXVldWUpXG4gICAgICAgICAgICAmJiB0aGlzLiNyZXNpemVfcXVldWUubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgICBsZXQgdG9yZXNpemUgPSB0aGlzLiNyZXNpemVfcXVldWUucG9wKCk7XG5cbiAgICAgICAgICAgIGxldCBpbWcycmVzaXplO1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodG9yZXNpemUuc3JjKSkge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgdG9yZXNpemUuc3JjXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSB0b3Jlc2l6ZS5zcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzcmNmaWxlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBhc3NldHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIHNyY2ZpbGUgPSBmb3VuZC5mc3BhdGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoaW1nMnJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kID8gZm91bmQuZnNwYXRoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzcmNmaWxlKSB0aHJvdyBuZXcgRXJyb3IoYGFrYXNoYWNtcy1idWlsdGluOiBEaWQgbm90IGZpbmQgc291cmNlIGZpbGUgZm9yIGltYWdlIHRvIHJlc2l6ZSAke2ltZzJyZXNpemV9YCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IGltZyA9IGF3YWl0IHNoYXJwKHNyY2ZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkID0gYXdhaXQgaW1nLnJlc2l6ZShOdW1iZXIucGFyc2VJbnQodG9yZXNpemUucmVzaXpld2lkdGgpKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNvbXB1dGUgdGhlIGNvcnJlY3QgZGVzdGluYXRpb24gcGF0aFxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgcmVzaXplZCBpbWFnZVxuICAgICAgICAgICAgICAgIGxldCBpbWd0b3Jlc2l6ZSA9IHRvcmVzaXplLnJlc2l6ZXRvID8gdG9yZXNpemUucmVzaXpldG8gOiBpbWcycmVzaXplO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkZXN0O1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaW1ndG9yZXNpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBmb3IgcmVsYXRpdmUgaW1hZ2UgcGF0aHMsIGhlbmNlIGl0IG5lZWRzIHRvIGJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBkb2NQYXRoXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZXNpemVkZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzaXplZC50b0ZpbGUocmVzaXplZGVzdCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBidWlsdC1pbjogSW1hZ2UgcmVzaXplIGZhaWxlZCBmb3IgJHtzcmNmaWxlfSAodG9yZXNpemUgJHt1dGlsLmluc3BlY3QodG9yZXNpemUpfSBmb3VuZCAke3V0aWwuaW5zcGVjdChmb3VuZCl9KSBiZWNhdXNlICR7ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5leHBvcnQgY29uc3QgbWFoYWJodXRhQXJyYXkgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgbGV0IHJldCA9IG5ldyBtYWhhYmh1dGEuTWFoYWZ1bmNBcnJheShwbHVnaW5OYW1lLCBvcHRpb25zKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFN0eWxlc2hlZXRzRWxlbWVudCgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEhlYWRlckphdmFTY3JpcHQoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGb290ZXJKYXZhU2NyaXB0KCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZExpbmtSZWxhdGl2aXplcigpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNjcmlwdFJlbGF0aXZpemVyKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW5zZXJ0VGVhc2VyKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQ29kZUVtYmVkKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQWtCb2R5Q2xhc3NBZGQoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGaWd1cmVJbWFnZSgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IGltZzJmaWd1cmVJbWFnZSgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEltYWdlUmV3cml0ZXIoKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTaG93Q29udGVudCgpKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNlbGVjdEVsZW1lbnRzKCkpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQW5jaG9yQ2xlYW51cCgpKTtcblxuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBNdW5nZWRBdHRyUmVtb3ZlcigpKTtcblxuICAgIHJldHVybiByZXQ7XG59O1xuXG5mdW5jdGlvbiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgb3B0aW9ucykge1xuICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3V0aWwuaW5zcGVjdChtZXRhZGF0YSl9YCk7XG5cbiAgICB2YXIgc2NyaXB0cztcbiAgICBpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNjcmlwdHMgPSBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMgPyBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgYWstc3R5bGVzaGVldHMgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCl9ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuY29uZmlnLnNjcmlwdHMpfSAke3V0aWwuaW5zcGVjdChzY3JpcHRzKX1gKTtcblxuICAgIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdfZG9TdHlsZXNoZWV0cyBubyBvcHRpb25zJyk7XG4gICAgaWYgKCFvcHRpb25zLmNvbmZpZykgdGhyb3cgbmV3IEVycm9yKCdfZG9TdHlsZXNoZWV0cyBubyBvcHRpb25zLmNvbmZpZycpO1xuXG4gICAgdmFyIHJldCA9ICcnO1xuICAgIGlmICh0eXBlb2Ygc2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yICh2YXIgc3R5bGUgb2Ygc2NyaXB0cykge1xuXG4gICAgICAgICAgICBsZXQgc3R5bGVocmVmID0gc3R5bGUuaHJlZjtcbiAgICAgICAgICAgIGxldCBwSHJlZiA9IHVybC5wYXJzZShzdHlsZS5ocmVmLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBwcm9jZXNzICR7c3R5bGVocmVmfWApO1xuICAgICAgICAgICAgaWYgKCFwSHJlZi5wcm90b2NvbCAmJiAhcEhyZWYuaG9zdG5hbWUgJiYgIXBIcmVmLnNsYXNoZXMpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzXG4gICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzdHlsZWhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQWApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtZXRhZGF0YS5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBIERPQ1VNRU5UYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlQgUkVOREVSVE9gKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyByZWxhdGl2ZSgvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb30sICR7c3R5bGVocmVmfSkgPSAke3JlbGF0aXZlKCcvJyttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbywgc3R5bGVocmVmKX1gKVxuICAgICAgICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBhYnNvbHV0ZSBzdHlsZWhyZWYgJHtzdHlsZWhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlaHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0ICQgPSBtYWhhYmh1dGEucGFyc2UoJzxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiXCIvPicpO1xuICAgICAgICAgICAgJCgnbGluaycpLmF0dHIoJ2hyZWYnLCBzdHlsZWhyZWYpO1xuICAgICAgICAgICAgaWYgKHN0eWxlLm1lZGlhKSB7XG4gICAgICAgICAgICAgICAgJCgnbGluaycpLmF0dHIoJ21lZGlhJywgc3R5bGUubWVkaWEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0ICs9ICQuaHRtbCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3JldH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMpIHtcblx0dmFyIHJldCA9ICcnO1xuXHRpZiAoIXNjcmlwdHMpIHJldHVybiByZXQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghb3B0aW9ucy5jb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucy5jb25maWcnKTtcblxuICAgIGZvciAodmFyIHNjcmlwdCBvZiBzY3JpcHRzKSB7XG5cdFx0aWYgKCFzY3JpcHQuaHJlZiAmJiAhc2NyaXB0LnNjcmlwdCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBNdXN0IHNwZWNpZnkgZWl0aGVyIGhyZWYgb3Igc2NyaXB0IGluICR7dXRpbC5pbnNwZWN0KHNjcmlwdCl9YCk7XG5cdFx0fVxuICAgICAgICBpZiAoIXNjcmlwdC5zY3JpcHQpIHNjcmlwdC5zY3JpcHQgPSAnJztcbiAgICAgICAgbGV0ICQgPSBtYWhhYmh1dGEucGFyc2UoJzxzY3JpcHQgPjwvc2NyaXB0PicpO1xuICAgICAgICBpZiAoc2NyaXB0LmxhbmcpICQoJ3NjcmlwdCcpLmF0dHIoJ3R5cGUnLCBzY3JpcHQubGFuZyk7XG4gICAgICAgIGlmIChzY3JpcHQuaHJlZikge1xuICAgICAgICAgICAgbGV0IHNjcmlwdGhyZWYgPSBzY3JpcHQuaHJlZjtcbiAgICAgICAgICAgIGxldCBwSHJlZiA9IHVybC5wYXJzZShzY3JpcHQuaHJlZiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIXBIcmVmLnByb3RvY29sICYmICFwSHJlZi5ob3N0bmFtZSAmJiAhcEhyZWYuc2xhc2hlcykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rc1xuICAgICAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoc2NyaXB0aHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc2NyaXB0aHJlZik7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9KYXZhU2NyaXB0cyBhYnNvbHV0ZSBzY3JpcHRocmVmICR7c2NyaXB0aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc2NyaXB0aHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8qIGlmIChvcHRpb25zLmNvbmZpZy5yb290X3VybCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcFJvb3RVcmwgPSB1cmwucGFyc2Uob3B0aW9ucy5jb25maWcucm9vdF91cmwpO1xuICAgICAgICAgICAgICAgICAgICBzY3JpcHRocmVmID0gcGF0aC5ub3JtYWxpemUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHBSb290VXJsLnBhdGhuYW1lLCBwSHJlZi5wYXRobmFtZSlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKCdzY3JpcHQnKS5hdHRyKCdzcmMnLCBzY3JpcHRocmVmKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NyaXB0LnNjcmlwdCkge1xuICAgICAgICAgICAgJCgnc2NyaXB0JykuYXBwZW5kKHNjcmlwdC5zY3JpcHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldCArPSAkLmh0bWwoKTtcblx0fVxuXHQvLyBjb25zb2xlLmxvZygnX2RvSmF2YVNjcmlwdHMgJysgcmV0KTtcblx0cmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucykge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdFRvcC5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMgPyBvcHRpb25zLmNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AgOiB1bmRlZmluZWQ7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coYF9kb0hlYWRlckphdmFTY3JpcHQgJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KG9wdGlvbnMuY29uZmlnLnNjcmlwdHMpfWApO1xuXHRyZXR1cm4gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zKSB7XG5cdHZhciBzY3JpcHRzO1xuXHRpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRCb3R0b20gIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzY3JpcHRzID0gb3B0aW9ucy5jb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gb3B0aW9ucy5jb25maWcuc2NyaXB0cyA/IG9wdGlvbnMuY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbSA6IHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMpO1xufVxuXG5jbGFzcyBTdHlsZXNoZWV0c0VsZW1lbnQgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstc3R5bGVzaGVldHNcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pIHtcblx0XHRsZXQgcmV0ID0gIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU3R5bGVzaGVldHNFbGVtZW50IGAsIHJldCk7XG4gICAgICAgIHJldHVybiByZXQ7XG5cdH1cbn1cblxuY2xhc3MgSGVhZGVySmF2YVNjcmlwdCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1oZWFkZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9IF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBIZWFkZXJKYXZhU2NyaXB0IGAsIHJldCk7XG4gICAgICAgIHJldHVybiByZXQ7XG5cdH1cbn1cblxuY2xhc3MgRm9vdGVySmF2YVNjcmlwdCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1mb290ZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucyk7XG5cdH1cbn1cblxuY2xhc3MgSGVhZExpbmtSZWxhdGl2aXplciBleHRlbmRzIG1haGFiaHV0YS5NdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cbiAgICAgICAgbGV0IHBIcmVmID0gdXJsLnBhcnNlKGhyZWYsIHRydWUsIHRydWUpO1xuICAgICAgICBpZiAoIXBIcmVmLnByb3RvY29sICYmICFwSHJlZi5ob3N0bmFtZSAmJiAhcEhyZWYuc2xhc2hlcykge1xuICAgICAgICAgICAgLy8gSXQncyBhIGxvY2FsIGxpbmtcbiAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIFNjcmlwdFJlbGF0aXZpemVyIGV4dGVuZHMgbWFoYWJodXRhLk11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJzY3JpcHRcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdzcmMnKTtcblxuICAgICAgICBpZiAoaHJlZikge1xuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSBsaW5rXG4gICAgICAgICAgICBsZXQgcEhyZWYgPSB1cmwucGFyc2UoaHJlZiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIXBIcmVmLnByb3RvY29sICYmICFwSHJlZi5ob3N0bmFtZSAmJiAhcEhyZWYuc2xhc2hlcykge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgSW5zZXJ0VGVhc2VyIGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXRlYXNlclwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB0cnkge1xuXHRcdHJldHVybiB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFrYXNoYS5wYXJ0aWFsKHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWtfdGVhc2VyLmh0bWwubmprXCIsIHtcblx0XHRcdHRlYXNlcjogdHlwZW9mIG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdICE9PSBcInVuZGVmaW5lZFwiXG5cdFx0XHRcdD8gbWV0YWRhdGFbXCJhay10ZWFzZXJcIl0gOiBtZXRhZGF0YS50ZWFzZXJcblx0XHR9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW5zZXJ0VGVhc2VyIGNhdWdodCBlcnJvciBgLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cblx0fVxufVxuXG5jbGFzcyBBa0JvZHlDbGFzc0FkZCBleHRlbmRzIG1haGFiaHV0YS5QYWdlUHJvY2Vzc29yIHtcblx0YXN5bmMgcHJvY2VzcygkLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGlmICh0eXBlb2YgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT09ICd1bmRlZmluZWQnXG5cdFx0ICYmIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9ICcnXG5cdFx0ICYmICQoJ2h0bWwgYm9keScpLmdldCgwKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0aWYgKCEkKCdodG1sIGJvZHknKS5oYXNDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCkpIHtcblx0XHRcdFx0XHQkKCdodG1sIGJvZHknKS5hZGRDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZSh1bmRlZmluZWQpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHJldHVybiBQcm9taXNlLnJlc29sdmUoJycpO1xuXHR9XG59XG5cbmNsYXNzIENvZGVFbWJlZCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImNvZGUtZW1iZWRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICBjb25zdCBmbiA9ICRlbGVtZW50LmF0dHIoJ2ZpbGUtbmFtZScpO1xuICAgICAgICBjb25zdCBsYW5nID0gJGVsZW1lbnQuYXR0cignbGFuZycpO1xuICAgICAgICBjb25zdCBpZCA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG5cbiAgICAgICAgaWYgKCFmbiB8fCBmbiA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29kZS1lbWJlZCBtdXN0IGhhdmUgZmlsZS1uYW1lIGFyZ3VtZW50LCBnb3QgJHtmbn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0eHRwYXRoO1xuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGZuKSkge1xuICAgICAgICAgICAgdHh0cGF0aCA9IGZuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHh0cGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pLCBmbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQodHh0cGF0aCk7XG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29kZS1lbWJlZCBmaWxlLW5hbWUgJHtmbn0gZG9lcyBub3QgcmVmZXIgdG8gdXNhYmxlIGZpbGVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHR4dCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG4gICAgICAgIGxldCAkID0gbWFoYWJodXRhLnBhcnNlKGA8cHJlPjxjb2RlPjwvY29kZT48L3ByZT5gKTtcbiAgICAgICAgaWYgKGxhbmcgJiYgbGFuZyAhPT0gJycpIHtcbiAgICAgICAgICAgICQoJ2NvZGUnKS5hZGRDbGFzcyhsYW5nKTtcbiAgICAgICAgfVxuICAgICAgICAkKCdjb2RlJykuYWRkQ2xhc3MoJ2hsanMnKTtcbiAgICAgICAgaWYgKGlkICYmIGlkICE9PSAnJykge1xuICAgICAgICAgICAgJCgncHJlJykuYXR0cignaWQnLCBpZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhbmcgJiYgbGFuZyAhPT0gJycpIHtcbiAgICAgICAgICAgICQoJ2NvZGUnKS5hcHBlbmQoaGxqcy5oaWdobGlnaHQodHh0LCB7XG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmdcbiAgICAgICAgICAgIH0pLnZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoJ2NvZGUnKS5hcHBlbmQoaGxqcy5oaWdobGlnaHRBdXRvKHR4dCkudmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAkLmh0bWwoKTtcbiAgICB9XG59XG5cbmNsYXNzIEZpZ3VyZUltYWdlIGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiZmlnLWltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX2ZpZ2ltZy5odG1sLm5qayc7XG4gICAgICAgIGNvbnN0IGhyZWYgICAgPSAkZWxlbWVudC5hdHRyKCdocmVmJyk7XG4gICAgICAgIGlmICghaHJlZikgdGhyb3cgbmV3IEVycm9yKCdmaWctaW1nIG11c3QgcmVjZWl2ZSBhbiBocmVmJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcsIHRlbXBsYXRlLCB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIGltZzJmaWd1cmVJbWFnZSBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGltZ1tmaWd1cmVdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKSBcbiAgICAgICAgICAgICAgICA/ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJylcbiAgICAgICAgICAgICAgICA6ICBcImFrX2ZpZ2ltZy5odG1sLm5qa1wiO1xuICAgICAgICBjb25zdCBpZCA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCB3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHNyYyA9ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCdjYXB0aW9uJylcbiAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcsIHRlbXBsYXRlLCB7XG4gICAgICAgICAgICBpZCwgY2xhenosIHN0eWxlLCB3aWR0aCwgaHJlZjogc3JjLCBkZXN0LCByZXNpemV3aWR0aCwgcmVzaXpldG8sXG4gICAgICAgICAgICBjYXB0aW9uOiBjb250ZW50XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgSW1hZ2VSZXdyaXRlciBleHRlbmRzIG1haGFiaHV0YS5NdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgaW1nXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuXG4gICAgICAgIC8vIFdlIG9ubHkgZG8gcmV3cml0ZXMgZm9yIGxvY2FsIGltYWdlc1xuICAgICAgICBsZXQgc3JjID0gJGxpbmsuYXR0cignc3JjJyk7XG4gICAgICAgIGNvbnN0IHVTcmMgPSB1cmwucGFyc2Uoc3JjLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgaWYgKHVTcmMucHJvdG9jb2wgfHwgdVNyYy5zbGFzaGVzKSByZXR1cm4gXCJva1wiO1xuICAgICAgICBcbiAgICAgICAgLy8gQXJlIHdlIGFza2VkIHRvIHJlc2l6ZSB0aGUgaW1hZ2U/XG4gICAgICAgIGNvbnN0IHJlc2l6ZXdpZHRoID0gJGxpbmsuYXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXRvID0gJGxpbmsuYXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAocmVzaXpld2lkdGgpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0byBhIHF1ZXVlIHRoYXQgaXMgcnVuIGF0IHRoZSBlbmQgXG4gICAgICAgICAgICB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgIC5hZGRJbWFnZVRvUmVzaXplKHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyk7XG5cbiAgICAgICAgICAgIGlmIChyZXNpemV0bykge1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIHJlc2l6ZXRvKTtcbiAgICAgICAgICAgICAgICBzcmMgPSByZXNpemV0bztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlc2UgYXJlIG5vIGxvbmdlciBuZWVkZWRcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgaWRlYSBoZXJlIGlzIGZvciBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgYSByZWxhdGl2ZSBVUkxcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShzcmMpKSB7XG4gICAgICAgICAgICBsZXQgbmV3U3JjID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNyYyk7XG4gICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdTcmMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEltYWdlUmV3cml0ZXIgYWJzb2x1dGUgaW1hZ2UgcGF0aCAke3NyY30gcmV3cm90ZSB0byAke25ld1NyY31gKTtcbiAgICAgICAgICAgIHNyYyA9IG5ld1NyYztcbiAgICAgICAgfVxuXG4gICAgICAgIC8qXG4gICAgICAgIC8vIFRoZSBpZGVhIGhlcmUgaXMgZm9yIGV2ZXJ5IGxvY2FsIGltYWdlIHNyYyB0byBiZSBhbiBhYnNvbHV0ZSBVUkxcbiAgICAgICAgLy8gVGhhdCB0aGVuIHJlcXVpcmVzIGV2ZXJ5IGxvY2FsIGltYWdlIHNyYyB0byBiZSBwcmVmaXhlZCB3aXRoIGFueVxuICAgICAgICAvLyBzdWJkaXJlY3RvcnkgY29udGFpbmVkIGluIGNvbmZpZy5yb290X3VybFxuICAgICAgICAvLyBcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHNyYyBtdXN0IGJlIHVwZGF0ZWQgZm9yIGNvbmZpZy5yb290X3VybFxuICAgICAgICAvLyBUaGlzIGRvZXMgbm90IGFwcGx5IHRvIHJlbGF0aXZlIGltYWdlIHBhdGhzXG4gICAgICAgIC8vIFRoZXJlZm9yZSBpZiBpdCBpcyBhbiBhYnNvbHV0ZSBsb2NhbCBpbWFnZSBwYXRoLCBhbmQgdGhlcmUgaXMgYSByb290X3VybFxuICAgICAgICAvLyB3ZSBtdXN0IHJld3JpdGUgdGhlIHNyYyBwYXRoIHRvIHN0YXJ0IHdpdGggdGhlIHJvb3RfdXJsXG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjKSAmJiB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICBsZXQgcFJvb3RVcmwgPSB1cmwucGFyc2UodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybCk7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB0aGUgVVJMIGhhcyBhbHJlYWR5IGJlZW4gcmV3cml0dGVuXG4gICAgICAgICAgICBpZiAoIXNyYy5zdGFydHNXaXRoKHBSb290VXJsLnBhdGhuYW1lKSkge1xuICAgICAgICAgICAgICAgIGxldCBuZXdTcmMgPSBwYXRoLm5vcm1hbGl6ZShcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHBSb290VXJsLnBhdGhuYW1lLCBzcmMpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdTcmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICovXG4gICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTaG93Q29udGVudCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNob3ctY29udGVudFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX3Nob3ctY29udGVudC5odG1sLm5qayc7XG4gICAgICAgIGxldCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ3Nob3ctY29udGVudCBtdXN0IHJlY2VpdmUgYW4gaHJlZicpKTtcbiAgICAgICAgY29uc3QgY2xhenogICA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgICAgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjYXB0aW9uID0gJGVsZW1lbnQuaHRtbCgpO1xuICAgICAgICBjb25zdCB3aWR0aCAgID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgICA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRJbWFnZSA9ICRlbGVtZW50LmF0dHIoJ2NvbnRlbnQtaW1hZ2UnKTtcbiAgICAgICAgbGV0IGRvYzJyZWFkO1xuICAgICAgICBpZiAoISBocmVmLnN0YXJ0c1dpdGgoJy8nKSkge1xuICAgICAgICAgICAgbGV0IGRpciA9IHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5wYXRoKTtcbiAgICAgICAgICAgIGRvYzJyZWFkID0gcGF0aC5qb2luKCcvJywgZGlyLCBocmVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRvYzJyZWFkID0gaHJlZjtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2hvd0NvbnRlbnQgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSAke2RvYzJyZWFkfWApO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGRvYzJyZWFkKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0LCBjb250ZW50SW1hZ2UsXG4gICAgICAgICAgICBkb2N1bWVudDogZG9jXG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXQgPSBhd2FpdCB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgICAgIHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcsIHRlbXBsYXRlLCBkYXRhKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7aHJlZn0gJHt1dGlsLmluc3BlY3QoZGF0YSl9ID09PiAke3JldH1gKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbi8qXG5cblRoaXMgd2FzIG1vdmVkIGludG8gTWFoYWJodXRhXG5cbiBjbGFzcyBQYXJ0aWFsIGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInBhcnRpYWxcIjsgfVxuXHRwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblx0XHQvLyBXZSBkZWZhdWx0IHRvIG1ha2luZyBwYXJ0aWFsIHNldCB0aGUgZGlydHkgZmxhZy4gIEJ1dCBhIHVzZXJcblx0XHQvLyBvZiB0aGUgcGFydGlhbCB0YWcgY2FuIGNob29zZSB0byB0ZWxsIHVzIGl0IGlzbid0IGRpcnR5LlxuXHRcdC8vIEZvciBleGFtcGxlLCBpZiB0aGUgcGFydGlhbCBvbmx5IHN1YnN0aXR1dGVzIG5vcm1hbCB0YWdzXG5cdFx0Ly8gdGhlcmUncyBubyBuZWVkIHRvIGRvIHRoZSBkaXJ0eSB0aGluZy5cblx0XHR2YXIgZG90aGVkaXJ0eXRoaW5nID0gJGVsZW1lbnQuYXR0cignZGlydHknKTtcblx0XHRpZiAoIWRvdGhlZGlydHl0aGluZyB8fCBkb3RoZWRpcnR5dGhpbmcubWF0Y2goL3RydWUvaSkpIHtcblx0XHRcdGRpcnR5KCk7XG5cdFx0fVxuXHRcdHZhciBmbmFtZSA9ICRlbGVtZW50LmF0dHIoXCJmaWxlLW5hbWVcIik7XG5cdFx0dmFyIHR4dCAgID0gJGVsZW1lbnQuaHRtbCgpO1xuXHRcdHZhciBkID0ge307XG5cdFx0Zm9yICh2YXIgbXByb3AgaW4gbWV0YWRhdGEpIHsgZFttcHJvcF0gPSBtZXRhZGF0YVttcHJvcF07IH1cblx0XHR2YXIgZGF0YSA9ICRlbGVtZW50LmRhdGEoKTtcblx0XHRmb3IgKHZhciBkcHJvcCBpbiBkYXRhKSB7IGRbZHByb3BdID0gZGF0YVtkcHJvcF07IH1cblx0XHRkW1wicGFydGlhbEJvZHlcIl0gPSB0eHQ7XG5cdFx0bG9nKCdwYXJ0aWFsIHRhZyBmbmFtZT0nKyBmbmFtZSArJyBhdHRycyAnKyB1dGlsLmluc3BlY3QoZGF0YSkpO1xuXHRcdHJldHVybiByZW5kZXIucGFydGlhbCh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLCBmbmFtZSwgZClcblx0XHQudGhlbihodG1sID0+IHsgcmV0dXJuIGh0bWw7IH0pXG5cdFx0LmNhdGNoKGVyciA9PiB7XG5cdFx0XHRlcnJvcihuZXcgRXJyb3IoXCJGQUlMIHBhcnRpYWwgZmlsZS1uYW1lPVwiKyBmbmFtZSArXCIgYmVjYXVzZSBcIisgZXJyKSk7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGQUlMIHBhcnRpYWwgZmlsZS1uYW1lPVwiKyBmbmFtZSArXCIgYmVjYXVzZSBcIisgZXJyKTtcblx0XHR9KTtcblx0fVxufVxubW9kdWxlLmV4cG9ydHMubWFoYWJodXRhLmFkZE1haGFmdW5jKG5ldyBQYXJ0aWFsKCkpOyAqL1xuXG4vL1xuLy8gPHNlbGVjdC1lbGVtZW50cyBjbGFzcz1cIi4uXCIgaWQ9XCIuLlwiIGNvdW50PVwiTlwiPlxuLy8gICAgIDxlbGVtZW50PjwvZWxlbWVudD5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyA8L3NlbGVjdC1lbGVtZW50cz5cbi8vXG5jbGFzcyBTZWxlY3RFbGVtZW50cyBleHRlbmRzIG1haGFiaHV0YS5NdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2VsZWN0LWVsZW1lbnRzXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBsZXQgY291bnQgPSAkbGluay5hdHRyKCdjb3VudCcpXG4gICAgICAgICAgICAgICAgICAgID8gTnVtYmVyLnBhcnNlSW50KCRsaW5rLmF0dHIoJ2NvdW50JykpXG4gICAgICAgICAgICAgICAgICAgIDogMTtcbiAgICAgICAgY29uc3QgY2xhenogPSAkbGluay5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICA9ICRsaW5rLmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IHRuICAgID0gJGxpbmsuYXR0cigndGFnLW5hbWUnKVxuICAgICAgICAgICAgICAgICAgICA/ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgOiAnZGl2JztcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9ICRsaW5rLmNoaWxkcmVuKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gW107XG5cbiAgICAgICAgZm9yICg7IGNvdW50ID49IDEgJiYgY2hpbGRyZW4ubGVuZ3RoID49IDE7IGNvdW50LS0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgX24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coX24pO1xuICAgICAgICAgICAgY29uc3QgY2hvc2VuID0gJChjaGlsZHJlbltfbl0pLmh0bWwoKTtcbiAgICAgICAgICAgIHNlbGVjdGVkLnB1c2goY2hvc2VuKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaG9zZW4pO1xuICAgICAgICAgICAgZGVsZXRlIGNoaWxkcmVuW19uXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX3V1aWQgPSB1dWlkdjEoKTtcbiAgICAgICAgJGxpbmsucmVwbGFjZVdpdGgoYDwke3RufSBpZD0nJHtfdXVpZH0nPjwvJHt0bn0+YCk7XG4gICAgICAgIGNvbnN0ICRuZXdJdGVtID0gJChgJHt0bn0jJHtfdXVpZH1gKTtcbiAgICAgICAgaWYgKGlkKSAkbmV3SXRlbS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgZWxzZSAkbmV3SXRlbS5yZW1vdmVBdHRyKCdpZCcpO1xuICAgICAgICBpZiAoY2xhenopICRuZXdJdGVtLmFkZENsYXNzKGNsYXp6KTtcbiAgICAgICAgZm9yIChsZXQgY2hvc2VuIG9mIHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAkbmV3SXRlbS5hcHBlbmQoY2hvc2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbmNsYXNzIEFuY2hvckNsZWFudXAgZXh0ZW5kcyBtYWhhYmh1dGEuTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cblxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgaHJlZiAgICAgPSAkbGluay5hdHRyKCdocmVmJyk7XG4gICAgICAgIHZhciBsaW5rdGV4dCA9ICRsaW5rLnRleHQoKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7aHJlZn0gJHtsaW5rdGV4dH1gKTtcbiAgICAgICAgaWYgKGhyZWYgJiYgaHJlZiAhPT0gJyMnKSB7XG4gICAgICAgICAgICB2YXIgdUhyZWYgPSB1cmwucGFyc2UoaHJlZiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAodUhyZWYucHJvdG9jb2wgfHwgdUhyZWYuc2xhc2hlcykgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIGlmICghdUhyZWYucGF0aG5hbWUpIHJldHVybiBcIm9rXCI7XG5cbiAgICAgICAgICAgIC8qIGlmIChtZXRhZGF0YS5kb2N1bWVudC5wYXRoID09PSAnaW5kZXguaHRtbC5tZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gaHJlZiAke2hyZWZ9IHVIcmVmLnBhdGhuYW1lICR7dUhyZWYucGF0aG5hbWV9IHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcucm9vdF91cmwgJHt0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCQuaHRtbCgpKTtcbiAgICAgICAgICAgIH0gKi9cblxuICAgICAgICAgICAgLy8gbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgIC8vIFdlIGhhdmUgZGV0ZXJtaW5lZCB0aGlzIGlzIGEgbG9jYWwgaHJlZi5cbiAgICAgICAgICAgIC8vIEZvciByZWZlcmVuY2Ugd2UgbmVlZCB0aGUgYWJzb2x1dGUgcGF0aG5hbWUgb2YgdGhlIGhyZWYgd2l0aGluXG4gICAgICAgICAgICAvLyB0aGUgcHJvamVjdC4gIEZvciBleGFtcGxlIHRvIHJldHJpZXZlIHRoZSB0aXRsZSB3aGVuIHdlJ3JlIGZpbGxpbmdcbiAgICAgICAgICAgIC8vIGluIGZvciBhbiBlbXB0eSA8YT4gd2UgbmVlZCB0aGUgYWJzb2x1dGUgcGF0aG5hbWUuXG5cbiAgICAgICAgICAgIC8vIE1hcmsgdGhpcyBsaW5rIGFzIGhhdmluZyBiZWVuIHByb2Nlc3NlZC5cbiAgICAgICAgICAgIC8vIFRoZSBwdXJwb3NlIGlzIGlmIE1haGFiaHV0YSBydW5zIG11bHRpcGxlIHBhc3NlcyxcbiAgICAgICAgICAgIC8vIHRvIG5vdCBwcm9jZXNzIHRoZSBsaW5rIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICAgICAgLy8gQmVmb3JlIGFkZGluZyB0aGlzIC0gd2Ugc2F3IHRoaXMgTXVuZ2VyIHRha2UgYXMgbXVjaFxuICAgICAgICAgICAgLy8gYXMgODAwbXMgdG8gZXhlY3V0ZSwgZm9yIEVWRVJZIHBhc3MgbWFkZSBieSBNYWhhYmh1dGEuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQWRkaW5nIHRoaXMgYXR0cmlidXRlLCBhbmQgY2hlY2tpbmcgZm9yIGl0IGluIHRoZSBzZWxlY3RvcixcbiAgICAgICAgICAgIC8vIG1lYW5zIHdlIG9ubHkgcHJvY2VzcyB0aGUgbGluayBvbmNlLlxuICAgICAgICAgICAgJGxpbmsuYXR0cignbXVuZ2VkJywgJ3llcycpO1xuXG4gICAgICAgICAgICBsZXQgYWJzb2x1dGVQYXRoO1xuXG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZSh1SHJlZi5wYXRobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgpLCB1SHJlZi5wYXRobmFtZSk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYCoqKioqIEFuY2hvckNsZWFudXAgRklYRUQgaHJlZiB0byAke3VIcmVmLnBhdGhuYW1lfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSB1SHJlZi5wYXRobmFtZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIGlkZWEgZm9yIHRoaXMgc2VjdGlvbiBpcyB0byBlbnN1cmUgYWxsIGxvY2FsIGhyZWYncyBhcmUgXG4gICAgICAgICAgICAvLyBmb3IgYSByZWxhdGl2ZSBwYXRoIHJhdGhlciB0aGFuIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIEhlbmNlIHdlIHVzZSB0aGUgcmVsYXRpdmUgbW9kdWxlIHRvIGNvbXB1dGUgdGhlIHJlbGF0aXZlIHBhdGhcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBFeGFtcGxlOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAvaW5kZXguaHRtbCBpbiB7XG4gICAgICAgICAgICAvLyAgYmFzZWRpcjogJy9Wb2x1bWVzL0V4dHJhL2FrYXNoYXJlbmRlci9ha2FzaGFyZW5kZXIvdGVzdC9kb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gIHJlbHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbHJlbmRlcjogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbCcsXG4gICAgICAgICAgICAvLyAgcGF0aDogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbC5tZCcsXG4gICAgICAgICAgICAvLyAgcmVuZGVyVG86ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnXG4gICAgICAgICAgICAvLyB9IHRvIC4uLy4uLy4uL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3NcbiAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgLy8gVGhlIGlkZWEgZm9yIHRoaXMgc2VjdGlvbiBpcyB0byBcbiAgICAgICAgICAgIC8vICAgICBhKSBlbnN1cmUgYWxsIHJlbGF0aXZlIHBhdGhzIGFyZSBtYWRlIGFic29sdXRlXG4gICAgICAgICAgICAvLyAgICAgYikgdGhlcmVmb3JlIGFsbCBhYnNvbHV0ZSBwYXRocyB3aGVuIGNvbmZpZy5yb290X3VybFxuICAgICAgICAgICAgLy8gICAgICAgIGlzIGZvciBhIG5lc3RlZCBzdWJkaXJlY3RvcnkgbXVzdCBoYXZlIHRoZSBwYXRoXG4gICAgICAgICAgICAvLyAgICAgICAgcHJlZml4ZWQgd2l0aCB0aGUgc3ViZGlyZWN0b3J5XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIGhyZWYgbXVzdCBiZSB1cGRhdGVkIGZvciBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIGlmICh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBSb290VXJsID0gdXJsLnBhcnNlKHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcucm9vdF91cmwpO1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIHRoZSBVUkwgaGFzIGFscmVhZHkgYmVlbiByZXdyaXR0ZW5cbiAgICAgICAgICAgICAgICBpZiAoIWhyZWYuc3RhcnRzV2l0aChwUm9vdFVybC5wYXRobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSBwYXRoLm5vcm1hbGl6ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguam9pbihwUm9vdFVybC5wYXRobmFtZSwgYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmIChtZXRhZGF0YS5kb2N1bWVudC5wYXRoID09PSAnaW5kZXguaHRtbC5tZCcpIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIG1ldGFkYXRhLmRvY3VtZW50LnBhdGggJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBocmVmICR7aHJlZn0gYWJzb2x1dGVQYXRoICR7YWJzb2x1dGVQYXRofSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLnJvb3RfdXJsICR7dGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5yb290X3VybH0gbmV3SHJlZiAke25ld0hyZWZ9YCk7ICogL1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAqL1xuXG4gICAgICAgICAgICAvLyBMb29rIHRvIHNlZSBpZiBpdCdzIGFuIGFzc2V0IGZpbGVcbiAgICAgICAgICAgIGxldCBmb3VuZEFzc2V0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gYXdhaXQgYXNzZXRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvdW5kQXNzZXQpIHsgLy8gJiYgZm91bmRBc3NldC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRBc3NldCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcblxuICAgICAgICAgICAgLy8gQXNrIHBsdWdpbnMgaWYgdGhlIGhyZWYgaXMgb2theVxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmKGFic29sdXRlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGxpbmsgaGFzIGEgYm9keSwgdGhlbiBkb24ndCBtb2RpZnkgaXRcbiAgICAgICAgICAgIGlmICgobGlua3RleHQgJiYgbGlua3RleHQubGVuZ3RoID4gMCAmJiBsaW5rdGV4dCAhPT0gYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHx8ICgkbGluay5jaGlsZHJlbigpLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgc2tpcHBpbmcgJHthYnNvbHV0ZVBhdGh9IHcvICR7dXRpbC5pbnNwZWN0KGxpbmt0ZXh0KX0gY2hpbGRyZW49ICR7JGxpbmsuY2hpbGRyZW4oKX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEb2VzIGl0IGV4aXN0IGluIGRvY3VtZW50cyBkaXI/XG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChhYnNvbHV0ZVBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluZFJlbmRlcnNUbyAke2Fic29sdXRlUGF0aH0gJHt1dGlsLmluc3BlY3QoZm91bmQpfWApO1xuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmRvY3VtZW50RGlycyl9IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gYWJzb2x1dGVQYXRoICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZFJlbmRlcnNUbyAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcblxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGRpcmVjdG9yeSwgdGhlcmUgbWlnaHQgYmUgL3BhdGgvdG8vaW5kZXguaHRtbCBzbyB3ZSB0cnkgZm9yIHRoYXQuXG4gICAgICAgICAgICAvLyBUaGUgcHJvYmxlbSBpcyB0aGF0IHRoaXMuYXJyYXkub3B0aW9ucy5jb25maWcuZmluZFJlbmRlcmVyUGF0aCB3b3VsZCBmYWlsIG9uIGp1c3QgL3BhdGgvdG8gYnV0IHN1Y2NlZWRcbiAgICAgICAgICAgIC8vIG9uIC9wYXRoL3RvL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIGlmIChmb3VuZC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aC5qb2luKGFic29sdXRlUGF0aCwgXCJpbmRleC5odG1sXCIpKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5hcnJheS5vcHRpb25zLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgaW50byBmaWxsaW5nIGVtcHRpbmVzcyB3aXRoIHRpdGxlXG5cbiAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIGlmICghJGxpbmsuYXR0cigndGl0bGUnKSAmJiBkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoaHJlZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgcmVuZGVyZXIgPSB0aGlzLmFycmF5Lm9wdGlvbnMuY29uZmlnLmZpbmRSZW5kZXJlclBhdGgoZm91bmQudnBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJlclBhdGggJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG4gICAgICAgICAgICBpZiAocmVuZGVyZXIgJiYgcmVuZGVyZXIubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgICAgIC8qIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkb2NtZXRhID0gYXdhaXQgcmVuZGVyZXIubWV0YWRhdGEoZm91bmQuZm91bmREaXIsIGZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcik7XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmV0cmlldmUgZG9jdW1lbnQgbWV0YWRhdGEgZm9yICR7Zm91bmQuZm91bmREaXJ9ICR7Zm91bmQuZm91bmRQYXRoV2l0aGluRGlyfSBiZWNhdXNlICR7ZXJyfWApO1xuICAgICAgICAgICAgICAgIH0gKi0tL1xuICAgICAgICAgICAgICAgIC8vIEF1dG9tYXRpY2FsbHkgYWRkIGEgdGl0bGU9IGF0dHJpYnV0ZVxuICAgICAgICAgICAgICAgIGlmICghJGxpbmsuYXR0cigndGl0bGUnKSAmJiBkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBmaW5pc2hlZGApO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBET05FICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIERvbid0IGJvdGhlciB0aHJvd2luZyBhbiBlcnJvci4gIEp1c3QgZmlsbCBpdCBpbiB3aXRoXG4gICAgICAgICAgICAgICAgLy8gc29tZXRoaW5nLlxuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoaHJlZik7XG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgZmlsbCBpbiBlbXB0eSAnYScgZWxlbWVudCBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IHdpdGggaHJlZiAke2hyZWZ9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAqL1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLyAgTUFIQUZVTkNTIEZPUiBGSU5BTCBQQVNTXG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgPGNvZGU+bXVuZ2VkPXllczwvY29kZT4gYXR0cmlidXRlIHRoYXQgaXMgYWRkZWRcbiAqIGJ5IDxjb2RlPkFuY2hvckNsZWFudXA8L2NvZGU+LlxuICovXG5jbGFzcyBNdW5nZWRBdHRyUmVtb3ZlciBleHRlbmRzIG1haGFiaHV0YS5NdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgJGVsZW1lbnQucmVtb3ZlQXR0cignbXVuZ2VkJyk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vIE51bmp1Y2tzIEV4dGVuc2lvbnNcblxuLy8gRnJvbSBodHRwczovL2dpdGh1Yi5jb20vc29mdG9uaWMvbnVuanVja3MtaW5jbHVkZS13aXRoL3RyZWUvbWFzdGVyXG5cbmNsYXNzIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2Frc3R5bGVzaGVldHMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gc3R5bGVzaGVldHNFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha3N0eWxlc2hlZXRzJyk7XG5cbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuXG4gICAgICAgICAgICAvLyBTZWUgYWJvdmUgZm9yIG5vdGVzIGFib3V0IENhbGxFeHRlbnNpb25cbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHN0eWxlc2hlZXRzRXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9TdHlsZXNoZWV0cyhjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2hlYWRlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFraGVhZGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9IZWFkZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5jbGFzcyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2FrZm9vdGVyanMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtmb290ZXJqcycpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb0Zvb3RlckphdmFTY3JpcHQoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRlc3RFeHRlbnNpb24oKSB7XG4gICAgdGhpcy50YWdzID0gWyAnYWtuamt0ZXN0JyBdO1xuXG4gICAgdGhpcy5wYXJzZSA9IGZ1bmN0aW9uKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG5jb25zb2xlLmxvZyhgaW4gdGVzdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRhZyB0b2tlblxuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcblxuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYXJncyBhbmQgbW92ZSBhZnRlciB0aGUgYmxvY2sgZW5kLiBwYXNzaW5nIHRydWVcbiAgICAgICAgICAgIC8vIGFzIHRoZSBzZWNvbmQgYXJnIGlzIHJlcXVpcmVkIGlmIHRoZXJlIGFyZSBubyBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGJvZHkgYW5kIHBvc3NpYmx5IHRoZSBlcnJvciBibG9jaywgd2hpY2ggaXMgb3B0aW9uYWxcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2Vycm9yJywgJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgdmFyIGVycm9yQm9keSA9IG51bGw7XG5cbiAgICAgICAgICAgIGlmKHBhcnNlci5za2lwU3ltYm9sKCdlcnJvcicpKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VyLnNraXAobGV4ZXIuVE9LRU5fQkxPQ0tfRU5EKTtcbiAgICAgICAgICAgICAgICBlcnJvckJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtuamt0ZXN0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuXG4gICAgICAgICAgICAvLyBTZWUgYWJvdmUgZm9yIG5vdGVzIGFib3V0IENhbGxFeHRlbnNpb25cbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHksIGVycm9yQm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRlc3RFeHRpb25zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICB0aGlzLnJ1biA9IGZ1bmN0aW9uKGNvbnRleHQsIHVybCwgYm9keSwgZXJyb3JCb2R5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgJHt1dGlsLmluc3BlY3QoY29udGV4dCl9ICR7dXRpbC5pbnNwZWN0KHVybCl9ICR7dXRpbC5pbnNwZWN0KGJvZHkpfSAke3V0aWwuaW5zcGVjdChlcnJvckJvZHkpfWApO1xuICAgIH07XG5cbn0iXX0=