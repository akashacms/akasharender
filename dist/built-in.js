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
    }
}
_BuiltInPlugin_config = new WeakMap(), _BuiltInPlugin_resize_queue = new WeakMap();
export const mahabhutaArray = function (options, config, akasha, plugin) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    // ret.addMahafunc(new TagsForDocumentElement(config, akasha, plugin));
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
            let absolutePath;
            if (!path.isAbsolute(href)) {
                absolutePath = path.join(path.dirname(metadata.document.path), href);
                // console.log(`AnchorCleanup href ${href} uHref.pathname ${uHref.pathname} not absolute, absolutePath ${absolutePath}`);
            }
            else {
                absolutePath = href;
                // console.log(`AnchorCleanup href ${href} uHref.pathname ${uHref.pathname} absolute, absolutePath ${absolutePath}`);
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
                console.log(`WARNING: Did not find ${href} in ${util.inspect(this.config.documentDirs)} in ${metadata.document.path} absolutePath ${absolutePath}`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsTUFBTSxZQUFZLENBQUM7QUFFakcsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUM7QUFFdkMsTUFBTSxPQUFPLGFBQWMsU0FBUSxNQUFNO0lBQ3hDO1FBQ0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBS2hCLHdDQUFRO1FBQ1IsOENBQWM7UUFMVix1QkFBQSxJQUFJLCtCQUFpQixFQUFFLE1BQUEsQ0FBQztJQUUvQixDQUFDO0lBS0QsU0FBUyxDQUFDLE1BQXFCLEVBQUUsT0FBTztRQUNqQyx1QkFBQSxJQUFJLHlCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLE1B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QUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsQ0FBQztJQUNMLENBQUMsQ0FBQztJQUdGLElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBUyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTO1FBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUM1SCxDQUFDLENBQUM7QUFFTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBmc3AgZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgdXJsIGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgdXRpbCBmcm9tICdub2RlOnV0aWwnO1xuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcbmltcG9ydCAqIGFzIHV1aWQgZnJvbSAndXVpZCc7XG5jb25zdCB1dWlkdjEgPSB1dWlkLnYxO1xuaW1wb3J0ICogYXMgcmVuZGVyIGZyb20gJy4vcmVuZGVyLmpzJztcbmltcG9ydCB7IFBsdWdpbiB9IGZyb20gJy4vUGx1Z2luLmpzJztcbmltcG9ydCByZWxhdGl2ZSBmcm9tICdyZWxhdGl2ZSc7XG5pbXBvcnQgaGxqcyBmcm9tICdoaWdobGlnaHQuanMnO1xuaW1wb3J0IG1haGFiaHV0YSBmcm9tICdtYWhhYmh1dGEnO1xuaW1wb3J0IG1haGFNZXRhZGF0YSBmcm9tICdtYWhhYmh1dGEvbWFoYS9tZXRhZGF0YS5qcyc7XG5pbXBvcnQgbWFoYVBhcnRpYWwgZnJvbSAnbWFoYWJodXRhL21haGEvcGFydGlhbC5qcyc7XG5pbXBvcnQgUmVuZGVyZXJzIGZyb20gJ0Bha2FzaGFjbXMvcmVuZGVyZXJzJztcbmltcG9ydCB7ZW5jb2RlfSBmcm9tICdodG1sLWVudGl0aWVzJztcbmltcG9ydCB7IENvbmZpZ3VyYXRpb24sIEN1c3RvbUVsZW1lbnQsIE11bmdlciwgUGFnZVByb2Nlc3NvciwgamF2YVNjcmlwdEl0ZW0gfSBmcm9tICcuL2luZGV4LmpzJztcblxuY29uc3QgcGx1Z2luTmFtZSA9IFwiYWthc2hhY21zLWJ1aWx0aW5cIjtcblxuZXhwb3J0IGNsYXNzIEJ1aWx0SW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcihwbHVnaW5OYW1lKTtcbiAgICAgICAgdGhpcy4jcmVzaXplX3F1ZXVlID0gW107XG5cblx0fVxuXG4gICAgI2NvbmZpZztcbiAgICAjcmVzaXplX3F1ZXVlO1xuXG5cdGNvbmZpZ3VyZShjb25maWc6IENvbmZpZ3VyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICAvLyB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID8gb3B0aW9ucyA6IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUJvZHlMaW5rcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1vZHVsZURpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuICAgICAgICAvLyBOZWVkIHRoaXMgYXMgdGhlIHBsYWNlIHRvIHN0b3JlIE51bmp1Y2tzIG1hY3JvcyBhbmQgdGVtcGxhdGVzXG4gICAgICAgIGNvbmZpZy5hZGRMYXlvdXRzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAnbGF5b3V0cycpKTtcbiAgICAgICAgY29uZmlnLmFkZFBhcnRpYWxzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAncGFydGlhbHMnKSk7XG4gICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAvLyBpbiB0aGUgQ29uZmlndXJhdGlvbiBjb25zdHJ1Y3Rvci4gIFRoZSBpZGVhIGlzIHRvIHB1dFxuICAgICAgICAvLyBtYWhhUGFydGlhbCBhcyB0aGUgdmVyeSBmaXJzdCBNYWhhZnVuYyBzbyB0aGF0IGFsbFxuICAgICAgICAvLyBQYXJ0aWFsJ3MgYXJlIGhhbmRsZWQgYmVmb3JlIGFueXRoaW5nIGVsc2UuICBUaGUgaXNzdWUgY2F1c2luZ1xuICAgICAgICAvLyB0aGlzIGNoYW5nZSBpcyB0aGUgT3BlbkdyYXBoUHJvbW90ZUltYWdlcyBNYWhhZnVuYyBpblxuICAgICAgICAvLyBha2FzaGFjaHMtYmFzZSBhbmQgcHJvY2Vzc2luZyBhbnkgaW1hZ2VzIGJyb3VnaHQgaW4gYnkgcGFydGlhbHMuXG4gICAgICAgIC8vIEVuc3VyaW5nIHRoZSBwYXJ0aWFsIHRhZyBpcyBwcm9jZXNzZWQgYmVmb3JlIE9wZW5HcmFwaFByb21vdGVJbWFnZXNcbiAgICAgICAgLy8gbWVhbnQgc3VjaCBpbWFnZXMgd2VyZSBwcm9wZXJseSBwcm9tb3RlZC5cbiAgICAgICAgLy8gY29uZmlnLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgIC8vICAgICByZW5kZXJQYXJ0aWFsOiBvcHRpb25zLnJlbmRlclBhcnRpYWxcbiAgICAgICAgLy8gfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFNZXRhZGF0YS5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICAvLyBEbyBub3QgcGFzcyB0aGlzIHRocm91Z2ggc28gdGhhdCBNYWhhYmh1dGEgd2lsbCBub3RcbiAgICAgICAgICAgIC8vIG1ha2UgYWJzb2x1dGUgbGlua3MgdG8gc3ViZGlyZWN0b3JpZXNcbiAgICAgICAgICAgIC8vIHJvb3RfdXJsOiBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIC8vIFRPRE8gaG93IHRvIGNvbmZpZ3VyZSB0aGlzXG4gICAgICAgICAgICAvLyBzaXRlbWFwX3RpdGxlOiAuLi4uP1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYWJodXRhQXJyYXkob3B0aW9ucywgY29uZmlnLCB0aGlzLmFrYXNoYSwgdGhpcykpO1xuXG4gICAgICAgIGNvbnN0IG5qayA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlck5hbWUoJy5odG1sLm5qaycpIGFzIFJlbmRlcmVycy5OdW5qdWNrc1JlbmRlcmVyO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgIG5ldyBzdHlsZXNoZWV0c0V4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgIG5ldyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG4gICAgICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrZm9vdGVyanMnLFxuICAgICAgICAgICAgbmV3IGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgZXh0ZW5zaW9ucyB3ZXJlIGluc3RhbGxlZFxuICAgICAgICBmb3IgKGNvbnN0IGV4dCBvZiBbXG4gICAgICAgICAgICAgICAgICAgICdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FraGVhZGVyanMnLFxuICAgICAgICAgICAgICAgICAgICAnYWtmb290ZXJqcydcbiAgICAgICAgXSkge1xuICAgICAgICAgICAgaWYgKCFuamsubmprZW52KCkuaGFzRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbmZpZ3VyZSAtIE5KSyBkb2VzIG5vdCBoYXZlIGV4dGVuc2lvbiAtICR7ZXh0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyB0cnkge1xuICAgICAgICAvLyAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtuamt0ZXN0JywgbmV3IHRlc3RFeHRlbnNpb24oKSk7XG4gICAgICAgIC8vIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2soKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbignYWtuamt0ZXN0JykpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoYGFrbmprdGVzdCBleHRlbnNpb24gbm90IGFkZGVkP2ApO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCBleGlzdHNgKTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICAvLyBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cblxuICAgIGdldCByZXNpemVxdWV1ZSgpIHsgcmV0dXJuIHRoaXMuI3Jlc2l6ZV9xdWV1ZTsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxsaW5rPiB0YWdzIGluIHRoZSA8aGVhZD4gZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVIZWFkTGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxzY3JpcHQ+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVTY3JpcHRMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8QT4gdGFncyBmb3IgbG9jYWxcbiAgICAgKiBVUkxzIGFyZSByZWxhdGl2aXplZCBvciBhYnNvbHV0aXplZC5cbiAgICAgKi9cbiAgICBzZXQgcmVsYXRpdml6ZUJvZHlMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICB9XG5cbiAgICBkb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICB9XG5cbiAgICBkb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICB9XG5cbiAgICBhZGRJbWFnZVRvUmVzaXplKHNyYzogc3RyaW5nLCByZXNpemV3aWR0aDogbnVtYmVyLCByZXNpemV0bzogc3RyaW5nLCBkb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZEltYWdlVG9SZXNpemUgJHtzcmN9IHJlc2l6ZXdpZHRoICR7cmVzaXpld2lkdGh9IHJlc2l6ZXRvICR7cmVzaXpldG99YClcbiAgICAgICAgdGhpcy4jcmVzaXplX3F1ZXVlLnB1c2goeyBzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgZG9jUGF0aCB9KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIHNlY3Rpb24gd2FzIGFkZGVkIGluIHRoZSBwb3NzaWJpbGl0eSBvZlxuICAgIC8vIG1vdmluZyB0YWdnZWQtY29udGVudCBpbnRvIHRoZSBjb3JlLlxuICAgIC8vIEFmdGVyIHRyeWluZyB0aGlzLCB0aGF0IHNlZW1zIGxpa2UgYSBub24tc3RhcnRlclxuICAgIC8vIG9mIGEgcHJvamVjdCBpZGVhLlxuXG4gICAgLy8gI3BhdGhJbmRleGVzOiBzdHJpbmc7XG5cbiAgICAvLyBzZXQgcGF0aEluZGV4ZXMoaW5kZXhlcykgeyB0aGlzLiNwYXRoSW5kZXhlcyA9IGluZGV4ZXM7IH1cbiAgICAvLyBnZXQgcGF0aEluZGV4ZXMoKSAgICAgICAgeyByZXR1cm4gdGhpcy4jcGF0aEluZGV4ZXM7IH1cblxuICAgIC8vIHRhZ1BhZ2VVcmwoY29uZmlnLCB0YWdOYW1lKSB7XG4gICAgLy8gICAgIGlmICh0eXBlb2YgdGhpcy4jcGF0aEluZGV4ZXMgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmVycm9yKGBCdWlsdEluUGx1Z2luIHBhdGhJbmRleGVzIGhhcyBub3QgYmVlbiBzZXQgJHt1dGlsLmluc3BlY3QodGhpcy4jcGF0aEluZGV4ZXMpfWApO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGlmICh0aGlzLnBhdGhJbmRleGVzLmVuZHNXaXRoKCcvJykpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLnBhdGhJbmRleGVzICsgdGFnMmVuY29kZTR1cmwodGFnTmFtZSkgKycuaHRtbCc7XG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5wYXRoSW5kZXhlcyArJy8nKyB0YWcyZW5jb2RlNHVybCh0YWdOYW1lKSArJy5odG1sJztcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFzeW5jIGRvVGFnc0ZvckRvY3VtZW50KGNvbmZpZywgbWV0YWRhdGEsIHRlbXBsYXRlKSB7XG4gICAgLy8gICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyAgICAgY29uc3QgcGx1Z2luID0gdGhpcztcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkb1RhZ3NGb3JEb2N1bWVudCAnKyB1dGlsLmluc3BlY3QobWV0YWRhdGEpKTtcbiAgICAvLyAgICAgY29uc3QgdGFnbGlzdCA9IChcbiAgICAvLyAgICAgICAgICAgICAndGFncycgaW4gbWV0YWRhdGFcbiAgICAvLyAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShtZXRhZGF0YS50YWdzKVxuICAgIC8vICAgICAgICAgKSA/IG1ldGFkYXRhLnRhZ3MgOiBbXTtcbiAgICAvLyAgICAgaWYgKHRhZ2xpc3QpIHtcbiAgICAvLyAgICAgICAgIGNvbnN0IHRhZ3psaXN0ID0gW107XG4gICAgLy8gICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdsaXN0KSB7XG4gICAgLy8gICAgICAgICAgICAgdGFnemxpc3QucHVzaCh7XG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZyxcbiAgICAvLyAgICAgICAgICAgICAgICAgdGFnVXJsOiBwbHVnaW4udGFnUGFnZVVybChjb25maWcsIHRhZyksXG4gICAgLy8gICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhd2FpdCBkb2N1bWVudHMuZ2V0VGFnRGVzY3JpcHRpb24odGFnKVxuICAgIC8vICAgICAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coJ2RvVGFnc0ZvckRvY3VtZW50ICcrIHV0aWwuaW5zcGVjdCh0YWdsaXN0KSk7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChjb25maWcsIHRlbXBsYXRlLCB7XG4gICAgLy8gICAgICAgICAgICAgdGFnejogdGFnemxpc3RcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9IGVsc2UgcmV0dXJuIFwiXCI7XG4gICAgLy8gfVxuXG4gICAgYXN5bmMgb25TaXRlUmVuZGVyZWQoY29uZmlnKSB7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIHdoaWxlIChBcnJheS5pc0FycmF5KHRoaXMuI3Jlc2l6ZV9xdWV1ZSlcbiAgICAgICAgICAgICYmIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5sZW5ndGggPiAwKSB7XG5cbiAgICAgICAgICAgIGxldCB0b3Jlc2l6ZSA9IHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wb3AoKTtcblxuICAgICAgICAgICAgbGV0IGltZzJyZXNpemU7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZSh0b3Jlc2l6ZS5zcmMpKSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICB0b3Jlc2l6ZS5zcmNcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHRvcmVzaXplLnNyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNyY2ZpbGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGFzc2V0cy5maW5kKGltZzJyZXNpemUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kLmZzcGF0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgICAgICBzcmNmaWxlID0gZm91bmQgPyBmb3VuZC5mc3BhdGggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNyY2ZpbGUpIHRocm93IG5ldyBFcnJvcihgYWthc2hhY21zLWJ1aWx0aW46IERpZCBub3QgZmluZCBzb3VyY2UgZmlsZSBmb3IgaW1hZ2UgdG8gcmVzaXplICR7aW1nMnJlc2l6ZX1gKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgaW1nID0gYXdhaXQgc2hhcnAoc3JjZmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWQgPSBhd2FpdCBpbWcucmVzaXplKE51bWJlci5wYXJzZUludCh0b3Jlc2l6ZS5yZXNpemV3aWR0aCkpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgY29ycmVjdCBkZXN0aW5hdGlvbiBwYXRoXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSByZXNpemVkIGltYWdlXG4gICAgICAgICAgICAgICAgbGV0IGltZ3RvcmVzaXplID0gdG9yZXNpemUucmVzaXpldG8gPyB0b3Jlc2l6ZS5yZXNpemV0byA6IGltZzJyZXNpemU7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWRlc3Q7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShpbWd0b3Jlc2l6ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGZvciByZWxhdGl2ZSBpbWFnZSBwYXRocywgaGVuY2UgaXQgbmVlZHMgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGRvY1BhdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyRGVzdGluYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlc2l6ZWRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXNpemVkLnRvRmlsZShyZXNpemVkZXN0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJ1aWx0LWluOiBJbWFnZSByZXNpemUgZmFpbGVkIGZvciAke3NyY2ZpbGV9ICh0b3Jlc2l6ZSAke3V0aWwuaW5zcGVjdCh0b3Jlc2l6ZSl9IGZvdW5kICR7dXRpbC5pbnNwZWN0KGZvdW5kKX0pIGJlY2F1c2UgJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBtYWhhYmh1dGFBcnJheSA9IGZ1bmN0aW9uKFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGNvbmZpZz86IENvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBha2FzaGE/OiBhbnksXG4gICAgICAgICAgICBwbHVnaW4/OiBQbHVnaW5cbikge1xuICAgIGxldCByZXQgPSBuZXcgbWFoYWJodXRhLk1haGFmdW5jQXJyYXkocGx1Z2luTmFtZSwgb3B0aW9ucyk7XG4gICAgLy8gcmV0LmFkZE1haGFmdW5jKG5ldyBUYWdzRm9yRG9jdW1lbnRFbGVtZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFN0eWxlc2hlZXRzRWxlbWVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBIZWFkZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZvb3RlckphdmFTY3JpcHQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZExpbmtSZWxhdGl2aXplcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTY3JpcHRSZWxhdGl2aXplcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBJbnNlcnRUZWFzZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQ29kZUVtYmVkKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEFrQm9keUNsYXNzQWRkKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZpZ3VyZUltYWdlKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IGltZzJmaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBJbWFnZVJld3JpdGVyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNob3dDb250ZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNlbGVjdEVsZW1lbnRzKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEFuY2hvckNsZWFudXAoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuXG4gICAgcmV0LmFkZEZpbmFsTWFoYWZ1bmMobmV3IE11bmdlZEF0dHJSZW1vdmVyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldHVybiByZXQ7XG59O1xuXG4vLyBjbGFzcyBUYWdzRm9yRG9jdW1lbnRFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4vLyAgICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay10YWdzLWZvci1kb2N1bWVudFwiOyB9XG4vLyAgICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5LCBkb25lKSB7XG4vLyAgICAgICAgIGNvbnN0IHBsdWdpbiA9IHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKTtcbi8vICAgICAgICAgcmV0dXJuIGF3YWl0IHBsdWdpbi5kb1RhZ3NGb3JEb2N1bWVudCh0aGlzLmNvbmZpZyxcbi8vICAgICAgICAgICAgICAgICBtZXRhZGF0YSwgXCJha19kb2N1bWVudF90YWdzLmh0bWwubmprXCIpO1xuLy8gICAgIH1cbi8vIH1cblxuZnVuY3Rpb24gX2RvU3R5bGVzaGVldHMobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3V0aWwuaW5zcGVjdChtZXRhZGF0YSl9YCk7XG5cbiAgICB2YXIgc2NyaXB0cztcbiAgICBpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cy5jb25jYXQobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgYWstc3R5bGVzaGVldHMgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCl9ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX0gJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvU3R5bGVzaGVldHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIGNvbmZpZycpO1xuXG4gICAgdmFyIHJldCA9ICcnO1xuICAgIGlmICh0eXBlb2Ygc2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yICh2YXIgc3R5bGUgb2Ygc2NyaXB0cykge1xuXG4gICAgICAgICAgICBsZXQgc3R5bGVocmVmID0gc3R5bGUuaHJlZjtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoc3R5bGUuaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHByb2Nlc3MgJHtzdHlsZWhyZWZ9YCk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGJpdCB3aXRoICdodHRwOi8vZXhhbXBsZS5jb20nIG1lYW5zIHRoZXJlXG4gICAgICAgICAgICAgICAgLy8gd29uJ3QgYmUgYW4gZXhjZXB0aW9uIHRocm93biBmb3IgYSBsb2NhbCBVUkwuXG4gICAgICAgICAgICAgICAgLy8gQnV0LCBpbiBzdWNoIGEgY2FzZSwgdUhyZWYucGF0aG5hbWUgd291bGRcbiAgICAgICAgICAgICAgICAvLyBzdGFydCB3aXRoIGEgc2xhc2guICBUaGVyZWZvcmUsIHRvIGNvcnJlY3RseVxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiB0aGlzIFVSTCBpcyBhYnNvbHV0ZSB3ZSBtdXN0IGNoZWNrXG4gICAgICAgICAgICAgICAgLy8gd2l0aCB0aGUgb3JpZ2luYWwgVVJMIHN0cmluZywgd2hpY2ggaXMgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgc3R5bGVocmVmIHZhcmlhYmxlLlxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHN0eWxlaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlRgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVCBSRU5ERVJUT2ApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHJlbGF0aXZlKC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfSwgJHtzdHlsZWhyZWZ9KSA9ICR7cmVsYXRpdmUoJy8nK21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvLCBzdHlsZWhyZWYpfWApXG4gICAgICAgICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3R5bGVocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIGFic29sdXRlIHN0eWxlaHJlZiAke3N0eWxlaHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRvU3R5bGVNZWRpYSA9IChtZWRpYSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtZWRpYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYG1lZGlhPVwiJHtlbmNvZGUobWVkaWEpfVwiYFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IGh0ID0gYDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiJHtlbmNvZGUoc3R5bGVocmVmKX1cIiAke2RvU3R5bGVNZWRpYShzdHlsZS5tZWRpYSl9Lz5gXG4gICAgICAgICAgICByZXQgKz0gaHQ7XG5cbiAgICAgICAgICAgIC8vIFRoZSBpc3N1ZSB3aXRoIHRoaXMgYW5kIG90aGVyIGluc3RhbmNlc1xuICAgICAgICAgICAgLy8gaXMgdGhhdCB0aGlzIHRlbmRlZCB0byByZXN1bHQgaW5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgIDxodG1sPjxib2R5PjxsaW5rLi4+PC9ib2R5PjwvaHRtbD5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXaGVuIGl0IG5lZWRlZCB0byBqdXN0IGJlIHRoZSA8bGluaz4gdGFnLlxuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIGl0IHRyaWVkIHRvIGNyZWF0ZSBhbiBlbnRpcmVcbiAgICAgICAgICAgIC8vIEhUTUwgZG9jdW1lbnQuICBXaGlsZSB0aGVyZSB3YXMgYSB3YXkgYXJvdW5kXG4gICAgICAgICAgICAvLyB0aGlzIC0gJCgnc2VsZWN0b3InKS5wcm9wKCdvdXRlckhUTUwnKVxuICAgICAgICAgICAgLy8gVGhpcyBhbHNvIHNlZW1lZCB0byBiZSBhbiBvdmVyaGVhZFxuICAgICAgICAgICAgLy8gd2UgY2FuIGF2b2lkLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoZSBwYXR0ZXJuIGlzIHRvIHVzZSBUZW1wbGF0ZSBTdHJpbmdzIHdoaWxlXG4gICAgICAgICAgICAvLyBiZWluZyBjYXJlZnVsIHRvIGVuY29kZSB2YWx1ZXMgc2FmZWx5IGZvciB1c2VcbiAgICAgICAgICAgIC8vIGluIGFuIGF0dHJpYnV0ZS4gIFRoZSBcImVuY29kZVwiIGZ1bmN0aW9uIGRvZXNcbiAgICAgICAgICAgIC8vIHRoZSBlbmNvZGluZy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzQ5XG5cbiAgICAgICAgICAgIC8vIGxldCAkID0gbWFoYWJodXRhLnBhcnNlKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIlwiLz4nKTtcbiAgICAgICAgICAgIC8vICQoJ2xpbmsnKS5hdHRyKCdocmVmJywgc3R5bGVocmVmKTtcbiAgICAgICAgICAgIC8vIGlmIChzdHlsZS5tZWRpYSkge1xuICAgICAgICAgICAgLy8gICAgICQoJ2xpbmsnKS5hdHRyKCdtZWRpYScsIHN0eWxlLm1lZGlhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIHJldCArPSAkLmh0bWwoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHtyZXR9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0phdmFTY3JpcHRzKFxuICAgIG1ldGFkYXRhLFxuICAgIHNjcmlwdHM6IGphdmFTY3JpcHRJdGVtW10sXG4gICAgb3B0aW9ucyxcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb25cbikge1xuXHR2YXIgcmV0ID0gJyc7XG5cdGlmICghc2NyaXB0cykgcmV0dXJuIHJldDtcblxuICAgIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdfZG9KYXZhU2NyaXB0cyBubyBvcHRpb25zJyk7XG4gICAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gY29uZmlnJyk7XG5cbiAgICBmb3IgKHZhciBzY3JpcHQgb2Ygc2NyaXB0cykge1xuXHRcdGlmICghc2NyaXB0LmhyZWYgJiYgIXNjcmlwdC5zY3JpcHQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTXVzdCBzcGVjaWZ5IGVpdGhlciBocmVmIG9yIHNjcmlwdCBpbiAke3V0aWwuaW5zcGVjdChzY3JpcHQpfWApO1xuXHRcdH1cbiAgICAgICAgaWYgKCFzY3JpcHQuc2NyaXB0KSBzY3JpcHQuc2NyaXB0ID0gJyc7XG5cbiAgICAgICAgY29uc3QgZG9UeXBlID0gKGxhbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGB0eXBlPVwiJHtlbmNvZGUobGFuZyl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9IcmVmID0gKGhyZWYpID0+IHtcbiAgICAgICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjcmlwdGhyZWYgPSBocmVmO1xuICAgICAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzXG4gICAgICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzY3JpcHRocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc2NyaXB0aHJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvSmF2YVNjcmlwdHMgYWJzb2x1dGUgc2NyaXB0aHJlZiAke3NjcmlwdGhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYHNyYz1cIiR7ZW5jb2RlKHNjcmlwdGhyZWYpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgaHQgPSBgPHNjcmlwdCAke2RvVHlwZShzY3JpcHQubGFuZyl9ICR7ZG9IcmVmKHNjcmlwdC5ocmVmKX0+JHtzY3JpcHQuc2NyaXB0fTwvc2NyaXB0PmA7XG4gICAgICAgIHJldCArPSBodDtcbiAgICB9XG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AuY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3ApO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AgOiB1bmRlZmluZWQ7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coYF9kb0hlYWRlckphdmFTY3JpcHQgJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX1gKTtcblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zLCBjb25maWcpO1xufVxuXG5mdW5jdGlvbiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tIDogdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuY2xhc3MgU3R5bGVzaGVldHNFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstc3R5bGVzaGVldHNcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pIHtcblx0XHRsZXQgcmV0ID0gIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFN0eWxlc2hlZXRzRWxlbWVudCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEhlYWRlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1oZWFkZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9IF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgSGVhZGVySmF2YVNjcmlwdCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEZvb3RlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1mb290ZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuXHR9XG59XG5cbmNsYXNzIEhlYWRMaW5rUmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cbiAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYW4gYWJzb2x1dGUgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgU2NyaXB0UmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignc3JjJyk7XG5cbiAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgbGlua1xuICAgICAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgSW5zZXJ0VGVhc2VyIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGVhc2VyXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWtfdGVhc2VyLmh0bWwubmprXCIsIHtcblx0XHRcdHRlYXNlcjogdHlwZW9mIG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdICE9PSBcInVuZGVmaW5lZFwiXG5cdFx0XHRcdD8gbWV0YWRhdGFbXCJhay10ZWFzZXJcIl0gOiBtZXRhZGF0YS50ZWFzZXJcblx0XHR9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW5zZXJ0VGVhc2VyIGNhdWdodCBlcnJvciBgLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cblx0fVxufVxuXG5jbGFzcyBBa0JvZHlDbGFzc0FkZCBleHRlbmRzIFBhZ2VQcm9jZXNzb3Ige1xuXHRhc3luYyBwcm9jZXNzKCQsIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0aWYgKHR5cGVvZiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPT0gJ3VuZGVmaW5lZCdcblx0XHQgJiYgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT0gJydcblx0XHQgJiYgJCgnaHRtbCBib2R5JykuZ2V0KDApKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRpZiAoISQoJ2h0bWwgYm9keScpLmhhc0NsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKSkge1xuXHRcdFx0XHRcdCQoJ2h0bWwgYm9keScpLmFkZENsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKHVuZGVmaW5lZCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2UgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnJyk7XG5cdH1cbn1cblxuY2xhc3MgQ29kZUVtYmVkIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjb2RlLWVtYmVkXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICRlbGVtZW50LmF0dHIoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgICAgIGlmICghZm4gfHwgZm4gPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgbXVzdCBoYXZlIGZpbGUtbmFtZSBhcmd1bWVudCwgZ290ICR7Zm59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHh0cGF0aDtcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmbikpIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBmbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHR4dHBhdGgpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgZmlsZS1uYW1lICR7Zm59IGRvZXMgbm90IHJlZmVyIHRvIHVzYWJsZSBmaWxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIGNvbnN0IGRvTGFuZyA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgY2xhc3M9XCJobGpzICR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdjbGFzcz1cImhsanNcIic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGRvSUQgPSAoaWQpID0+IHtcbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaWQ9XCIke2VuY29kZShpZCl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9Db2RlID0gKGxhbmcsIGNvZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQoY29kZSwge1xuICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAgICAgICAgIH0pLnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHRBdXRvKGNvZGUpLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCByZXQgPSBgPHByZSAke2RvSUQoaWQpfT48Y29kZSAke2RvTGFuZyhsYW5nKX0+JHtkb0NvZGUobGFuZywgdHh0KX08L2NvZGU+PC9wcmU+YDtcbiAgICAgICAgcmV0dXJuIHJldDtcblxuICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZShgPHByZT48Y29kZT48L2NvZGU+PC9wcmU+YCk7XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYWRkQ2xhc3MobGFuZyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gJCgnY29kZScpLmFkZENsYXNzKCdobGpzJyk7XG4gICAgICAgIC8vIGlmIChpZCAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgLy8gICAgICQoJ3ByZScpLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0KHR4dCwge1xuICAgICAgICAvLyAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgIC8vICAgICB9KS52YWx1ZSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0QXV0byh0eHQpLnZhbHVlKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyByZXR1cm4gJC5odG1sKCk7XG4gICAgfVxufVxuXG5jbGFzcyBGaWd1cmVJbWFnZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiZmlnLWltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX2ZpZ2ltZy5odG1sLm5qayc7XG4gICAgICAgIGNvbnN0IGhyZWYgICAgPSAkZWxlbWVudC5hdHRyKCdocmVmJyk7XG4gICAgICAgIGlmICghaHJlZikgdGhyb3cgbmV3IEVycm9yKCdmaWctaW1nIG11c3QgcmVjZWl2ZSBhbiBocmVmJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3RcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBpbWcyZmlndXJlSW1hZ2UgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGltZ1tmaWd1cmVdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKSBcbiAgICAgICAgICAgICAgICA/ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJylcbiAgICAgICAgICAgICAgICA6ICBcImFrX2ZpZ2ltZy5odG1sLm5qa1wiO1xuICAgICAgICBjb25zdCBpZCA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCB3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHNyYyA9ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCdjYXB0aW9uJylcbiAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaWQsIGNsYXp6LCBzdHlsZSwgd2lkdGgsIGhyZWY6IHNyYywgZGVzdCwgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLFxuICAgICAgICAgICAgY2FwdGlvbjogY29udGVudFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIEltYWdlUmV3cml0ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgaW1nXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuXG4gICAgICAgIC8vIFdlIG9ubHkgZG8gcmV3cml0ZXMgZm9yIGxvY2FsIGltYWdlc1xuICAgICAgICBsZXQgc3JjID0gJGxpbmsuYXR0cignc3JjJyk7XG4gICAgICAgIC8vIEZvciBsb2NhbCBVUkxzLCB0aGlzIG5ldyBVUkwgY2FsbCB3aWxsXG4gICAgICAgIC8vIG1ha2UgdVNyYy5vcmlnaW4gPT09IGh0dHA6Ly9leGFtcGxlLmNvbVxuICAgICAgICAvLyBIZW5jZSwgaWYgc29tZSBvdGhlciBkb21haW4gYXBwZWFyc1xuICAgICAgICAvLyB0aGVuIHdlIGtvbncgaXQncyBub3QgYSBsb2NhbCBpbWFnZS5cbiAgICAgICAgY29uc3QgdVNyYyA9IG5ldyBVUkwoc3JjLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1U3JjLm9yaWdpbiAhPT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFyZSB3ZSBhc2tlZCB0byByZXNpemUgdGhlIGltYWdlP1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJlc2l6ZXdpZHRoKSB7XG4gICAgICAgICAgICAvLyBBZGQgdG8gYSBxdWV1ZSB0aGF0IGlzIHJ1biBhdCB0aGUgZW5kIFxuICAgICAgICAgICAgdGhpcy5jb25maWcucGx1Z2luKHBsdWdpbk5hbWUpXG4gICAgICAgICAgICAgICAgLmFkZEltYWdlVG9SZXNpemUoc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKTtcblxuICAgICAgICAgICAgaWYgKHJlc2l6ZXRvKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgcmVzaXpldG8pO1xuICAgICAgICAgICAgICAgIHNyYyA9IHJlc2l6ZXRvO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGVzZSBhcmUgbm8gbG9uZ2VyIG5lZWRlZFxuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBpZGVhIGhlcmUgaXMgZm9yIGV2ZXJ5IGxvY2FsIGltYWdlIHNyYyB0byBiZSBhIHJlbGF0aXZlIFVSTFxuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKHNyYykpIHtcbiAgICAgICAgICAgIGxldCBuZXdTcmMgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3JjKTtcbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld1NyYyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgSW1hZ2VSZXdyaXRlciBhYnNvbHV0ZSBpbWFnZSBwYXRoICR7c3JjfSByZXdyb3RlIHRvICR7bmV3U3JjfWApO1xuICAgICAgICAgICAgc3JjID0gbmV3U3JjO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICB9XG59XG5cbmNsYXNzIFNob3dDb250ZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGxldCBkb2MycmVhZDtcbiAgICAgICAgaWYgKCEgaHJlZi5zdGFydHNXaXRoKCcvJykpIHtcbiAgICAgICAgICAgIGxldCBkaXIgPSBwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucGF0aCk7XG4gICAgICAgICAgICBkb2MycmVhZCA9IHBhdGguam9pbignLycsIGRpciwgaHJlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkb2MycmVhZCA9IGhyZWY7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gJHtkb2MycmVhZH1gKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBkb2MgPSBhd2FpdCBkb2N1bWVudHMuZmluZChkb2MycmVhZCk7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdCwgY29udGVudEltYWdlLFxuICAgICAgICAgICAgZG9jdW1lbnQ6IGRvY1xuICAgICAgICB9O1xuICAgICAgICBsZXQgcmV0ID0gYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIGRhdGEpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2hvd0NvbnRlbnQgJHtocmVmfSAke3V0aWwuaW5zcGVjdChkYXRhKX0gPT0+ICR7cmV0fWApO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgIH1cbn1cblxuLypcblxuVGhpcyB3YXMgbW92ZWQgaW50byBNYWhhYmh1dGFcblxuIGNsYXNzIFBhcnRpYWwgZXh0ZW5kcyBtYWhhYmh1dGEuQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwicGFydGlhbFwiOyB9XG5cdHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdC8vIFdlIGRlZmF1bHQgdG8gbWFraW5nIHBhcnRpYWwgc2V0IHRoZSBkaXJ0eSBmbGFnLiAgQnV0IGEgdXNlclxuXHRcdC8vIG9mIHRoZSBwYXJ0aWFsIHRhZyBjYW4gY2hvb3NlIHRvIHRlbGwgdXMgaXQgaXNuJ3QgZGlydHkuXG5cdFx0Ly8gRm9yIGV4YW1wbGUsIGlmIHRoZSBwYXJ0aWFsIG9ubHkgc3Vic3RpdHV0ZXMgbm9ybWFsIHRhZ3Ncblx0XHQvLyB0aGVyZSdzIG5vIG5lZWQgdG8gZG8gdGhlIGRpcnR5IHRoaW5nLlxuXHRcdHZhciBkb3RoZWRpcnR5dGhpbmcgPSAkZWxlbWVudC5hdHRyKCdkaXJ0eScpO1xuXHRcdGlmICghZG90aGVkaXJ0eXRoaW5nIHx8IGRvdGhlZGlydHl0aGluZy5tYXRjaCgvdHJ1ZS9pKSkge1xuXHRcdFx0ZGlydHkoKTtcblx0XHR9XG5cdFx0dmFyIGZuYW1lID0gJGVsZW1lbnQuYXR0cihcImZpbGUtbmFtZVwiKTtcblx0XHR2YXIgdHh0ICAgPSAkZWxlbWVudC5odG1sKCk7XG5cdFx0dmFyIGQgPSB7fTtcblx0XHRmb3IgKHZhciBtcHJvcCBpbiBtZXRhZGF0YSkgeyBkW21wcm9wXSA9IG1ldGFkYXRhW21wcm9wXTsgfVxuXHRcdHZhciBkYXRhID0gJGVsZW1lbnQuZGF0YSgpO1xuXHRcdGZvciAodmFyIGRwcm9wIGluIGRhdGEpIHsgZFtkcHJvcF0gPSBkYXRhW2Rwcm9wXTsgfVxuXHRcdGRbXCJwYXJ0aWFsQm9keVwiXSA9IHR4dDtcblx0XHRsb2coJ3BhcnRpYWwgdGFnIGZuYW1lPScrIGZuYW1lICsnIGF0dHJzICcrIHV0aWwuaW5zcGVjdChkYXRhKSk7XG5cdFx0cmV0dXJuIHJlbmRlci5wYXJ0aWFsKHRoaXMuY29uZmlnLCBmbmFtZSwgZClcblx0XHQudGhlbihodG1sID0+IHsgcmV0dXJuIGh0bWw7IH0pXG5cdFx0LmNhdGNoKGVyciA9PiB7XG5cdFx0XHRlcnJvcihuZXcgRXJyb3IoXCJGQUlMIHBhcnRpYWwgZmlsZS1uYW1lPVwiKyBmbmFtZSArXCIgYmVjYXVzZSBcIisgZXJyKSk7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJGQUlMIHBhcnRpYWwgZmlsZS1uYW1lPVwiKyBmbmFtZSArXCIgYmVjYXVzZSBcIisgZXJyKTtcblx0XHR9KTtcblx0fVxufVxubW9kdWxlLmV4cG9ydHMubWFoYWJodXRhLmFkZE1haGFmdW5jKG5ldyBQYXJ0aWFsKCkpOyAqL1xuXG4vL1xuLy8gPHNlbGVjdC1lbGVtZW50cyBjbGFzcz1cIi4uXCIgaWQ9XCIuLlwiIGNvdW50PVwiTlwiPlxuLy8gICAgIDxlbGVtZW50PjwvZWxlbWVudD5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyA8L3NlbGVjdC1lbGVtZW50cz5cbi8vXG5jbGFzcyBTZWxlY3RFbGVtZW50cyBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwic2VsZWN0LWVsZW1lbnRzXCI7IH1cblxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGxldCBjb3VudCA9ICRsaW5rLmF0dHIoJ2NvdW50JylcbiAgICAgICAgICAgICAgICAgICAgPyBOdW1iZXIucGFyc2VJbnQoJGxpbmsuYXR0cignY291bnQnKSlcbiAgICAgICAgICAgICAgICAgICAgOiAxO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRsaW5rLmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgID0gJGxpbmsuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgdG4gICAgPSAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgID8gJGxpbmsuYXR0cigndGFnLW5hbWUnKVxuICAgICAgICAgICAgICAgICAgICA6ICdkaXYnO1xuXG4gICAgICAgIGNvbnN0IGNoaWxkcmVuID0gJGxpbmsuY2hpbGRyZW4oKTtcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSBbXTtcblxuICAgICAgICBmb3IgKDsgY291bnQgPj0gMSAmJiBjaGlsZHJlbi5sZW5ndGggPj0gMTsgY291bnQtLSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFNlbGVjdEVsZW1lbnRzIGAsIGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCBfbiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoaWxkcmVuLmxlbmd0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhfbik7XG4gICAgICAgICAgICBjb25zdCBjaG9zZW4gPSAkKGNoaWxkcmVuW19uXSkuaHRtbCgpO1xuICAgICAgICAgICAgc2VsZWN0ZWQucHVzaChjaG9zZW4pO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYFNlbGVjdEVsZW1lbnRzIGAsIGNob3Nlbik7XG4gICAgICAgICAgICBkZWxldGUgY2hpbGRyZW5bX25dO1xuXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBfdXVpZCA9IHV1aWR2MSgpO1xuICAgICAgICAkbGluay5yZXBsYWNlV2l0aChgPCR7dG59IGlkPScke191dWlkfSc+PC8ke3RufT5gKTtcbiAgICAgICAgY29uc3QgJG5ld0l0ZW0gPSAkKGAke3RufSMke191dWlkfWApO1xuICAgICAgICBpZiAoaWQpICRuZXdJdGVtLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICBlbHNlICRuZXdJdGVtLnJlbW92ZUF0dHIoJ2lkJyk7XG4gICAgICAgIGlmIChjbGF6eikgJG5ld0l0ZW0uYWRkQ2xhc3MoY2xhenopO1xuICAgICAgICBmb3IgKGxldCBjaG9zZW4gb2Ygc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICRuZXdJdGVtLmFwcGVuZChjaG9zZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuY2xhc3MgQW5jaG9yQ2xlYW51cCBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgYVttdW5nZWQhPSd5ZXMnXVwiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIGhyZWYgICAgID0gJGxpbmsuYXR0cignaHJlZicpO1xuICAgICAgICB2YXIgbGlua3RleHQgPSAkbGluay50ZXh0KCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke2hyZWZ9ICR7bGlua3RleHR9YCk7XG4gICAgICAgIGlmIChocmVmICYmIGhyZWYgIT09ICcjJykge1xuICAgICAgICAgICAgY29uc3QgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gIT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgaWYgKCF1SHJlZi5wYXRobmFtZSkgcmV0dXJuIFwib2tcIjtcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgbG9jYWwgJHtocmVmfSAke2xpbmt0ZXh0fSB1SHJlZiAke3VIcmVmLnBhdGhuYW1lfWApO1xuXG4gICAgICAgICAgICAvKiBpZiAobWV0YWRhdGEuZG9jdW1lbnQucGF0aCA9PT0gJ2luZGV4Lmh0bWwubWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgbWV0YWRhdGEuZG9jdW1lbnQucGF0aCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGhyZWYgJHtocmVmfSB1SHJlZi5wYXRobmFtZSAke3VIcmVmLnBhdGhuYW1lfSB0aGlzLmNvbmZpZy5yb290X3VybCAke3RoaXMuY29uZmlnLnJvb3RfdXJsfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCQuaHRtbCgpKTtcbiAgICAgICAgICAgIH0gKi9cblxuICAgICAgICAgICAgLy8gbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgICAgIC8vIFdlIGhhdmUgZGV0ZXJtaW5lZCB0aGlzIGlzIGEgbG9jYWwgaHJlZi5cbiAgICAgICAgICAgIC8vIEZvciByZWZlcmVuY2Ugd2UgbmVlZCB0aGUgYWJzb2x1dGUgcGF0aG5hbWUgb2YgdGhlIGhyZWYgd2l0aGluXG4gICAgICAgICAgICAvLyB0aGUgcHJvamVjdC4gIEZvciBleGFtcGxlIHRvIHJldHJpZXZlIHRoZSB0aXRsZSB3aGVuIHdlJ3JlIGZpbGxpbmdcbiAgICAgICAgICAgIC8vIGluIGZvciBhbiBlbXB0eSA8YT4gd2UgbmVlZCB0aGUgYWJzb2x1dGUgcGF0aG5hbWUuXG5cbiAgICAgICAgICAgIC8vIE1hcmsgdGhpcyBsaW5rIGFzIGhhdmluZyBiZWVuIHByb2Nlc3NlZC5cbiAgICAgICAgICAgIC8vIFRoZSBwdXJwb3NlIGlzIGlmIE1haGFiaHV0YSBydW5zIG11bHRpcGxlIHBhc3NlcyxcbiAgICAgICAgICAgIC8vIHRvIG5vdCBwcm9jZXNzIHRoZSBsaW5rIG11bHRpcGxlIHRpbWVzLlxuICAgICAgICAgICAgLy8gQmVmb3JlIGFkZGluZyB0aGlzIC0gd2Ugc2F3IHRoaXMgTXVuZ2VyIHRha2UgYXMgbXVjaFxuICAgICAgICAgICAgLy8gYXMgODAwbXMgdG8gZXhlY3V0ZSwgZm9yIEVWRVJZIHBhc3MgbWFkZSBieSBNYWhhYmh1dGEuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQWRkaW5nIHRoaXMgYXR0cmlidXRlLCBhbmQgY2hlY2tpbmcgZm9yIGl0IGluIHRoZSBzZWxlY3RvcixcbiAgICAgICAgICAgIC8vIG1lYW5zIHdlIG9ubHkgcHJvY2VzcyB0aGUgbGluayBvbmNlLlxuICAgICAgICAgICAgJGxpbmsuYXR0cignbXVuZ2VkJywgJ3llcycpO1xuXG4gICAgICAgICAgICBsZXQgYWJzb2x1dGVQYXRoO1xuXG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucGF0aCksIGhyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGhyZWYgJHtocmVmfSB1SHJlZi5wYXRobmFtZSAke3VIcmVmLnBhdGhuYW1lfSBub3QgYWJzb2x1dGUsIGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYWJzb2x1dGVQYXRoID0gaHJlZjtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBocmVmICR7aHJlZn0gdUhyZWYucGF0aG5hbWUgJHt1SHJlZi5wYXRobmFtZX0gYWJzb2x1dGUsIGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIGlkZWEgZm9yIHRoaXMgc2VjdGlvbiBpcyB0byBlbnN1cmUgYWxsIGxvY2FsIGhyZWYncyBhcmUgXG4gICAgICAgICAgICAvLyBmb3IgYSByZWxhdGl2ZSBwYXRoIHJhdGhlciB0aGFuIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIEhlbmNlIHdlIHVzZSB0aGUgcmVsYXRpdmUgbW9kdWxlIHRvIGNvbXB1dGUgdGhlIHJlbGF0aXZlIHBhdGhcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBFeGFtcGxlOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAvaW5kZXguaHRtbCBpbiB7XG4gICAgICAgICAgICAvLyAgYmFzZWRpcjogJy9Wb2x1bWVzL0V4dHJhL2FrYXNoYXJlbmRlci9ha2FzaGFyZW5kZXIvdGVzdC9kb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gIHJlbHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbHJlbmRlcjogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbCcsXG4gICAgICAgICAgICAvLyAgcGF0aDogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbC5tZCcsXG4gICAgICAgICAgICAvLyAgcmVuZGVyVG86ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnXG4gICAgICAgICAgICAvLyB9IHRvIC4uLy4uLy4uL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3NcbiAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29rIHRvIHNlZSBpZiBpdCdzIGFuIGFzc2V0IGZpbGVcbiAgICAgICAgICAgIGxldCBmb3VuZEFzc2V0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gYXdhaXQgYXNzZXRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvdW5kQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBhc3NldCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZEFzc2V0ICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBBc2sgcGx1Z2lucyBpZiB0aGUgaHJlZiBpcyBva2F5XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcuYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmKGFic29sdXRlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBsZWdpdCBsb2NhbCBocmVmICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgbGluayBoYXMgYSBib2R5LCB0aGVuIGRvbid0IG1vZGlmeSBpdFxuICAgICAgICAgICAgaWYgKChsaW5rdGV4dCAmJiBsaW5rdGV4dC5sZW5ndGggPiAwICYmIGxpbmt0ZXh0ICE9PSBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgfHwgKCRsaW5rLmNoaWxkcmVuKCkubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBza2lwcGluZyAke2Fic29sdXRlUGF0aH0gdy8gJHt1dGlsLmluc3BlY3QobGlua3RleHQpfSBjaGlsZHJlbj0gJHskbGluay5jaGlsZHJlbigpfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvZXMgaXQgZXhpc3QgaW4gZG9jdW1lbnRzIGRpcj9cbiAgICAgICAgICAgIGlmIChhYnNvbHV0ZVBhdGggPT09ICcvJykge1xuICAgICAgICAgICAgICAgIGFic29sdXRlUGF0aCA9ICcvaW5kZXguaHRtbCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChhYnNvbHV0ZVBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluZFJlbmRlcnNUbyAke2Fic29sdXRlUGF0aH0gJHt1dGlsLmluc3BlY3QoZm91bmQpfWApO1xuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJzVG8gJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBkaXJlY3RvcnksIHRoZXJlIG1pZ2h0IGJlIC9wYXRoL3RvL2luZGV4Lmh0bWwgc28gd2UgdHJ5IGZvciB0aGF0LlxuICAgICAgICAgICAgLy8gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoIHdvdWxkIGZhaWwgb24ganVzdCAvcGF0aC90byBidXQgc3VjY2VlZFxuICAgICAgICAgICAgLy8gb24gL3BhdGgvdG8vaW5kZXguaHRtbFxuICAgICAgICAgICAgaWYgKGZvdW5kLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBcImluZGV4Lmh0bWxcIikpO1xuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgaW50byBmaWxsaW5nIGVtcHRpbmVzcyB3aXRoIHRpdGxlXG5cbiAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIGlmICghJGxpbmsuYXR0cigndGl0bGUnKSAmJiBkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGNoYW5nZWQgbGluayB0ZXh0ICR7aHJlZn0gdG8gJHtkb2NtZXRhLnRpdGxlfWApO1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGNoYW5nZWQgbGluayB0ZXh0ICR7aHJlZn0gdG8gJHtocmVmfWApO1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoaHJlZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyZXJQYXRoICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRvY21ldGEgPSBmb3VuZC5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvKiB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jbWV0YSA9IGF3YWl0IHJlbmRlcmVyLm1ldGFkYXRhKGZvdW5kLmZvdW5kRGlyLCBmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJldHJpZXZlIGRvY3VtZW50IG1ldGFkYXRhIGZvciAke2ZvdW5kLmZvdW5kRGlyfSAke2ZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcn0gYmVjYXVzZSAke2Vycn1gKTtcbiAgICAgICAgICAgICAgICB9ICotLS9cbiAgICAgICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RpdGxlJywgZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsudGV4dChkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluaXNoZWRgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gRE9ORSAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBib3RoZXIgdGhyb3dpbmcgYW4gZXJyb3IuICBKdXN0IGZpbGwgaXQgaW4gd2l0aFxuICAgICAgICAgICAgICAgIC8vIHNvbWV0aGluZy5cbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbGwgaW4gZW1wdHkgJ2EnIGVsZW1lbnQgaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSB3aXRoIGhyZWYgJHtocmVmfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8gIE1BSEFGVU5DUyBGT1IgRklOQUwgUEFTU1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIDxjb2RlPm11bmdlZD15ZXM8L2NvZGU+IGF0dHJpYnV0ZSB0aGF0IGlzIGFkZGVkXG4gKiBieSA8Y29kZT5BbmNob3JDbGVhbnVwPC9jb2RlPi5cbiAqL1xuY2xhc3MgTXVuZ2VkQXR0clJlbW92ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgJGVsZW1lbnQucmVtb3ZlQXR0cignbXVuZ2VkJyk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vIE51bmp1Y2tzIEV4dGVuc2lvbnNcblxuLy8gRnJvbSBodHRwczovL2dpdGh1Yi5jb20vc29mdG9uaWMvbnVuanVja3MtaW5jbHVkZS13aXRoL3RyZWUvbWFzdGVyXG5cbmNsYXNzIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2Frc3R5bGVzaGVldHMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gc3R5bGVzaGVldHNFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha3N0eWxlc2hlZXRzJyk7XG5cbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuXG4gICAgICAgICAgICAvLyBTZWUgYWJvdmUgZm9yIG5vdGVzIGFib3V0IENhbGxFeHRlbnNpb25cbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYHN0eWxlc2hlZXRzRXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9TdHlsZXNoZWV0cyhjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2hlYWRlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFraGVhZGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9IZWFkZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5jbGFzcyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2FrZm9vdGVyanMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtmb290ZXJqcycpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb0Zvb3RlckphdmFTY3JpcHQoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHRlc3RFeHRlbnNpb24oKSB7XG4gICAgdGhpcy50YWdzID0gWyAnYWtuamt0ZXN0JyBdO1xuXG4gICAgdGhpcy5wYXJzZSA9IGZ1bmN0aW9uKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG5jb25zb2xlLmxvZyhgaW4gdGVzdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRhZyB0b2tlblxuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcblxuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYXJncyBhbmQgbW92ZSBhZnRlciB0aGUgYmxvY2sgZW5kLiBwYXNzaW5nIHRydWVcbiAgICAgICAgICAgIC8vIGFzIHRoZSBzZWNvbmQgYXJnIGlzIHJlcXVpcmVkIGlmIHRoZXJlIGFyZSBubyBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGJvZHkgYW5kIHBvc3NpYmx5IHRoZSBlcnJvciBibG9jaywgd2hpY2ggaXMgb3B0aW9uYWxcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2Vycm9yJywgJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgdmFyIGVycm9yQm9keSA9IG51bGw7XG5cbiAgICAgICAgICAgIGlmKHBhcnNlci5za2lwU3ltYm9sKCdlcnJvcicpKSB7XG4gICAgICAgICAgICAgICAgcGFyc2VyLnNraXAobGV4ZXIuVE9LRU5fQkxPQ0tfRU5EKTtcbiAgICAgICAgICAgICAgICBlcnJvckJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtuamt0ZXN0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuXG4gICAgICAgICAgICAvLyBTZWUgYWJvdmUgZm9yIG5vdGVzIGFib3V0IENhbGxFeHRlbnNpb25cbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHksIGVycm9yQm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHRlc3RFeHRpb25zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICB0aGlzLnJ1biA9IGZ1bmN0aW9uKGNvbnRleHQsIHVybCwgYm9keSwgZXJyb3JCb2R5KSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgJHt1dGlsLmluc3BlY3QoY29udGV4dCl9ICR7dXRpbC5pbnNwZWN0KHVybCl9ICR7dXRpbC5pbnNwZWN0KGJvZHkpfSAke3V0aWwuaW5zcGVjdChlcnJvckJvZHkpfWApO1xuICAgIH07XG5cbn1cbiJdfQ==