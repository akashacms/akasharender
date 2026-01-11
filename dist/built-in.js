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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsTUFBTSxZQUFZLENBQUM7QUFFakcsTUFBTSxVQUFVLEdBQUcsbUJBQW1CLENBQUM7QUFFdkMsTUFBTSxPQUFPLGFBQWMsU0FBUSxNQUFNO0lBQ3hDO1FBQ0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBS2hCLHdDQUFRO1FBQ1IsOENBQWM7UUFMVix1QkFBQSxJQUFJLCtCQUFpQixFQUFFLE1BQUEsQ0FBQztJQUUvQixDQUFDO0lBS0QsU0FBUyxDQUFDLE1BQXFCLEVBQUUsT0FBTztRQUNqQyx1QkFBQSxJQUFJLHlCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLE1B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LEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUN6RSxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELENBQUM7SUFDTCxDQUFDLENBQUM7SUFHRixJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVMsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUztRQUM3QyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDNUgsQ0FBQyxDQUFDO0FBRU4sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgZnNwIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHVybCBmcm9tICdub2RlOnVybCc7XG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHV0aWwgZnJvbSAnbm9kZTp1dGlsJztcbmltcG9ydCBzaGFycCBmcm9tICdzaGFycCc7XG5pbXBvcnQgKiBhcyB1dWlkIGZyb20gJ3V1aWQnO1xuY29uc3QgdXVpZHYxID0gdXVpZC52MTtcbmltcG9ydCAqIGFzIHJlbmRlciBmcm9tICcuL3JlbmRlci5qcyc7XG5pbXBvcnQgeyBQbHVnaW4gfSBmcm9tICcuL1BsdWdpbi5qcyc7XG5pbXBvcnQgcmVsYXRpdmUgZnJvbSAncmVsYXRpdmUnO1xuaW1wb3J0IGhsanMgZnJvbSAnaGlnaGxpZ2h0LmpzJztcbmltcG9ydCBtYWhhYmh1dGEgZnJvbSAnbWFoYWJodXRhJztcbmltcG9ydCBtYWhhTWV0YWRhdGEgZnJvbSAnbWFoYWJodXRhL21haGEvbWV0YWRhdGEuanMnO1xuaW1wb3J0IG1haGFQYXJ0aWFsIGZyb20gJ21haGFiaHV0YS9tYWhhL3BhcnRpYWwuanMnO1xuaW1wb3J0IFJlbmRlcmVycyBmcm9tICdAYWthc2hhY21zL3JlbmRlcmVycyc7XG5pbXBvcnQge2VuY29kZX0gZnJvbSAnaHRtbC1lbnRpdGllcyc7XG5pbXBvcnQgeyBDb25maWd1cmF0aW9uLCBDdXN0b21FbGVtZW50LCBNdW5nZXIsIFBhZ2VQcm9jZXNzb3IsIGphdmFTY3JpcHRJdGVtIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5cbmNvbnN0IHBsdWdpbk5hbWUgPSBcImFrYXNoYWNtcy1idWlsdGluXCI7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdEluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIocGx1Z2luTmFtZSk7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZSA9IFtdO1xuXG5cdH1cblxuICAgICNjb25maWc7XG4gICAgI3Jlc2l6ZV9xdWV1ZTtcblxuXHRjb25maWd1cmUoY29uZmlnOiBDb25maWd1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtb2R1bGVEaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbiAgICAgICAgLy8gTmVlZCB0aGlzIGFzIHRoZSBwbGFjZSB0byBzdG9yZSBOdW5qdWNrcyBtYWNyb3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICBjb25maWcuYWRkTGF5b3V0c0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ2xheW91dHMnKSk7XG4gICAgICAgIGNvbmZpZy5hZGRQYXJ0aWFsc0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ3BhcnRpYWxzJykpO1xuICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gdGhlIENvbmZpZ3VyYXRpb24gY29uc3RydWN0b3IuICBUaGUgaWRlYSBpcyB0byBwdXRcbiAgICAgICAgLy8gbWFoYVBhcnRpYWwgYXMgdGhlIHZlcnkgZmlyc3QgTWFoYWZ1bmMgc28gdGhhdCBhbGxcbiAgICAgICAgLy8gUGFydGlhbCdzIGFyZSBoYW5kbGVkIGJlZm9yZSBhbnl0aGluZyBlbHNlLiAgVGhlIGlzc3VlIGNhdXNpbmdcbiAgICAgICAgLy8gdGhpcyBjaGFuZ2UgaXMgdGhlIE9wZW5HcmFwaFByb21vdGVJbWFnZXMgTWFoYWZ1bmMgaW5cbiAgICAgICAgLy8gYWthc2hhY2hzLWJhc2UgYW5kIHByb2Nlc3NpbmcgYW55IGltYWdlcyBicm91Z2h0IGluIGJ5IHBhcnRpYWxzLlxuICAgICAgICAvLyBFbnN1cmluZyB0aGUgcGFydGlhbCB0YWcgaXMgcHJvY2Vzc2VkIGJlZm9yZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzXG4gICAgICAgIC8vIG1lYW50IHN1Y2ggaW1hZ2VzIHdlcmUgcHJvcGVybHkgcHJvbW90ZWQuXG4gICAgICAgIC8vIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAvLyAgICAgcmVuZGVyUGFydGlhbDogb3B0aW9ucy5yZW5kZXJQYXJ0aWFsXG4gICAgICAgIC8vIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhTWV0YWRhdGEubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgLy8gRG8gbm90IHBhc3MgdGhpcyB0aHJvdWdoIHNvIHRoYXQgTWFoYWJodXRhIHdpbGwgbm90XG4gICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIGxpbmtzIHRvIHN1YmRpcmVjdG9yaWVzXG4gICAgICAgICAgICAvLyByb290X3VybDogY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICAvLyBUT0RPIGhvdyB0byBjb25maWd1cmUgdGhpc1xuICAgICAgICAgICAgLy8gc2l0ZW1hcF90aXRsZTogLi4uLj9cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFiaHV0YUFycmF5KG9wdGlvbnMsIGNvbmZpZywgdGhpcy5ha2FzaGEsIHRoaXMpKTtcblxuICAgICAgICBjb25zdCBuamsgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJOYW1lKCcuaHRtbC5uamsnKSBhcyBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICBuZXcgc3R5bGVzaGVldHNFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtoZWFkZXJqcycsXG4gICAgICAgICAgICBuZXcgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2Zvb3RlcmpzJyxcbiAgICAgICAgICAgIG5ldyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIGV4dGVuc2lvbnMgd2VyZSBpbnN0YWxsZWRcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgW1xuICAgICAgICAgICAgICAgICAgICAnYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICAgICAgICAgICdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FrZm9vdGVyanMnXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbihleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmUgLSBOSksgZG9lcyBub3QgaGF2ZSBleHRlbnNpb24gLSAke2V4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gdHJ5IHtcbiAgICAgICAgLy8gICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrbmprdGVzdCcsIG5ldyB0ZXN0RXh0ZW5zaW9uKCkpO1xuICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKCkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIFxuICAgICAgICAvLyBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oJ2FrbmprdGVzdCcpKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBha25qa3Rlc3QgZXh0ZW5zaW9uIG5vdCBhZGRlZD9gKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgZXhpc3RzYCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgLy8gZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG5cbiAgICBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8bGluaz4gdGFncyBpbiB0aGUgPGhlYWQ+IGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplSGVhZExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8c2NyaXB0PiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplU2NyaXB0TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPEE+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVCb2R5TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIGRvU3R5bGVzaGVldHMobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgYWRkSW1hZ2VUb1Jlc2l6ZShzcmM6IHN0cmluZywgcmVzaXpld2lkdGg6IG51bWJlciwgcmVzaXpldG86IHN0cmluZywgZG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGRJbWFnZVRvUmVzaXplICR7c3JjfSByZXNpemV3aWR0aCAke3Jlc2l6ZXdpZHRofSByZXNpemV0byAke3Jlc2l6ZXRvfWApXG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBzZWN0aW9uIHdhcyBhZGRlZCBpbiB0aGUgcG9zc2liaWxpdHkgb2ZcbiAgICAvLyBtb3ZpbmcgdGFnZ2VkLWNvbnRlbnQgaW50byB0aGUgY29yZS5cbiAgICAvLyBBZnRlciB0cnlpbmcgdGhpcywgdGhhdCBzZWVtcyBsaWtlIGEgbm9uLXN0YXJ0ZXJcbiAgICAvLyBvZiBhIHByb2plY3QgaWRlYS5cblxuICAgIC8vICNwYXRoSW5kZXhlczogc3RyaW5nO1xuXG4gICAgLy8gc2V0IHBhdGhJbmRleGVzKGluZGV4ZXMpIHsgdGhpcy4jcGF0aEluZGV4ZXMgPSBpbmRleGVzOyB9XG4gICAgLy8gZ2V0IHBhdGhJbmRleGVzKCkgICAgICAgIHsgcmV0dXJuIHRoaXMuI3BhdGhJbmRleGVzOyB9XG5cbiAgICAvLyB0YWdQYWdlVXJsKGNvbmZpZywgdGFnTmFtZSkge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHRoaXMuI3BhdGhJbmRleGVzICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcihgQnVpbHRJblBsdWdpbiBwYXRoSW5kZXhlcyBoYXMgbm90IGJlZW4gc2V0ICR7dXRpbC5pbnNwZWN0KHRoaXMuI3BhdGhJbmRleGVzKX1gKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBpZiAodGhpcy5wYXRoSW5kZXhlcy5lbmRzV2l0aCgnLycpKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5wYXRoSW5kZXhlcyArIHRhZzJlbmNvZGU0dXJsKHRhZ05hbWUpICsnLmh0bWwnO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucGF0aEluZGV4ZXMgKycvJysgdGFnMmVuY29kZTR1cmwodGFnTmFtZSkgKycuaHRtbCc7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhc3luYyBkb1RhZ3NGb3JEb2N1bWVudChjb25maWcsIG1ldGFkYXRhLCB0ZW1wbGF0ZSkge1xuICAgIC8vICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gICAgIGNvbnN0IHBsdWdpbiA9IHRoaXM7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnZG9UYWdzRm9yRG9jdW1lbnQgJysgdXRpbC5pbnNwZWN0KG1ldGFkYXRhKSk7XG4gICAgLy8gICAgIGNvbnN0IHRhZ2xpc3QgPSAoXG4gICAgLy8gICAgICAgICAgICAgJ3RhZ3MnIGluIG1ldGFkYXRhXG4gICAgLy8gICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkobWV0YWRhdGEudGFncylcbiAgICAvLyAgICAgICAgICkgPyBtZXRhZGF0YS50YWdzIDogW107XG4gICAgLy8gICAgIGlmICh0YWdsaXN0KSB7XG4gICAgLy8gICAgICAgICBjb25zdCB0YWd6bGlzdCA9IFtdO1xuICAgIC8vICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFnbGlzdCkge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3psaXN0LnB1c2goe1xuICAgIC8vICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ1VybDogcGx1Z2luLnRhZ1BhZ2VVcmwoY29uZmlnLCB0YWcpLFxuICAgIC8vICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYXdhaXQgZG9jdW1lbnRzLmdldFRhZ0Rlc2NyaXB0aW9uKHRhZylcbiAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkb1RhZ3NGb3JEb2N1bWVudCAnKyB1dGlsLmluc3BlY3QodGFnbGlzdCkpO1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3o6IHRhZ3psaXN0XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfSBlbHNlIHJldHVybiBcIlwiO1xuICAgIC8vIH1cblxuICAgIGFzeW5jIG9uU2l0ZVJlbmRlcmVkKGNvbmZpZykge1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICB3aGlsZSAoQXJyYXkuaXNBcnJheSh0aGlzLiNyZXNpemVfcXVldWUpXG4gICAgICAgICAgICAmJiB0aGlzLiNyZXNpemVfcXVldWUubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgICBsZXQgdG9yZXNpemUgPSB0aGlzLiNyZXNpemVfcXVldWUucG9wKCk7XG5cbiAgICAgICAgICAgIGxldCBpbWcycmVzaXplO1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodG9yZXNpemUuc3JjKSkge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgdG9yZXNpemUuc3JjXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSB0b3Jlc2l6ZS5zcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzcmNmaWxlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBhc3NldHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIHNyY2ZpbGUgPSBmb3VuZC5mc3BhdGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoaW1nMnJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kID8gZm91bmQuZnNwYXRoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzcmNmaWxlKSB0aHJvdyBuZXcgRXJyb3IoYGFrYXNoYWNtcy1idWlsdGluOiBEaWQgbm90IGZpbmQgc291cmNlIGZpbGUgZm9yIGltYWdlIHRvIHJlc2l6ZSAke2ltZzJyZXNpemV9YCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IGltZyA9IGF3YWl0IHNoYXJwKHNyY2ZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkID0gYXdhaXQgaW1nLnJlc2l6ZShOdW1iZXIucGFyc2VJbnQodG9yZXNpemUucmVzaXpld2lkdGgpKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNvbXB1dGUgdGhlIGNvcnJlY3QgZGVzdGluYXRpb24gcGF0aFxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgcmVzaXplZCBpbWFnZVxuICAgICAgICAgICAgICAgIGxldCBpbWd0b3Jlc2l6ZSA9IHRvcmVzaXplLnJlc2l6ZXRvID8gdG9yZXNpemUucmVzaXpldG8gOiBpbWcycmVzaXplO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkZXN0O1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaW1ndG9yZXNpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBmb3IgcmVsYXRpdmUgaW1hZ2UgcGF0aHMsIGhlbmNlIGl0IG5lZWRzIHRvIGJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBkb2NQYXRoXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZXNpemVkZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzaXplZC50b0ZpbGUocmVzaXplZGVzdCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBidWlsdC1pbjogSW1hZ2UgcmVzaXplIGZhaWxlZCBmb3IgJHtzcmNmaWxlfSAodG9yZXNpemUgJHt1dGlsLmluc3BlY3QodG9yZXNpemUpfSBmb3VuZCAke3V0aWwuaW5zcGVjdChmb3VuZCl9KSBiZWNhdXNlICR7ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5leHBvcnQgY29uc3QgbWFoYWJodXRhQXJyYXkgPSBmdW5jdGlvbihcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBjb25maWc/OiBDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgYWthc2hhPzogYW55LFxuICAgICAgICAgICAgcGx1Z2luPzogUGx1Z2luXG4pIHtcbiAgICBsZXQgcmV0ID0gbmV3IG1haGFiaHV0YS5NYWhhZnVuY0FycmF5KHBsdWdpbk5hbWUsIG9wdGlvbnMpO1xuICAgIC8vIHJldC5hZGRNYWhhZnVuYyhuZXcgVGFnc0ZvckRvY3VtZW50RWxlbWVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTdHlsZXNoZWV0c0VsZW1lbnQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZGVySmF2YVNjcmlwdChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGb290ZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEhlYWRMaW5rUmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2NyaXB0UmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW5zZXJ0VGVhc2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IENvZGVFbWJlZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBpbWcyZmlndXJlSW1hZ2UoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTaG93Q29udGVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTZWxlY3RFbGVtZW50cyhjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBbmNob3JDbGVhbnVwKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBNdW5nZWRBdHRyUmVtb3Zlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuLy8gY2xhc3MgVGFnc0ZvckRvY3VtZW50RWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuLy8gICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGFncy1mb3ItZG9jdW1lbnRcIjsgfVxuLy8gICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuLy8gICAgICAgICBjb25zdCBwbHVnaW4gPSB0aGlzLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSk7XG4vLyAgICAgICAgIHJldHVybiBhd2FpdCBwbHVnaW4uZG9UYWdzRm9yRG9jdW1lbnQodGhpcy5jb25maWcsXG4vLyAgICAgICAgICAgICAgICAgbWV0YWRhdGEsIFwiYWtfZG9jdW1lbnRfdGFncy5odG1sLm5qa1wiKTtcbi8vICAgICB9XG4vLyB9XG5cbmZ1bmN0aW9uIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcbiAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEpfWApO1xuXG4gICAgdmFyIHNjcmlwdHM7XG4gICAgaWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMuY29uY2F0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cyA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYGFrLXN0eWxlc2hlZXRzICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpfSAke3V0aWwuaW5zcGVjdChjb25maWcuc2NyaXB0cyl9ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXG4gICAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMnKTtcbiAgICBpZiAoIWNvbmZpZykgdGhyb3cgbmV3IEVycm9yKCdfZG9TdHlsZXNoZWV0cyBubyBjb25maWcnKTtcblxuICAgIHZhciByZXQgPSAnJztcbiAgICBpZiAodHlwZW9mIHNjcmlwdHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAodmFyIHN0eWxlIG9mIHNjcmlwdHMpIHtcblxuICAgICAgICAgICAgbGV0IHN0eWxlaHJlZiA9IHN0eWxlLmhyZWY7XG4gICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKHN0eWxlLmhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBwcm9jZXNzICR7c3R5bGVocmVmfWApO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcblxuICAgICAgICAgICAgICAgIC8vIFRoZSBiaXQgd2l0aCAnaHR0cDovL2V4YW1wbGUuY29tJyBtZWFucyB0aGVyZVxuICAgICAgICAgICAgICAgIC8vIHdvbid0IGJlIGFuIGV4Y2VwdGlvbiB0aHJvd24gZm9yIGEgbG9jYWwgVVJMLlxuICAgICAgICAgICAgICAgIC8vIEJ1dCwgaW4gc3VjaCBhIGNhc2UsIHVIcmVmLnBhdGhuYW1lIHdvdWxkXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgd2l0aCBhIHNsYXNoLiAgVGhlcmVmb3JlLCB0byBjb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUgaWYgdGhpcyBVUkwgaXMgYWJzb2x1dGUgd2UgbXVzdCBjaGVja1xuICAgICAgICAgICAgICAgIC8vIHdpdGggdGhlIG9yaWdpbmFsIFVSTCBzdHJpbmcsIHdoaWNoIGlzIGluXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN0eWxlaHJlZiB2YXJpYWJsZS5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzXG4gICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzdHlsZWhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQWApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtZXRhZGF0YS5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBIERPQ1VNRU5UYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlQgUkVOREVSVE9gKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyByZWxhdGl2ZSgvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb30sICR7c3R5bGVocmVmfSkgPSAke3JlbGF0aXZlKCcvJyttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbywgc3R5bGVocmVmKX1gKVxuICAgICAgICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBhYnNvbHV0ZSBzdHlsZWhyZWYgJHtzdHlsZWhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlaHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkb1N0eWxlTWVkaWEgPSAobWVkaWEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobWVkaWEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBtZWRpYT1cIiR7ZW5jb2RlKG1lZGlhKX1cImBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxldCBodCA9IGA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIiR7ZW5jb2RlKHN0eWxlaHJlZil9XCIgJHtkb1N0eWxlTWVkaWEoc3R5bGUubWVkaWEpfS8+YFxuICAgICAgICAgICAgcmV0ICs9IGh0O1xuXG4gICAgICAgICAgICAvLyBUaGUgaXNzdWUgd2l0aCB0aGlzIGFuZCBvdGhlciBpbnN0YW5jZXNcbiAgICAgICAgICAgIC8vIGlzIHRoYXQgdGhpcyB0ZW5kZWQgdG8gcmVzdWx0IGluXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICA8aHRtbD48Ym9keT48bGluay4uPjwvYm9keT48L2h0bWw+XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2hlbiBpdCBuZWVkZWQgdG8ganVzdCBiZSB0aGUgPGxpbms+IHRhZy5cbiAgICAgICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCBpdCB0cmllZCB0byBjcmVhdGUgYW4gZW50aXJlXG4gICAgICAgICAgICAvLyBIVE1MIGRvY3VtZW50LiAgV2hpbGUgdGhlcmUgd2FzIGEgd2F5IGFyb3VuZFxuICAgICAgICAgICAgLy8gdGhpcyAtICQoJ3NlbGVjdG9yJykucHJvcCgnb3V0ZXJIVE1MJylcbiAgICAgICAgICAgIC8vIFRoaXMgYWxzbyBzZWVtZWQgdG8gYmUgYW4gb3ZlcmhlYWRcbiAgICAgICAgICAgIC8vIHdlIGNhbiBhdm9pZC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgcGF0dGVybiBpcyB0byB1c2UgVGVtcGxhdGUgU3RyaW5ncyB3aGlsZVxuICAgICAgICAgICAgLy8gYmVpbmcgY2FyZWZ1bCB0byBlbmNvZGUgdmFsdWVzIHNhZmVseSBmb3IgdXNlXG4gICAgICAgICAgICAvLyBpbiBhbiBhdHRyaWJ1dGUuICBUaGUgXCJlbmNvZGVcIiBmdW5jdGlvbiBkb2VzXG4gICAgICAgICAgICAvLyB0aGUgZW5jb2RpbmcuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy80OVxuXG4gICAgICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZSgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCJcIi8+Jyk7XG4gICAgICAgICAgICAvLyAkKCdsaW5rJykuYXR0cignaHJlZicsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAvLyBpZiAoc3R5bGUubWVkaWEpIHtcbiAgICAgICAgICAgIC8vICAgICAkKCdsaW5rJykuYXR0cignbWVkaWEnLCBzdHlsZS5tZWRpYSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyByZXQgKz0gJC5odG1sKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzICR7cmV0fWApO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfZG9KYXZhU2NyaXB0cyhcbiAgICBtZXRhZGF0YSxcbiAgICBzY3JpcHRzOiBqYXZhU2NyaXB0SXRlbVtdLFxuICAgIG9wdGlvbnMsXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uXG4pIHtcblx0dmFyIHJldCA9ICcnO1xuXHRpZiAoIXNjcmlwdHMpIHJldHVybiByZXQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb0phdmFTY3JpcHRzIG5vIGNvbmZpZycpO1xuXG4gICAgZm9yICh2YXIgc2NyaXB0IG9mIHNjcmlwdHMpIHtcblx0XHRpZiAoIXNjcmlwdC5ocmVmICYmICFzY3JpcHQuc2NyaXB0KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE11c3Qgc3BlY2lmeSBlaXRoZXIgaHJlZiBvciBzY3JpcHQgaW4gJHt1dGlsLmluc3BlY3Qoc2NyaXB0KX1gKTtcblx0XHR9XG4gICAgICAgIGlmICghc2NyaXB0LnNjcmlwdCkgc2NyaXB0LnNjcmlwdCA9ICcnO1xuXG4gICAgICAgIGNvbnN0IGRvVHlwZSA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgdHlwZT1cIiR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRvSHJlZiA9IChocmVmKSA9PiB7XG4gICAgICAgICAgICBpZiAoaHJlZikge1xuICAgICAgICAgICAgICAgIGxldCBzY3JpcHRocmVmID0gaHJlZjtcbiAgICAgICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rc1xuICAgICAgICAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoc2NyaXB0aHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNjcmlwdGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb0phdmFTY3JpcHRzIGFic29sdXRlIHNjcmlwdGhyZWYgJHtzY3JpcHRocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHJld3JvdGUgdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0aHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBzcmM9XCIke2VuY29kZShzY3JpcHRocmVmKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGh0ID0gYDxzY3JpcHQgJHtkb1R5cGUoc2NyaXB0LmxhbmcpfSAke2RvSHJlZihzY3JpcHQuaHJlZil9PiR7c2NyaXB0LnNjcmlwdH08L3NjcmlwdD5gO1xuICAgICAgICByZXQgKz0gaHQ7XG4gICAgfVxuXHRyZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wIDogdW5kZWZpbmVkO1xuXHR9XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXHQvLyBjb25zb2xlLmxvZyhgX2RvSGVhZGVySmF2YVNjcmlwdCAke3V0aWwuaW5zcGVjdChjb25maWcuc2NyaXB0cyl9YCk7XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucywgY29uZmlnOiBDb25maWd1cmF0aW9uKSB7XG5cdHZhciBzY3JpcHRzO1xuXHRpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRCb3R0b20gIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzID8gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbSA6IHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMsIGNvbmZpZyk7XG59XG5cbmNsYXNzIFN0eWxlc2hlZXRzRWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXN0eWxlc2hlZXRzXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9ICBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTdHlsZXNoZWV0c0VsZW1lbnQgYCwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcblx0fVxufVxuXG5jbGFzcyBIZWFkZXJKYXZhU2NyaXB0IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstaGVhZGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbikge1xuXHRcdGxldCByZXQgPSBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEhlYWRlckphdmFTY3JpcHQgYCwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcblx0fVxufVxuXG5jbGFzcyBGb290ZXJKYXZhU2NyaXB0IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstZm9vdGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcblx0fVxufVxuXG5jbGFzcyBIZWFkTGlua1JlbGF0aXZpemVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgLy8gSXQncyBhIGxvY2FsIGxpbmtcbiAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIFNjcmlwdFJlbGF0aXZpemVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzY3JpcHRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcykgcmV0dXJuO1xuICAgICAgICBsZXQgaHJlZiA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuXG4gICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGxpbmtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIEluc2VydFRlYXNlciBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXRlYXNlclwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB0cnkge1xuXHRcdHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFrX3RlYXNlci5odG1sLm5qa1wiLCB7XG5cdFx0XHR0ZWFzZXI6IHR5cGVvZiBtZXRhZGF0YVtcImFrLXRlYXNlclwiXSAhPT0gXCJ1bmRlZmluZWRcIlxuXHRcdFx0XHQ/IG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdIDogbWV0YWRhdGEudGVhc2VyXG5cdFx0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEluc2VydFRlYXNlciBjYXVnaHQgZXJyb3IgYCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG5cdH1cbn1cblxuY2xhc3MgQWtCb2R5Q2xhc3NBZGQgZXh0ZW5kcyBQYWdlUHJvY2Vzc29yIHtcblx0YXN5bmMgcHJvY2VzcygkLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGlmICh0eXBlb2YgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT09ICd1bmRlZmluZWQnXG5cdFx0ICYmIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9ICcnXG5cdFx0ICYmICQoJ2h0bWwgYm9keScpLmdldCgwKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0aWYgKCEkKCdodG1sIGJvZHknKS5oYXNDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCkpIHtcblx0XHRcdFx0XHQkKCdodG1sIGJvZHknKS5hZGRDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZSh1bmRlZmluZWQpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHJldHVybiBQcm9taXNlLnJlc29sdmUoJycpO1xuXHR9XG59XG5cbmNsYXNzIENvZGVFbWJlZCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiY29kZS1lbWJlZFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYENvZGVFbWJlZCBwcm9jZXNzICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50LCBmYWxzZSwgMTApfWApO1xuXG4gICAgICAgIGNvbnN0IGZuID0gJGVsZW1lbnQuYXR0cignZmlsZS1uYW1lJyk7XG4gICAgICAgIGNvbnN0IGxhbmcgPSAkZWxlbWVudC5hdHRyKCdsYW5nJyk7XG4gICAgICAgIGNvbnN0IGlkID0gJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgICAgICBpZiAoIWZuIHx8IGZuID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RlLWVtYmVkIG11c3QgaGF2ZSBmaWxlLW5hbWUgYXJndW1lbnQsIGdvdCAke2ZufWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHR4dHBhdGg7XG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoZm4pKSB7XG4gICAgICAgICAgICB0eHRwYXRoID0gZm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eHRwYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyksIGZuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgY29uc3QgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZCh0eHRwYXRoKTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RlLWVtYmVkIGZpbGUtbmFtZSAke2ZufSBkb2VzIG5vdCByZWZlciB0byB1c2FibGUgZmlsZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICBjb25zdCBkb0xhbmcgPSAobGFuZykgPT4ge1xuICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGNsYXNzPVwiaGxqcyAke2VuY29kZShsYW5nKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnY2xhc3M9XCJobGpzXCInO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBkb0lEID0gKGlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGlkPVwiJHtlbmNvZGUoaWQpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRvQ29kZSA9IChsYW5nLCBjb2RlKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZyAmJiBsYW5nICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0KGNvZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmdcbiAgICAgICAgICAgICAgICB9KS52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0QXV0byhjb2RlKS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgcmV0ID0gYDxwcmUgJHtkb0lEKGlkKX0+PGNvZGUgJHtkb0xhbmcobGFuZyl9PiR7ZG9Db2RlKGxhbmcsIHR4dCl9PC9jb2RlPjwvcHJlPmA7XG4gICAgICAgIHJldHVybiByZXQ7XG5cbiAgICAgICAgLy8gbGV0ICQgPSBtYWhhYmh1dGEucGFyc2UoYDxwcmU+PGNvZGU+PC9jb2RlPjwvcHJlPmApO1xuICAgICAgICAvLyBpZiAobGFuZyAmJiBsYW5nICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFkZENsYXNzKGxhbmcpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vICQoJ2NvZGUnKS5hZGRDbGFzcygnaGxqcycpO1xuICAgICAgICAvLyBpZiAoaWQgJiYgaWQgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdwcmUnKS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBpZiAobGFuZyAmJiBsYW5nICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFwcGVuZChobGpzLmhpZ2hsaWdodCh0eHQsIHtcbiAgICAgICAgLy8gICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAvLyAgICAgfSkudmFsdWUpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFwcGVuZChobGpzLmhpZ2hsaWdodEF1dG8odHh0KS52YWx1ZSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gcmV0dXJuICQuaHRtbCgpO1xuICAgIH1cbn1cblxuY2xhc3MgRmlndXJlSW1hZ2UgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImZpZy1pbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19maWdpbWcuaHRtbC5uamsnO1xuICAgICAgICBjb25zdCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHRocm93IG5ldyBFcnJvcignZmlnLWltZyBtdXN0IHJlY2VpdmUgYW4gaHJlZicpO1xuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNhcHRpb24gPSAkZWxlbWVudC5odG1sKCk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgaW1nMmZpZ3VyZUltYWdlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBpbWdbZmlndXJlXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHksIGRvbmUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJykgXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpXG4gICAgICAgICAgICAgICAgOiAgXCJha19maWdpbWcuaHRtbC5uamtcIjtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzcmMgPSAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAgICAgICAgIGlkLCBjbGF6eiwgc3R5bGUsIHdpZHRoLCBocmVmOiBzcmMsIGRlc3QsIHJlc2l6ZXdpZHRoLCByZXNpemV0byxcbiAgICAgICAgICAgIGNhcHRpb246IGNvbnRlbnRcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBJbWFnZVJld3JpdGVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcblxuICAgICAgICAvLyBXZSBvbmx5IGRvIHJld3JpdGVzIGZvciBsb2NhbCBpbWFnZXNcbiAgICAgICAgbGV0IHNyYyA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuICAgICAgICAvLyBGb3IgbG9jYWwgVVJMcywgdGhpcyBuZXcgVVJMIGNhbGwgd2lsbFxuICAgICAgICAvLyBtYWtlIHVTcmMub3JpZ2luID09PSBodHRwOi8vZXhhbXBsZS5jb21cbiAgICAgICAgLy8gSGVuY2UsIGlmIHNvbWUgb3RoZXIgZG9tYWluIGFwcGVhcnNcbiAgICAgICAgLy8gdGhlbiB3ZSBrb253IGl0J3Mgbm90IGEgbG9jYWwgaW1hZ2UuXG4gICAgICAgIGNvbnN0IHVTcmMgPSBuZXcgVVJMKHNyYywgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICBpZiAodVNyYy5vcmlnaW4gIT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBcmUgd2UgYXNrZWQgdG8gcmVzaXplIHRoZSBpbWFnZT9cbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkbGluay5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkbGluay5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChyZXNpemV3aWR0aCkge1xuICAgICAgICAgICAgLy8gQWRkIHRvIGEgcXVldWUgdGhhdCBpcyBydW4gYXQgdGhlIGVuZCBcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgIC5hZGRJbWFnZVRvUmVzaXplKHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyk7XG5cbiAgICAgICAgICAgIGlmIChyZXNpemV0bykge1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIHJlc2l6ZXRvKTtcbiAgICAgICAgICAgICAgICBzcmMgPSByZXNpemV0bztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlc2UgYXJlIG5vIGxvbmdlciBuZWVkZWRcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgaWRlYSBoZXJlIGlzIGZvciBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgYSByZWxhdGl2ZSBVUkxcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShzcmMpKSB7XG4gICAgICAgICAgICBsZXQgbmV3U3JjID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNyYyk7XG4gICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdTcmMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEltYWdlUmV3cml0ZXIgYWJzb2x1dGUgaW1hZ2UgcGF0aCAke3NyY30gcmV3cm90ZSB0byAke25ld1NyY31gKTtcbiAgICAgICAgICAgIHNyYyA9IG5ld1NyYztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgfVxufVxuXG5jbGFzcyBTaG93Q29udGVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwic2hvdy1jb250ZW50XCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKTtcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkgdGVtcGxhdGUgPSAnYWtfc2hvdy1jb250ZW50Lmh0bWwubmprJztcbiAgICAgICAgbGV0IGhyZWYgICAgPSAkZWxlbWVudC5hdHRyKCdocmVmJyk7XG4gICAgICAgIGlmICghaHJlZikgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignc2hvdy1jb250ZW50IG11c3QgcmVjZWl2ZSBhbiBocmVmJykpO1xuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNhcHRpb24gPSAkZWxlbWVudC5odG1sKCk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgY29uc3QgY29udGVudEltYWdlID0gJGVsZW1lbnQuYXR0cignY29udGVudC1pbWFnZScpO1xuICAgICAgICBsZXQgZG9jMnJlYWQ7XG4gICAgICAgIGlmICghIGhyZWYuc3RhcnRzV2l0aCgnLycpKSB7XG4gICAgICAgICAgICBsZXQgZGlyID0gcGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgpO1xuICAgICAgICAgICAgZG9jMnJlYWQgPSBwYXRoLmpvaW4oJy8nLCBkaXIsIGhyZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jMnJlYWQgPSBocmVmO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9ICR7ZG9jMnJlYWR9YCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jMnJlYWQpO1xuICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3QsIGNvbnRlbnRJbWFnZSxcbiAgICAgICAgICAgIGRvY3VtZW50OiBkb2NcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJldCA9IGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCBkYXRhKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7aHJlZn0gJHt1dGlsLmluc3BlY3QoZGF0YSl9ID09PiAke3JldH1gKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbi8qXG5cblRoaXMgd2FzIG1vdmVkIGludG8gTWFoYWJodXRhXG5cbiBjbGFzcyBQYXJ0aWFsIGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInBhcnRpYWxcIjsgfVxuXHRwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblx0XHQvLyBXZSBkZWZhdWx0IHRvIG1ha2luZyBwYXJ0aWFsIHNldCB0aGUgZGlydHkgZmxhZy4gIEJ1dCBhIHVzZXJcblx0XHQvLyBvZiB0aGUgcGFydGlhbCB0YWcgY2FuIGNob29zZSB0byB0ZWxsIHVzIGl0IGlzbid0IGRpcnR5LlxuXHRcdC8vIEZvciBleGFtcGxlLCBpZiB0aGUgcGFydGlhbCBvbmx5IHN1YnN0aXR1dGVzIG5vcm1hbCB0YWdzXG5cdFx0Ly8gdGhlcmUncyBubyBuZWVkIHRvIGRvIHRoZSBkaXJ0eSB0aGluZy5cblx0XHR2YXIgZG90aGVkaXJ0eXRoaW5nID0gJGVsZW1lbnQuYXR0cignZGlydHknKTtcblx0XHRpZiAoIWRvdGhlZGlydHl0aGluZyB8fCBkb3RoZWRpcnR5dGhpbmcubWF0Y2goL3RydWUvaSkpIHtcblx0XHRcdGRpcnR5KCk7XG5cdFx0fVxuXHRcdHZhciBmbmFtZSA9ICRlbGVtZW50LmF0dHIoXCJmaWxlLW5hbWVcIik7XG5cdFx0dmFyIHR4dCAgID0gJGVsZW1lbnQuaHRtbCgpO1xuXHRcdHZhciBkID0ge307XG5cdFx0Zm9yICh2YXIgbXByb3AgaW4gbWV0YWRhdGEpIHsgZFttcHJvcF0gPSBtZXRhZGF0YVttcHJvcF07IH1cblx0XHR2YXIgZGF0YSA9ICRlbGVtZW50LmRhdGEoKTtcblx0XHRmb3IgKHZhciBkcHJvcCBpbiBkYXRhKSB7IGRbZHByb3BdID0gZGF0YVtkcHJvcF07IH1cblx0XHRkW1wicGFydGlhbEJvZHlcIl0gPSB0eHQ7XG5cdFx0bG9nKCdwYXJ0aWFsIHRhZyBmbmFtZT0nKyBmbmFtZSArJyBhdHRycyAnKyB1dGlsLmluc3BlY3QoZGF0YSkpO1xuXHRcdHJldHVybiByZW5kZXIucGFydGlhbCh0aGlzLmNvbmZpZywgZm5hbWUsIGQpXG5cdFx0LnRoZW4oaHRtbCA9PiB7IHJldHVybiBodG1sOyB9KVxuXHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0ZXJyb3IobmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycikpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycik7XG5cdFx0fSk7XG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzLm1haGFiaHV0YS5hZGRNYWhhZnVuYyhuZXcgUGFydGlhbCgpKTsgKi9cblxuLy9cbi8vIDxzZWxlY3QtZWxlbWVudHMgY2xhc3M9XCIuLlwiIGlkPVwiLi5cIiBjb3VudD1cIk5cIj5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gPC9zZWxlY3QtZWxlbWVudHM+XG4vL1xuY2xhc3MgU2VsZWN0RWxlbWVudHMgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2VsZWN0LWVsZW1lbnRzXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBsZXQgY291bnQgPSAkbGluay5hdHRyKCdjb3VudCcpXG4gICAgICAgICAgICAgICAgICAgID8gTnVtYmVyLnBhcnNlSW50KCRsaW5rLmF0dHIoJ2NvdW50JykpXG4gICAgICAgICAgICAgICAgICAgIDogMTtcbiAgICAgICAgY29uc3QgY2xhenogPSAkbGluay5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICA9ICRsaW5rLmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IHRuICAgID0gJGxpbmsuYXR0cigndGFnLW5hbWUnKVxuICAgICAgICAgICAgICAgICAgICA/ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgOiAnZGl2JztcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9ICRsaW5rLmNoaWxkcmVuKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gW107XG5cbiAgICAgICAgZm9yICg7IGNvdW50ID49IDEgJiYgY2hpbGRyZW4ubGVuZ3RoID49IDE7IGNvdW50LS0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgX24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coX24pO1xuICAgICAgICAgICAgY29uc3QgY2hvc2VuID0gJChjaGlsZHJlbltfbl0pLmh0bWwoKTtcbiAgICAgICAgICAgIHNlbGVjdGVkLnB1c2goY2hvc2VuKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaG9zZW4pO1xuICAgICAgICAgICAgZGVsZXRlIGNoaWxkcmVuW19uXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX3V1aWQgPSB1dWlkdjEoKTtcbiAgICAgICAgJGxpbmsucmVwbGFjZVdpdGgoYDwke3RufSBpZD0nJHtfdXVpZH0nPjwvJHt0bn0+YCk7XG4gICAgICAgIGNvbnN0ICRuZXdJdGVtID0gJChgJHt0bn0jJHtfdXVpZH1gKTtcbiAgICAgICAgaWYgKGlkKSAkbmV3SXRlbS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgZWxzZSAkbmV3SXRlbS5yZW1vdmVBdHRyKCdpZCcpO1xuICAgICAgICBpZiAoY2xhenopICRuZXdJdGVtLmFkZENsYXNzKGNsYXp6KTtcbiAgICAgICAgZm9yIChsZXQgY2hvc2VuIG9mIHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAkbmV3SXRlbS5hcHBlbmQoY2hvc2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbmNsYXNzIEFuY2hvckNsZWFudXAgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGFbbXVuZ2VkIT0neWVzJ11cIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGFbbXVuZ2VkIT0neWVzJ11cIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciBocmVmICAgICA9ICRsaW5rLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgdmFyIGxpbmt0ZXh0ID0gJGxpbmsudGV4dCgpO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgYXNzZXRzLmlzUmVhZHkoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHtocmVmfSAke2xpbmt0ZXh0fWApO1xuICAgICAgICBpZiAoaHJlZiAmJiBocmVmICE9PSAnIycpIHtcbiAgICAgICAgICAgIGNvbnN0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luICE9PSAnaHR0cDovL2V4YW1wbGUuY29tJykgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIGlmICghdUhyZWYucGF0aG5hbWUpIHJldHVybiBcIm9rXCI7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGlzIGxvY2FsICR7aHJlZn0gJHtsaW5rdGV4dH0gdUhyZWYgJHt1SHJlZi5wYXRobmFtZX1gKTtcblxuICAgICAgICAgICAgLyogaWYgKG1ldGFkYXRhLmRvY3VtZW50LnBhdGggPT09ICdpbmRleC5odG1sLm1kJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIG1ldGFkYXRhLmRvY3VtZW50LnBhdGggJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBocmVmICR7aHJlZn0gdUhyZWYucGF0aG5hbWUgJHt1SHJlZi5wYXRobmFtZX0gdGhpcy5jb25maWcucm9vdF91cmwgJHt0aGlzLmNvbmZpZy5yb290X3VybH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkLmh0bWwoKSk7XG4gICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAgIC8vIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGRldGVybWluZWQgdGhpcyBpcyBhIGxvY2FsIGhyZWYuXG4gICAgICAgICAgICAvLyBGb3IgcmVmZXJlbmNlIHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lIG9mIHRoZSBocmVmIHdpdGhpblxuICAgICAgICAgICAgLy8gdGhlIHByb2plY3QuICBGb3IgZXhhbXBsZSB0byByZXRyaWV2ZSB0aGUgdGl0bGUgd2hlbiB3ZSdyZSBmaWxsaW5nXG4gICAgICAgICAgICAvLyBpbiBmb3IgYW4gZW1wdHkgPGE+IHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lLlxuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgbGluayBhcyBoYXZpbmcgYmVlbiBwcm9jZXNzZWQuXG4gICAgICAgICAgICAvLyBUaGUgcHVycG9zZSBpcyBpZiBNYWhhYmh1dGEgcnVucyBtdWx0aXBsZSBwYXNzZXMsXG4gICAgICAgICAgICAvLyB0byBub3QgcHJvY2VzcyB0aGUgbGluayBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICAgIC8vIEJlZm9yZSBhZGRpbmcgdGhpcyAtIHdlIHNhdyB0aGlzIE11bmdlciB0YWtlIGFzIG11Y2hcbiAgICAgICAgICAgIC8vIGFzIDgwMG1zIHRvIGV4ZWN1dGUsIGZvciBFVkVSWSBwYXNzIG1hZGUgYnkgTWFoYWJodXRhLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGlzIGF0dHJpYnV0ZSwgYW5kIGNoZWNraW5nIGZvciBpdCBpbiB0aGUgc2VsZWN0b3IsXG4gICAgICAgICAgICAvLyBtZWFucyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGxpbmsgb25jZS5cbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ211bmdlZCcsICd5ZXMnKTtcblxuICAgICAgICAgICAgbGV0IGFic29sdXRlUGF0aDtcblxuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgpLCBocmVmKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBocmVmICR7aHJlZn0gdUhyZWYucGF0aG5hbWUgJHt1SHJlZi5wYXRobmFtZX0gbm90IGFic29sdXRlLCBhYnNvbHV0ZVBhdGggJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGFic29sdXRlUGF0aCA9IGhyZWY7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaHJlZiAke2hyZWZ9IHVIcmVmLnBhdGhuYW1lICR7dUhyZWYucGF0aG5hbWV9IGFic29sdXRlLCBhYnNvbHV0ZVBhdGggJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gZW5zdXJlIGFsbCBsb2NhbCBocmVmJ3MgYXJlIFxuICAgICAgICAgICAgLy8gZm9yIGEgcmVsYXRpdmUgcGF0aCByYXRoZXIgdGhhbiBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSB1c2UgdGhlIHJlbGF0aXZlIG1vZHVsZSB0byBjb21wdXRlIHRoZSByZWxhdGl2ZSBwYXRoXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgL2luZGV4Lmh0bWwgaW4ge1xuICAgICAgICAgICAgLy8gIGJhc2VkaXI6ICcvVm9sdW1lcy9FeHRyYS9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL3Rlc3QvZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICByZWxwYXRoOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sLm1kJyxcbiAgICAgICAgICAgIC8vICByZWxyZW5kZXI6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnLFxuICAgICAgICAgICAgLy8gIHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbmRlclRvOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sJ1xuICAgICAgICAgICAgLy8gfSB0byAuLi8uLi8uLi9pbmRleC5odG1sXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzXG4gICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vayB0byBzZWUgaWYgaXQncyBhbiBhc3NldCBmaWxlXG4gICAgICAgICAgICBsZXQgZm91bmRBc3NldDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgYXNzZXQgJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRBc3NldCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcblxuICAgICAgICAgICAgLy8gQXNrIHBsdWdpbnMgaWYgdGhlIGhyZWYgaXMgb2theVxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihhYnNvbHV0ZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgbGVnaXQgbG9jYWwgaHJlZiAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGxpbmsgaGFzIGEgYm9keSwgdGhlbiBkb24ndCBtb2RpZnkgaXRcbiAgICAgICAgICAgIGlmICgobGlua3RleHQgJiYgbGlua3RleHQubGVuZ3RoID4gMCAmJiBsaW5rdGV4dCAhPT0gYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHx8ICgkbGluay5jaGlsZHJlbigpLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgc2tpcHBpbmcgJHthYnNvbHV0ZVBhdGh9IHcvICR7dXRpbC5pbnNwZWN0KGxpbmt0ZXh0KX0gY2hpbGRyZW49ICR7JGxpbmsuY2hpbGRyZW4oKX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEb2VzIGl0IGV4aXN0IGluIGRvY3VtZW50cyBkaXI/XG4gICAgICAgICAgICBpZiAoYWJzb2x1dGVQYXRoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSAnL2luZGV4Lmh0bWwnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmRSZW5kZXJzVG8gJHthYnNvbHV0ZVBhdGh9ICR7dXRpbC5pbnNwZWN0KGZvdW5kKX1gKTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBhYnNvbHV0ZVBhdGggJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyc1RvICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgZGlyZWN0b3J5LCB0aGVyZSBtaWdodCBiZSAvcGF0aC90by9pbmRleC5odG1sIHNvIHdlIHRyeSBmb3IgdGhhdC5cbiAgICAgICAgICAgIC8vIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aCB3b3VsZCBmYWlsIG9uIGp1c3QgL3BhdGgvdG8gYnV0IHN1Y2NlZWRcbiAgICAgICAgICAgIC8vIG9uIC9wYXRoL3RvL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIGlmIChmb3VuZC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aC5qb2luKGFic29sdXRlUGF0aCwgXCJpbmRleC5odG1sXCIpKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBsb29rIGludG8gZmlsbGluZyBlbXB0aW5lc3Mgd2l0aCB0aXRsZVxuXG4gICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7ZG9jbWV0YS50aXRsZX1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7aHJlZn1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZFJlbmRlcmVyUGF0aCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLyogdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvY21ldGEgPSBhd2FpdCByZW5kZXJlci5tZXRhZGF0YShmb3VuZC5mb3VuZERpciwgZm91bmQuZm91bmRQYXRoV2l0aGluRGlyKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZXRyaWV2ZSBkb2N1bWVudCBtZXRhZGF0YSBmb3IgJHtmb3VuZC5mb3VuZERpcn0gJHtmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXJ9IGJlY2F1c2UgJHtlcnJ9YCk7XG4gICAgICAgICAgICAgICAgfSAqLS0vXG4gICAgICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgaWYgKCEkbGluay5hdHRyKCd0aXRsZScpICYmIGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmlzaGVkYCk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IERPTkUgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgYm90aGVyIHRocm93aW5nIGFuIGVycm9yLiAgSnVzdCBmaWxsIGl0IGluIHdpdGhcbiAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcuXG4gICAgICAgICAgICAgICAgJGxpbmsudGV4dChocmVmKTtcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaWxsIGluIGVtcHR5ICdhJyBlbGVtZW50IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gd2l0aCBocmVmICR7aHJlZn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vICBNQUhBRlVOQ1MgRk9SIEZJTkFMIFBBU1NcblxuLyoqXG4gKiBSZW1vdmVzIHRoZSA8Y29kZT5tdW5nZWQ9eWVzPC9jb2RlPiBhdHRyaWJ1dGUgdGhhdCBpcyBhZGRlZFxuICogYnkgPGNvZGU+QW5jaG9yQ2xlYW51cDwvY29kZT4uXG4gKi9cbmNsYXNzIE11bmdlZEF0dHJSZW1vdmVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ211bmdlZCcpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLyBOdW5qdWNrcyBFeHRlbnNpb25zXG5cbi8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvZnRvbmljL251bmp1Y2tzLWluY2x1ZGUtd2l0aC90cmVlL21hc3RlclxuXG5jbGFzcyBzdHlsZXNoZWV0c0V4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha3N0eWxlc2hlZXRzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtzdHlsZXNoZWV0cycpO1xuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc3R5bGVzaGVldHNFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvU3R5bGVzaGVldHMoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtoZWFkZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2hlYWRlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvSGVhZGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2Zvb3RlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrZm9vdGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9Gb290ZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0ZXN0RXh0ZW5zaW9uKCkge1xuICAgIHRoaXMudGFncyA9IFsgJ2FrbmprdGVzdCcgXTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbihwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuY29uc29sZS5sb2coYGluIHRlc3RFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlcnJvcicsICdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIHZhciBlcnJvckJvZHkgPSBudWxsO1xuXG4gICAgICAgICAgICBpZihwYXJzZXIuc2tpcFN5bWJvbCgnZXJyb3InKSkge1xuICAgICAgICAgICAgICAgIHBhcnNlci5za2lwKGxleGVyLlRPS0VOX0JMT0NLX0VORCk7XG4gICAgICAgICAgICAgICAgZXJyb3JCb2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5LCBlcnJvckJvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB0ZXN0RXh0aW9uc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbihjb250ZXh0LCB1cmwsIGJvZHksIGVycm9yQm9keSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgYWtuamt0ZXN0ICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfSAke3V0aWwuaW5zcGVjdCh1cmwpfSAke3V0aWwuaW5zcGVjdChib2R5KX0gJHt1dGlsLmluc3BlY3QoZXJyb3JCb2R5KX1gKTtcbiAgICB9O1xuXG59XG4iXX0=