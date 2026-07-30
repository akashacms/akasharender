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
import { CustomElement, Munger, PageProcessor, resolveVpath, doHTMLAttribute } from './index.js';
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
    ret.addMahafunc(new InsertTeaser(config, akasha, plugin));
    ret.addMahafunc(new CodeEmbed(config, akasha, plugin));
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
        if (typeof sortBy === 'string') {
            if (!sortBy.match(/^(title|renderPath|vpath|parentDir|publicationTime)$/)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsWUFBWSxFQUFFLGVBQWUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUVoSSxNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQztBQUV2QyxNQUFNLE9BQU8sYUFBYyxTQUFRLE1BQU07SUFDeEM7UUFDQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFLaEIsd0NBQVE7UUFDUiw4Q0FBYztRQUxWLHVCQUFBLElBQUksK0JBQWlCLEVBQUUsTUFBQSxDQUFDO0lBRS9CLENBQUM7SUFLRCxTQUFTLENBQUMsTUFBcUIsRUFBRSxPQUFPO1FBQ2pDLHVCQUFBLElBQUkseUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsd0JBQXdCO1FBQ3hCLElB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QyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVILENBQUMsQ0FBQztBQUVOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IGZzcCBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB1cmwgZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgc2hhcnAgZnJvbSAnc2hhcnAnO1xuaW1wb3J0ICogYXMgdXVpZCBmcm9tICd1dWlkJztcbmNvbnN0IHV1aWR2MSA9IHV1aWQudjE7XG5pbXBvcnQgKiBhcyByZW5kZXIgZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuaW1wb3J0IHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcyc7XG5pbXBvcnQgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5pbXBvcnQgbWFoYU1ldGFkYXRhIGZyb20gJ21haGFiaHV0YS9tYWhhL21ldGFkYXRhLmpzJztcbmltcG9ydCBtYWhhUGFydGlhbCBmcm9tICdtYWhhYmh1dGEvbWFoYS9wYXJ0aWFsLmpzJztcbmltcG9ydCBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHtlbmNvZGV9IGZyb20gJ2h0bWwtZW50aXRpZXMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgQ3VzdG9tRWxlbWVudCwgTXVuZ2VyLCBQYWdlUHJvY2Vzc29yLCBqYXZhU2NyaXB0SXRlbSwgcmVzb2x2ZVZwYXRoLCBkb0hUTUxBdHRyaWJ1dGUgfSBmcm9tICcuL2luZGV4LmpzJztcblxuY29uc3QgcGx1Z2luTmFtZSA9IFwiYWthc2hhY21zLWJ1aWx0aW5cIjtcblxuZXhwb3J0IGNsYXNzIEJ1aWx0SW5QbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcihwbHVnaW5OYW1lKTtcbiAgICAgICAgdGhpcy4jcmVzaXplX3F1ZXVlID0gW107XG5cblx0fVxuXG4gICAgI2NvbmZpZztcbiAgICAjcmVzaXplX3F1ZXVlO1xuXG5cdGNvbmZpZ3VyZShjb25maWc6IENvbmZpZ3VyYXRpb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy4jY29uZmlnID0gY29uZmlnO1xuICAgICAgICAvLyB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5ha2FzaGEgPSBjb25maWcuYWthc2hhO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zID8gb3B0aW9ucyA6IHt9O1xuICAgICAgICB0aGlzLm9wdGlvbnMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUJvZHlMaW5rcyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1vZHVsZURpcm5hbWUgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuICAgICAgICAvLyBOZWVkIHRoaXMgYXMgdGhlIHBsYWNlIHRvIHN0b3JlIE51bmp1Y2tzIG1hY3JvcyBhbmQgdGVtcGxhdGVzXG4gICAgICAgIGNvbmZpZy5hZGRMYXlvdXRzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAnbGF5b3V0cycpKTtcbiAgICAgICAgY29uZmlnLmFkZFBhcnRpYWxzRGlyKHBhdGguam9pbihtb2R1bGVEaXJuYW1lLCAnLi4nLCAncGFydGlhbHMnKSk7XG4gICAgICAgIC8vIERvIG5vdCBuZWVkIHRoaXMgaGVyZSBhbnkgbG9uZ2VyIGJlY2F1c2UgaXQgaXMgaGFuZGxlZFxuICAgICAgICAvLyBpbiB0aGUgQ29uZmlndXJhdGlvbiBjb25zdHJ1Y3Rvci4gIFRoZSBpZGVhIGlzIHRvIHB1dFxuICAgICAgICAvLyBtYWhhUGFydGlhbCBhcyB0aGUgdmVyeSBmaXJzdCBNYWhhZnVuYyBzbyB0aGF0IGFsbFxuICAgICAgICAvLyBQYXJ0aWFsJ3MgYXJlIGhhbmRsZWQgYmVmb3JlIGFueXRoaW5nIGVsc2UuICBUaGUgaXNzdWUgY2F1c2luZ1xuICAgICAgICAvLyB0aGlzIGNoYW5nZSBpcyB0aGUgT3BlbkdyYXBoUHJvbW90ZUltYWdlcyBNYWhhZnVuYyBpblxuICAgICAgICAvLyBha2FzaGFjaHMtYmFzZSBhbmQgcHJvY2Vzc2luZyBhbnkgaW1hZ2VzIGJyb3VnaHQgaW4gYnkgcGFydGlhbHMuXG4gICAgICAgIC8vIEVuc3VyaW5nIHRoZSBwYXJ0aWFsIHRhZyBpcyBwcm9jZXNzZWQgYmVmb3JlIE9wZW5HcmFwaFByb21vdGVJbWFnZXNcbiAgICAgICAgLy8gbWVhbnQgc3VjaCBpbWFnZXMgd2VyZSBwcm9wZXJseSBwcm9tb3RlZC5cbiAgICAgICAgLy8gY29uZmlnLmFkZE1haGFiaHV0YShtYWhhUGFydGlhbC5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgIC8vICAgICByZW5kZXJQYXJ0aWFsOiBvcHRpb25zLnJlbmRlclBhcnRpYWxcbiAgICAgICAgLy8gfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFNZXRhZGF0YS5tYWhhYmh1dGFBcnJheSh7XG4gICAgICAgICAgICAvLyBEbyBub3QgcGFzcyB0aGlzIHRocm91Z2ggc28gdGhhdCBNYWhhYmh1dGEgd2lsbCBub3RcbiAgICAgICAgICAgIC8vIG1ha2UgYWJzb2x1dGUgbGlua3MgdG8gc3ViZGlyZWN0b3JpZXNcbiAgICAgICAgICAgIC8vIHJvb3RfdXJsOiBjb25maWcucm9vdF91cmxcbiAgICAgICAgICAgIC8vIFRPRE8gaG93IHRvIGNvbmZpZ3VyZSB0aGlzXG4gICAgICAgICAgICAvLyBzaXRlbWFwX3RpdGxlOiAuLi4uP1xuICAgICAgICB9KSk7XG4gICAgICAgIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYWJodXRhQXJyYXkob3B0aW9ucywgY29uZmlnLCB0aGlzLmFrYXNoYSwgdGhpcykpO1xuXG4gICAgICAgIGNvbnN0IG5qayA9IHRoaXMuY29uZmlnLmZpbmRSZW5kZXJlck5hbWUoJy5odG1sLm5qaycpIGFzIFJlbmRlcmVycy5OdW5qdWNrc1JlbmRlcmVyO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgIG5ldyBzdHlsZXNoZWV0c0V4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgIG5ldyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG4gICAgICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrZm9vdGVyanMnLFxuICAgICAgICAgICAgbmV3IGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBWZXJpZnkgdGhhdCB0aGUgZXh0ZW5zaW9ucyB3ZXJlIGluc3RhbGxlZFxuICAgICAgICBmb3IgKGNvbnN0IGV4dCBvZiBbXG4gICAgICAgICAgICAgICAgICAgICdha3N0eWxlc2hlZXRzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FraGVhZGVyanMnLFxuICAgICAgICAgICAgICAgICAgICAnYWtmb290ZXJqcydcbiAgICAgICAgXSkge1xuICAgICAgICAgICAgaWYgKCFuamsubmprZW52KCkuaGFzRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvbmZpZ3VyZSAtIE5KSyBkb2VzIG5vdCBoYXZlIGV4dGVuc2lvbiAtICR7ZXh0fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyB0cnkge1xuICAgICAgICAvLyAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtuamt0ZXN0JywgbmV3IHRlc3RFeHRlbnNpb24oKSk7XG4gICAgICAgIC8vIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihlcnIuc3RhY2soKSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbignYWtuamt0ZXN0JykpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoYGFrbmprdGVzdCBleHRlbnNpb24gbm90IGFkZGVkP2ApO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCBleGlzdHNgKTtcbiAgICAgICAgLy8gfVxuICAgIH1cblxuICAgIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLiNjb25maWc7IH1cbiAgICAvLyBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cblxuICAgIGdldCByZXNpemVxdWV1ZSgpIHsgcmV0dXJuIHRoaXMuI3Jlc2l6ZV9xdWV1ZTsgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxsaW5rPiB0YWdzIGluIHRoZSA8aGVhZD4gZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVIZWFkTGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERldGVybWluZSB3aGV0aGVyIDxzY3JpcHQ+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVTY3JpcHRMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8QT4gdGFncyBmb3IgbG9jYWxcbiAgICAgKiBVUkxzIGFyZSByZWxhdGl2aXplZCBvciBhYnNvbHV0aXplZC5cbiAgICAgKi9cbiAgICBzZXQgcmVsYXRpdml6ZUJvZHlMaW5rcyhyZWwpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSkge1xuICAgIFx0cmV0dXJuIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICB9XG5cbiAgICBkb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICB9XG5cbiAgICBkb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICB9XG5cbiAgICBhZGRJbWFnZVRvUmVzaXplKHNyYzogc3RyaW5nLCByZXNpemV3aWR0aDogbnVtYmVyLCByZXNpemV0bzogc3RyaW5nLCBkb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGFkZEltYWdlVG9SZXNpemUgJHtzcmN9IHJlc2l6ZXdpZHRoICR7cmVzaXpld2lkdGh9IHJlc2l6ZXRvICR7cmVzaXpldG99YClcbiAgICAgICAgdGhpcy4jcmVzaXplX3F1ZXVlLnB1c2goeyBzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgZG9jUGF0aCB9KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIHNlY3Rpb24gd2FzIGFkZGVkIGluIHRoZSBwb3NzaWJpbGl0eSBvZlxuICAgIC8vIG1vdmluZyB0YWdnZWQtY29udGVudCBpbnRvIHRoZSBjb3JlLlxuICAgIC8vIEFmdGVyIHRyeWluZyB0aGlzLCB0aGF0IHNlZW1zIGxpa2UgYSBub24tc3RhcnRlclxuICAgIC8vIG9mIGEgcHJvamVjdCBpZGVhLlxuXG4gICAgLy8gI3BhdGhJbmRleGVzOiBzdHJpbmc7XG5cbiAgICAvLyBzZXQgcGF0aEluZGV4ZXMoaW5kZXhlcykgeyB0aGlzLiNwYXRoSW5kZXhlcyA9IGluZGV4ZXM7IH1cbiAgICAvLyBnZXQgcGF0aEluZGV4ZXMoKSAgICAgICAgeyByZXR1cm4gdGhpcy4jcGF0aEluZGV4ZXM7IH1cblxuICAgIC8vIHRhZ1BhZ2VVcmwoY29uZmlnLCB0YWdOYW1lKSB7XG4gICAgLy8gICAgIGlmICh0eXBlb2YgdGhpcy4jcGF0aEluZGV4ZXMgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmVycm9yKGBCdWlsdEluUGx1Z2luIHBhdGhJbmRleGVzIGhhcyBub3QgYmVlbiBzZXQgJHt1dGlsLmluc3BlY3QodGhpcy4jcGF0aEluZGV4ZXMpfWApO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGlmICh0aGlzLnBhdGhJbmRleGVzLmVuZHNXaXRoKCcvJykpIHtcbiAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLnBhdGhJbmRleGVzICsgdGFnMmVuY29kZTR1cmwodGFnTmFtZSkgKycuaHRtbCc7XG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5wYXRoSW5kZXhlcyArJy8nKyB0YWcyZW5jb2RlNHVybCh0YWdOYW1lKSArJy5odG1sJztcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFzeW5jIGRvVGFnc0ZvckRvY3VtZW50KGNvbmZpZywgbWV0YWRhdGEsIHRlbXBsYXRlKSB7XG4gICAgLy8gICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAvLyAgICAgY29uc3QgcGx1Z2luID0gdGhpcztcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkb1RhZ3NGb3JEb2N1bWVudCAnKyB1dGlsLmluc3BlY3QobWV0YWRhdGEpKTtcbiAgICAvLyAgICAgY29uc3QgdGFnbGlzdCA9IChcbiAgICAvLyAgICAgICAgICAgICAndGFncycgaW4gbWV0YWRhdGFcbiAgICAvLyAgICAgICAgICAgJiYgQXJyYXkuaXNBcnJheShtZXRhZGF0YS50YWdzKVxuICAgIC8vICAgICAgICAgKSA/IG1ldGFkYXRhLnRhZ3MgOiBbXTtcbiAgICAvLyAgICAgaWYgKHRhZ2xpc3QpIHtcbiAgICAvLyAgICAgICAgIGNvbnN0IHRhZ3psaXN0ID0gW107XG4gICAgLy8gICAgICAgICBmb3IgKGNvbnN0IHRhZyBvZiB0YWdsaXN0KSB7XG4gICAgLy8gICAgICAgICAgICAgdGFnemxpc3QucHVzaCh7XG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZyxcbiAgICAvLyAgICAgICAgICAgICAgICAgdGFnVXJsOiBwbHVnaW4udGFnUGFnZVVybChjb25maWcsIHRhZyksXG4gICAgLy8gICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhd2FpdCBkb2N1bWVudHMuZ2V0VGFnRGVzY3JpcHRpb24odGFnKVxuICAgIC8vICAgICAgICAgICAgIH0pO1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coJ2RvVGFnc0ZvckRvY3VtZW50ICcrIHV0aWwuaW5zcGVjdCh0YWdsaXN0KSk7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChjb25maWcsIHRlbXBsYXRlLCB7XG4gICAgLy8gICAgICAgICAgICAgdGFnejogdGFnemxpc3RcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9IGVsc2UgcmV0dXJuIFwiXCI7XG4gICAgLy8gfVxuXG4gICAgYXN5bmMgb25TaXRlUmVuZGVyZWQoY29uZmlnKSB7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIHdoaWxlIChBcnJheS5pc0FycmF5KHRoaXMuI3Jlc2l6ZV9xdWV1ZSlcbiAgICAgICAgICAgICYmIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5sZW5ndGggPiAwKSB7XG5cbiAgICAgICAgICAgIGxldCB0b3Jlc2l6ZSA9IHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wb3AoKTtcblxuICAgICAgICAgICAgbGV0IGltZzJyZXNpemU7XG4gICAgICAgICAgICBpZiAoIXBhdGguaXNBYnNvbHV0ZSh0b3Jlc2l6ZS5zcmMpKSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHBhdGgubm9ybWFsaXplKHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICB0b3Jlc2l6ZS5zcmNcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1nMnJlc2l6ZSA9IHRvcmVzaXplLnNyYztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHNyY2ZpbGUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBmb3VuZCA9IGF3YWl0IGFzc2V0cy5maW5kKGltZzJyZXNpemUpO1xuICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kLmZzcGF0aDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgICAgICBzcmNmaWxlID0gZm91bmQgPyBmb3VuZC5mc3BhdGggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXNyY2ZpbGUpIHRocm93IG5ldyBFcnJvcihgYWthc2hhY21zLWJ1aWx0aW46IERpZCBub3QgZmluZCBzb3VyY2UgZmlsZSBmb3IgaW1hZ2UgdG8gcmVzaXplICR7aW1nMnJlc2l6ZX1gKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgaW1nID0gYXdhaXQgc2hhcnAoc3JjZmlsZSk7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWQgPSBhd2FpdCBpbWcucmVzaXplKE51bWJlci5wYXJzZUludCh0b3Jlc2l6ZS5yZXNpemV3aWR0aCkpO1xuICAgICAgICAgICAgICAgIC8vIFdlIG5lZWQgdG8gY29tcHV0ZSB0aGUgY29ycmVjdCBkZXN0aW5hdGlvbiBwYXRoXG4gICAgICAgICAgICAgICAgLy8gZm9yIHRoZSByZXNpemVkIGltYWdlXG4gICAgICAgICAgICAgICAgbGV0IGltZ3RvcmVzaXplID0gdG9yZXNpemUucmVzaXpldG8gPyB0b3Jlc2l6ZS5yZXNpemV0byA6IGltZzJyZXNpemU7XG4gICAgICAgICAgICAgICAgbGV0IHJlc2l6ZWRlc3Q7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShpbWd0b3Jlc2l6ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihjb25maWcucmVuZGVyRGVzdGluYXRpb24sIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGZvciByZWxhdGl2ZSBpbWFnZSBwYXRocywgaGVuY2UgaXQgbmVlZHMgdG8gYmVcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVsYXRpdmUgdG8gdGhlIGRvY1BhdGhcbiAgICAgICAgICAgICAgICAgICAgcmVzaXplZGVzdCA9IHBhdGguam9pbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maWcucmVuZGVyRGVzdGluYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aC5kaXJuYW1lKHRvcmVzaXplLmRvY1BhdGgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZ3RvcmVzaXplKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgICAgICAgICAgICBhd2FpdCBmc3AubWtkaXIocGF0aC5kaXJuYW1lKHJlc2l6ZWRlc3QpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBhd2FpdCByZXNpemVkLnRvRmlsZShyZXNpemVkZXN0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGJ1aWx0LWluOiBJbWFnZSByZXNpemUgZmFpbGVkIGZvciAke3NyY2ZpbGV9ICh0b3Jlc2l6ZSAke3V0aWwuaW5zcGVjdCh0b3Jlc2l6ZSl9IGZvdW5kICR7dXRpbC5pbnNwZWN0KGZvdW5kKX0pIGJlY2F1c2UgJHtlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCBjb25zdCBtYWhhYmh1dGFBcnJheSA9IGZ1bmN0aW9uKFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIGNvbmZpZz86IENvbmZpZ3VyYXRpb24sXG4gICAgICAgICAgICBha2FzaGE/OiBhbnksXG4gICAgICAgICAgICBwbHVnaW4/OiBQbHVnaW5cbikge1xuICAgIGxldCByZXQgPSBuZXcgbWFoYWJodXRhLk1haGFmdW5jQXJyYXkocGx1Z2luTmFtZSwgb3B0aW9ucyk7XG4gICAgLy8gcmV0LmFkZE1haGFmdW5jKG5ldyBUYWdzRm9yRG9jdW1lbnRFbGVtZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFN0eWxlc2hlZXRzRWxlbWVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBIZWFkZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEZvb3RlckphdmFTY3JpcHQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW5zZXJ0VGVhc2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IENvZGVFbWJlZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBpbWcyZmlndXJlSW1hZ2UoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBEb2N1bWVudEdyb3VwKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNob3dDb250ZW50KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IFNlbGVjdEVsZW1lbnRzKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEFuY2hvckNsZWFudXAoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZExpbmtSZWxhdGl2aXplcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTY3JpcHRSZWxhdGl2aXplcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG5cbiAgICByZXQuYWRkRmluYWxNYWhhZnVuYyhuZXcgTXVuZ2VkQXR0clJlbW92ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBCbGFua0xpbmtEZWZhbmdlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG5cbiAgICByZXR1cm4gcmV0O1xufTtcblxuLy8gY2xhc3MgVGFnc0ZvckRvY3VtZW50RWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuLy8gICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGFncy1mb3ItZG9jdW1lbnRcIjsgfVxuLy8gICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuLy8gICAgICAgICBjb25zdCBwbHVnaW4gPSB0aGlzLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSk7XG4vLyAgICAgICAgIHJldHVybiBhd2FpdCBwbHVnaW4uZG9UYWdzRm9yRG9jdW1lbnQodGhpcy5jb25maWcsXG4vLyAgICAgICAgICAgICAgICAgbWV0YWRhdGEsIFwiYWtfZG9jdW1lbnRfdGFncy5odG1sLm5qa1wiKTtcbi8vICAgICB9XG4vLyB9XG5cbmZ1bmN0aW9uIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcbiAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEpfWApO1xuXG4gICAgdmFyIHNjcmlwdHM7XG4gICAgaWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMuY29uY2F0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cyA6IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coYGFrLXN0eWxlc2hlZXRzICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpfSAke3V0aWwuaW5zcGVjdChjb25maWcuc2NyaXB0cyl9ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXG4gICAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIG9wdGlvbnMnKTtcbiAgICBpZiAoIWNvbmZpZykgdGhyb3cgbmV3IEVycm9yKCdfZG9TdHlsZXNoZWV0cyBubyBjb25maWcnKTtcblxuICAgIHZhciByZXQgPSAnJztcbiAgICBpZiAodHlwZW9mIHNjcmlwdHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGZvciAodmFyIHN0eWxlIG9mIHNjcmlwdHMpIHtcblxuICAgICAgICAgICAgbGV0IHN0eWxlaHJlZiA9IHN0eWxlLmhyZWY7XG4gICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKHN0eWxlLmhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBwcm9jZXNzICR7c3R5bGVocmVmfWApO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcblxuICAgICAgICAgICAgICAgIC8vIFRoZSBiaXQgd2l0aCAnaHR0cDovL2V4YW1wbGUuY29tJyBtZWFucyB0aGVyZVxuICAgICAgICAgICAgICAgIC8vIHdvbid0IGJlIGFuIGV4Y2VwdGlvbiB0aHJvd24gZm9yIGEgbG9jYWwgVVJMLlxuICAgICAgICAgICAgICAgIC8vIEJ1dCwgaW4gc3VjaCBhIGNhc2UsIHVIcmVmLnBhdGhuYW1lIHdvdWxkXG4gICAgICAgICAgICAgICAgLy8gc3RhcnQgd2l0aCBhIHNsYXNoLiAgVGhlcmVmb3JlLCB0byBjb3JyZWN0bHlcbiAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbmUgaWYgdGhpcyBVUkwgaXMgYWJzb2x1dGUgd2UgbXVzdCBjaGVja1xuICAgICAgICAgICAgICAgIC8vIHdpdGggdGhlIG9yaWdpbmFsIFVSTCBzdHJpbmcsIHdoaWNoIGlzIGluXG4gICAgICAgICAgICAgICAgLy8gdGhlIHN0eWxlaHJlZiB2YXJpYWJsZS5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzXG4gICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzdHlsZWhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qIGlmICghbWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQWApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtZXRhZGF0YS5kb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBIERPQ1VNRU5UYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlQgUkVOREVSVE9gKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyByZWxhdGl2ZSgvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb30sICR7c3R5bGVocmVmfSkgPSAke3JlbGF0aXZlKCcvJyttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbywgc3R5bGVocmVmKX1gKVxuICAgICAgICAgICAgICAgICAgICB9ICovXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBhYnNvbHV0ZSBzdHlsZWhyZWYgJHtzdHlsZWhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlaHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkb1N0eWxlTWVkaWEgPSAobWVkaWEpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobWVkaWEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGBtZWRpYT1cIiR7ZW5jb2RlKG1lZGlhKX1cImBcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGxldCBodCA9IGA8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIiR7ZW5jb2RlKHN0eWxlaHJlZil9XCIgJHtkb1N0eWxlTWVkaWEoc3R5bGUubWVkaWEpfS8+YFxuICAgICAgICAgICAgcmV0ICs9IGh0O1xuXG4gICAgICAgICAgICAvLyBUaGUgaXNzdWUgd2l0aCB0aGlzIGFuZCBvdGhlciBpbnN0YW5jZXNcbiAgICAgICAgICAgIC8vIGlzIHRoYXQgdGhpcyB0ZW5kZWQgdG8gcmVzdWx0IGluXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gICA8aHRtbD48Ym9keT48bGluay4uPjwvYm9keT48L2h0bWw+XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gV2hlbiBpdCBuZWVkZWQgdG8ganVzdCBiZSB0aGUgPGxpbms+IHRhZy5cbiAgICAgICAgICAgIC8vIEluIG90aGVyIHdvcmRzLCBpdCB0cmllZCB0byBjcmVhdGUgYW4gZW50aXJlXG4gICAgICAgICAgICAvLyBIVE1MIGRvY3VtZW50LiAgV2hpbGUgdGhlcmUgd2FzIGEgd2F5IGFyb3VuZFxuICAgICAgICAgICAgLy8gdGhpcyAtICQoJ3NlbGVjdG9yJykucHJvcCgnb3V0ZXJIVE1MJylcbiAgICAgICAgICAgIC8vIFRoaXMgYWxzbyBzZWVtZWQgdG8gYmUgYW4gb3ZlcmhlYWRcbiAgICAgICAgICAgIC8vIHdlIGNhbiBhdm9pZC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBUaGUgcGF0dGVybiBpcyB0byB1c2UgVGVtcGxhdGUgU3RyaW5ncyB3aGlsZVxuICAgICAgICAgICAgLy8gYmVpbmcgY2FyZWZ1bCB0byBlbmNvZGUgdmFsdWVzIHNhZmVseSBmb3IgdXNlXG4gICAgICAgICAgICAvLyBpbiBhbiBhdHRyaWJ1dGUuICBUaGUgXCJlbmNvZGVcIiBmdW5jdGlvbiBkb2VzXG4gICAgICAgICAgICAvLyB0aGUgZW5jb2RpbmcuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9ha2FzaGFjbXMvYWthc2hhcmVuZGVyL2lzc3Vlcy80OVxuXG4gICAgICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZSgnPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCJcIi8+Jyk7XG4gICAgICAgICAgICAvLyAkKCdsaW5rJykuYXR0cignaHJlZicsIHN0eWxlaHJlZik7XG4gICAgICAgICAgICAvLyBpZiAoc3R5bGUubWVkaWEpIHtcbiAgICAgICAgICAgIC8vICAgICAkKCdsaW5rJykuYXR0cignbWVkaWEnLCBzdHlsZS5tZWRpYSk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAvLyByZXQgKz0gJC5odG1sKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzICR7cmV0fWApO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfZG9KYXZhU2NyaXB0cyhcbiAgICBtZXRhZGF0YSxcbiAgICBzY3JpcHRzOiBqYXZhU2NyaXB0SXRlbVtdLFxuICAgIG9wdGlvbnMsXG4gICAgY29uZmlnOiBDb25maWd1cmF0aW9uXG4pIHtcblx0dmFyIHJldCA9ICcnO1xuXHRpZiAoIXNjcmlwdHMpIHJldHVybiByZXQ7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb0phdmFTY3JpcHRzIG5vIGNvbmZpZycpO1xuXG4gICAgZm9yICh2YXIgc2NyaXB0IG9mIHNjcmlwdHMpIHtcblx0XHRpZiAoIXNjcmlwdC5ocmVmICYmICFzY3JpcHQuc2NyaXB0KSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE11c3Qgc3BlY2lmeSBlaXRoZXIgaHJlZiBvciBzY3JpcHQgaW4gJHt1dGlsLmluc3BlY3Qoc2NyaXB0KX1gKTtcblx0XHR9XG4gICAgICAgIGlmICghc2NyaXB0LnNjcmlwdCkgc2NyaXB0LnNjcmlwdCA9ICcnO1xuXG4gICAgICAgIGNvbnN0IGRvVHlwZSA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgdHlwZT1cIiR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRvSHJlZiA9IChocmVmKSA9PiB7XG4gICAgICAgICAgICBpZiAoaHJlZikge1xuICAgICAgICAgICAgICAgIGxldCBzY3JpcHRocmVmID0gaHJlZjtcbiAgICAgICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIGEgbG9jYWwgVVJMXG4gICAgICAgICAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rc1xuICAgICAgICAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoc2NyaXB0aHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNjcmlwdGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb0phdmFTY3JpcHRzIGFic29sdXRlIHNjcmlwdGhyZWYgJHtzY3JpcHRocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHJld3JvdGUgdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NyaXB0aHJlZiA9IG5ld0hyZWY7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBzcmM9XCIke2VuY29kZShzY3JpcHRocmVmKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IGh0ID0gYDxzY3JpcHQgJHtkb1R5cGUoc2NyaXB0LmxhbmcpfSAke2RvSHJlZihzY3JpcHQuaHJlZil9PiR7c2NyaXB0LnNjcmlwdH08L3NjcmlwdD5gO1xuICAgICAgICByZXQgKz0gaHQ7XG4gICAgfVxuXHRyZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0VG9wIDogdW5kZWZpbmVkO1xuXHR9XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KHNjcmlwdHMpfWApO1xuXHQvLyBjb25zb2xlLmxvZyhgX2RvSGVhZGVySmF2YVNjcmlwdCAke3V0aWwuaW5zcGVjdChjb25maWcuc2NyaXB0cyl9YCk7XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuZnVuY3Rpb24gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucywgY29uZmlnOiBDb25maWd1cmF0aW9uKSB7XG5cdHZhciBzY3JpcHRzO1xuXHRpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRCb3R0b20gIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbS5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzID8gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdEJvdHRvbSA6IHVuZGVmaW5lZDtcblx0fVxuXHRyZXR1cm4gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMsIGNvbmZpZyk7XG59XG5cbmNsYXNzIFN0eWxlc2hlZXRzRWxlbWVudCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXN0eWxlc2hlZXRzXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9ICBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTdHlsZXNoZWV0c0VsZW1lbnQgYCwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcblx0fVxufVxuXG5jbGFzcyBIZWFkZXJKYXZhU2NyaXB0IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstaGVhZGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbikge1xuXHRcdGxldCByZXQgPSBfZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEhlYWRlckphdmFTY3JpcHQgYCwgcmV0KTtcbiAgICAgICAgcmV0dXJuIHJldDtcblx0fVxufVxuXG5jbGFzcyBGb290ZXJKYXZhU2NyaXB0IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstZm9vdGVySmF2YVNjcmlwdFwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXHRcdHJldHVybiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcblx0fVxufVxuXG5jbGFzcyBIZWFkTGlua1JlbGF0aXZpemVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgaGVhZCBsaW5rXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgLy8gSXQncyBhIGxvY2FsIGxpbmtcbiAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIFNjcmlwdFJlbGF0aXZpemVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzY3JpcHRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVTY3JpcHRMaW5rcykgcmV0dXJuO1xuICAgICAgICBsZXQgaHJlZiA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuXG4gICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAvLyBUaGVyZSBpcyBhIGxpbmtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNsYXNzIEluc2VydFRlYXNlciBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXRlYXNlclwiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB0cnkge1xuXHRcdHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKHRoaXMuY29uZmlnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFrX3RlYXNlci5odG1sLm5qa1wiLCB7XG5cdFx0XHR0ZWFzZXI6IHR5cGVvZiBtZXRhZGF0YVtcImFrLXRlYXNlclwiXSAhPT0gXCJ1bmRlZmluZWRcIlxuXHRcdFx0XHQ/IG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdIDogbWV0YWRhdGEudGVhc2VyXG5cdFx0fSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEluc2VydFRlYXNlciBjYXVnaHQgZXJyb3IgYCwgZSk7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG5cdH1cbn1cblxuY2xhc3MgQWtCb2R5Q2xhc3NBZGQgZXh0ZW5kcyBQYWdlUHJvY2Vzc29yIHtcblx0YXN5bmMgcHJvY2VzcygkLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuXHRcdGlmICh0eXBlb2YgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT09ICd1bmRlZmluZWQnXG5cdFx0ICYmIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9ICcnXG5cdFx0ICYmICQoJ2h0bWwgYm9keScpLmdldCgwKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblx0XHRcdFx0aWYgKCEkKCdodG1sIGJvZHknKS5oYXNDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCkpIHtcblx0XHRcdFx0XHQkKCdodG1sIGJvZHknKS5hZGRDbGFzcyhtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzb2x2ZSh1bmRlZmluZWQpO1xuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHJldHVybiBQcm9taXNlLnJlc29sdmUoJycpO1xuXHR9XG59XG5cbmNsYXNzIENvZGVFbWJlZCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiY29kZS1lbWJlZFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYENvZGVFbWJlZCBwcm9jZXNzICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50LCBmYWxzZSwgMTApfWApO1xuXG4gICAgICAgIGNvbnN0IGZuID0gJGVsZW1lbnQuYXR0cignZmlsZS1uYW1lJyk7XG4gICAgICAgIGNvbnN0IGxhbmcgPSAkZWxlbWVudC5hdHRyKCdsYW5nJyk7XG4gICAgICAgIGNvbnN0IGlkID0gJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgICAgICBpZiAoIWZuIHx8IGZuID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RlLWVtYmVkIG11c3QgaGF2ZSBmaWxlLW5hbWUgYXJndW1lbnQsIGdvdCAke2ZufWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHR4dHBhdGg7XG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoZm4pKSB7XG4gICAgICAgICAgICB0eHRwYXRoID0gZm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0eHRwYXRoID0gcGF0aC5qb2luKHBhdGguZGlybmFtZShtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyksIGZuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgY29uc3QgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZCh0eHRwYXRoKTtcbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RlLWVtYmVkIGZpbGUtbmFtZSAke2ZufSBkb2VzIG5vdCByZWZlciB0byB1c2FibGUgZmlsZWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdHh0ID0gYXdhaXQgZnNwLnJlYWRGaWxlKGZvdW5kLmZzcGF0aCwgJ3V0ZjgnKTtcblxuICAgICAgICBjb25zdCBkb0xhbmcgPSAobGFuZykgPT4ge1xuICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGNsYXNzPVwiaGxqcyAke2VuY29kZShsYW5nKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnY2xhc3M9XCJobGpzXCInO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBkb0lEID0gKGlkKSA9PiB7XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYGlkPVwiJHtlbmNvZGUoaWQpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRvQ29kZSA9IChsYW5nLCBjb2RlKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZyAmJiBsYW5nICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0KGNvZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmdcbiAgICAgICAgICAgICAgICB9KS52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhsanMuaGlnaGxpZ2h0QXV0byhjb2RlKS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgcmV0ID0gYDxwcmUgJHtkb0lEKGlkKX0+PGNvZGUgJHtkb0xhbmcobGFuZyl9PiR7ZG9Db2RlKGxhbmcsIHR4dCl9PC9jb2RlPjwvcHJlPmA7XG4gICAgICAgIHJldHVybiByZXQ7XG5cbiAgICAgICAgLy8gbGV0ICQgPSBtYWhhYmh1dGEucGFyc2UoYDxwcmU+PGNvZGU+PC9jb2RlPjwvcHJlPmApO1xuICAgICAgICAvLyBpZiAobGFuZyAmJiBsYW5nICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFkZENsYXNzKGxhbmcpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vICQoJ2NvZGUnKS5hZGRDbGFzcygnaGxqcycpO1xuICAgICAgICAvLyBpZiAoaWQgJiYgaWQgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdwcmUnKS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBpZiAobGFuZyAmJiBsYW5nICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFwcGVuZChobGpzLmhpZ2hsaWdodCh0eHQsIHtcbiAgICAgICAgLy8gICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAvLyAgICAgfSkudmFsdWUpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgJCgnY29kZScpLmFwcGVuZChobGpzLmhpZ2hsaWdodEF1dG8odHh0KS52YWx1ZSk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gcmV0dXJuICQuaHRtbCgpO1xuICAgIH1cbn1cblxuY2xhc3MgRmlndXJlSW1hZ2UgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImZpZy1pbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19maWdpbWcuaHRtbC5uamsnO1xuICAgICAgICBjb25zdCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHRocm93IG5ldyBFcnJvcignZmlnLWltZyBtdXN0IHJlY2VpdmUgYW4gaHJlZicpO1xuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNhcHRpb24gPSAkZWxlbWVudC5odG1sKCk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgaW1nMmZpZ3VyZUltYWdlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBpbWdbZmlndXJlXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHksIGRvbmUpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJykgXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpXG4gICAgICAgICAgICAgICAgOiAgXCJha19maWdpbWcuaHRtbC5uamtcIjtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjbGF6eiA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzcmMgPSAkZWxlbWVudC5hdHRyKCdzcmMnKTtcbiAgICAgICAgY29uc3QgZGVzdCAgICA9ICRlbGVtZW50LmF0dHIoJ2Rlc3QnKTtcbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkZWxlbWVudC5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgY29uc3QgY29udGVudCA9ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHtcbiAgICAgICAgICAgIGlkLCBjbGF6eiwgc3R5bGUsIHdpZHRoLCBocmVmOiBzcmMsIGRlc3QsIHJlc2l6ZXdpZHRoLCByZXNpemV0byxcbiAgICAgICAgICAgIGNhcHRpb246IGNvbnRlbnRcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBJbWFnZVJld3JpdGVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcblxuICAgICAgICAvLyBXZSBvbmx5IGRvIHJld3JpdGVzIGZvciBsb2NhbCBpbWFnZXNcbiAgICAgICAgbGV0IHNyYyA9ICRsaW5rLmF0dHIoJ3NyYycpO1xuICAgICAgICAvLyBGb3IgbG9jYWwgVVJMcywgdGhpcyBuZXcgVVJMIGNhbGwgd2lsbFxuICAgICAgICAvLyBtYWtlIHVTcmMub3JpZ2luID09PSBodHRwOi8vZXhhbXBsZS5jb21cbiAgICAgICAgLy8gSGVuY2UsIGlmIHNvbWUgb3RoZXIgZG9tYWluIGFwcGVhcnNcbiAgICAgICAgLy8gdGhlbiB3ZSBrb253IGl0J3Mgbm90IGEgbG9jYWwgaW1hZ2UuXG4gICAgICAgIGNvbnN0IHVTcmMgPSBuZXcgVVJMKHNyYywgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICBpZiAodVNyYy5vcmlnaW4gIT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBBcmUgd2UgYXNrZWQgdG8gcmVzaXplIHRoZSBpbWFnZT9cbiAgICAgICAgY29uc3QgcmVzaXpld2lkdGggPSAkbGluay5hdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgY29uc3QgcmVzaXpldG8gPSAkbGluay5hdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChyZXNpemV3aWR0aCkge1xuICAgICAgICAgICAgLy8gQWRkIHRvIGEgcXVldWUgdGhhdCBpcyBydW4gYXQgdGhlIGVuZCBcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKVxuICAgICAgICAgICAgICAgIC5hZGRJbWFnZVRvUmVzaXplKHNyYywgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLCBtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbyk7XG5cbiAgICAgICAgICAgIGlmIChyZXNpemV0bykge1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIHJlc2l6ZXRvKTtcbiAgICAgICAgICAgICAgICBzcmMgPSByZXNpemV0bztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlc2UgYXJlIG5vIGxvbmdlciBuZWVkZWRcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGUgaWRlYSBoZXJlIGlzIGZvciBldmVyeSBsb2NhbCBpbWFnZSBzcmMgdG8gYmUgYSByZWxhdGl2ZSBVUkxcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShzcmMpKSB7XG4gICAgICAgICAgICBsZXQgbmV3U3JjID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIHNyYyk7XG4gICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCBuZXdTcmMpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEltYWdlUmV3cml0ZXIgYWJzb2x1dGUgaW1hZ2UgcGF0aCAke3NyY30gcmV3cm90ZSB0byAke25ld1NyY31gKTtcbiAgICAgICAgICAgIHNyYyA9IG5ld1NyYztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgfVxufVxuXG5jbGFzcyBEb2N1bWVudEdyb3VwIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJkb2N1bWVudC1ncm91cFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKTtcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCBtdXN0IGJlIGdpdmVuIGEgdGVtcGxhdGVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuXG4gICAgICAgIC8vIG1pbWU/XG5cbiAgICAgICAgLy8gV2hlbiB0aGUgcmVuZGVycy10by1odG1sIGF0dHJpYnV0ZSBpcyBhYnNlbnQsIGxlYXZlXG4gICAgICAgIC8vIHJlbmRlcnNUb0hUTUwgdW5kZWZpbmVkIHNvIHRoYXQgdGhlIHNlYXJjaCBkb2VzIG5vdCBmaWx0ZXJcbiAgICAgICAgLy8gb24gaXQuICBPbmx5IHdoZW4gdGhlIGF0dHJpYnV0ZSBpcyBleHBsaWNpdGx5IHByZXNlbnQgZG8gd2VcbiAgICAgICAgLy8gY29uc3RyYWluIHRoZSBzZWFyY2ggdG8gKG5vbi0pSFRNTCBkb2N1bWVudHMuXG4gICAgICAgIGNvbnN0IHJlbmRlcnNUb0hUTUxBdHRyID0gJGVsZW1lbnQuYXR0cigncmVuZGVycy10by1odG1sJyk7XG4gICAgICAgIGxldCByZW5kZXJzVG9IVE1MOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAodHlwZW9mIHJlbmRlcnNUb0hUTUxBdHRyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCA9IHJlbmRlcnNUb0hUTUxBdHRyICE9PSAnZmFsc2UnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJvb3RQYXRoID0gJGVsZW1lbnQuYXR0cigncm9vdC1wYXRoJyk7XG4gICAgICAgIGNvbnN0IHZwYXRoR2xvYiA9ICRlbGVtZW50LmF0dHIoJ3ZwYXRoLWdsb2InKTtcbiAgICAgICAgY29uc3QgcmVuZGVyR2xvYiA9ICRlbGVtZW50LmF0dHIoJ3JlbmRlci1nbG9iJyk7XG5cbiAgICAgICAgLy8gUGFyc2UgYW4gYXR0cmlidXRlIHRoYXQgbWF5IGhvbGQgZWl0aGVyIGEgc2luZ2xlIHZhbHVlIG9yIGFcbiAgICAgICAgLy8gbGlzdCBvZiB2YWx1ZXMsIGludG8gYW4gYXJyYXkgb2Ygc3RyaW5ncy4gIFJldHVybnMgdW5kZWZpbmVkXG4gICAgICAgIC8vIHdoZW4gdGhlIGF0dHJpYnV0ZSBpcyBhYnNlbnQgb3IgY29udGFpbnMgbm8gdXNhYmxlIHZhbHVlcywgc29cbiAgICAgICAgLy8gdGhhdCB0aGUgc2VhcmNoIGRvZXMgbm90IGZpbHRlciBvbiBpdC5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gQSB2YWx1ZSB3aG9zZSB0cmltbWVkIGZvcm0gYmVnaW5zIHdpdGggJ1snIGlzIHBhcnNlZCBhcyBhXG4gICAgICAgIC8vIEpTT04gYXJyYXksIGUuZy4gdGFnPSdbXCJUYWcxXCIsIFwiVGFnLXN0cmluZy0yXCJdJy4gIFRoaXMgaXNcbiAgICAgICAgLy8gdGhlIHJvYnVzdCB3YXkgdG8gZXhwcmVzcyBtdWx0aXBsZSB2YWx1ZXMgYmVjYXVzZSBKU09OXG4gICAgICAgIC8vIGhhbmRsZXMgdmFsdWVzIHRoYXQgdGhlbXNlbHZlcyBjb250YWluIGNvbW1hcywgc3BhY2VzLCBvclxuICAgICAgICAvLyBxdW90ZSBjaGFyYWN0ZXJzICh0YWdzIHN1Y2ggYXMgYFNvbWV0aGluZyBcInF1b3RlZFwiYCkuICBBbnlcbiAgICAgICAgLy8gb3RoZXIgdmFsdWUgaXMgdHJlYXRlZCBhcyBhIHNpbmdsZSBsaXRlcmFsIHN0cmluZywgc28gdGhlXG4gICAgICAgIC8vIGNvbW1vbiBjYXNlIHN0YXlzIHNpbXBsZSwgZS5nLiB0YWc9XCJUYWcxXCIuXG4gICAgICAgIGNvbnN0IGF0dHJMaXN0ID0gKG5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHwgdW5kZWZpbmVkID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gJGVsZW1lbnQuYXR0cihuYW1lKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgbGV0IGxpc3Q6IHN0cmluZ1tdO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWQuc3RhcnRzV2l0aCgnWycpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKHRyaW1tZWQpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCAke25hbWV9IGlzIG5vdCB2YWxpZCBKU09OOiAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocGFyc2VkKSkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRvY3VtZW50LWdyb3VwICR7bmFtZX0gSlNPTiBtdXN0IGJlIGFuIGFycmF5OiAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsaXN0ID0gcGFyc2VkLm1hcChpdGVtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCAke25hbWV9IGFycmF5IG11c3QgY29udGFpbiBvbmx5IHN0cmluZ3M6ICR7dmFsdWV9YCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udHJpbSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ID0gWyB0cmltbWVkIF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxpc3QgPSBsaXN0LmZpbHRlcihpdGVtID0+IGl0ZW0ubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICByZXR1cm4gbGlzdC5sZW5ndGggPiAwID8gbGlzdCA6IHVuZGVmaW5lZDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBFYWNoIG9mIHRoZXNlIGF0dHJpYnV0ZXMgYWNjZXB0cyBlaXRoZXIgYSBzaW5nbGUgdmFsdWUgb3IgYVxuICAgICAgICAvLyBKU09OIGFycmF5IG9mIHZhbHVlcywgc28gdGhhdCBhIGRvY3VtZW50IGdyb3VwIG1heSBtYXRjaFxuICAgICAgICAvLyBtdWx0aXBsZSBsYXlvdXRzLCBibG9ndGFncywgb3IgdGFncy5cbiAgICAgICAgY29uc3QgbGF5b3V0cyA9IGF0dHJMaXN0KCdsYXlvdXQnKTtcbiAgICAgICAgY29uc3QgYmxvZ3RhZ3MgPSBhdHRyTGlzdCgnYmxvZ3RhZycpO1xuICAgICAgICBjb25zdCB0YWdzID0gYXR0ckxpc3QoJ3RhZycpO1xuXG4gICAgICAgIGNvbnN0IHBhcmVudERpciA9ICRlbGVtZW50LmF0dHIoJ3BhcmVudC1kaXInKTtcbiAgICAgICAgY29uc3QgZGlybmFtZSA9ICRlbGVtZW50LmF0dHIoJ2Rpcm5hbWUnKTtcbiAgICAgICAgY29uc3Qgc2tpcEdsb2IgPSAkZWxlbWVudC5hdHRyKCdza2lwLWdsb2InKTtcbiAgICAgICAgY29uc3QgbGltaXQgPSAkZWxlbWVudC5hdHRyKCdsaW1pdCcpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAkZWxlbWVudC5hdHRyKCdvZmZzZXQnKTtcblxuICAgICAgICBjb25zdCBzb3J0QnkgPSAkZWxlbWVudC5hdHRyKCdzb3J0LWJ5Jyk7XG4gICAgICAgIGNvbnN0IHNvcnQgICA9ICRlbGVtZW50LmF0dHIoJ3NvcnQnKTtcblxuICAgICAgICBpZiAodHlwZW9mIHNvcnRCeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGlmICghc29ydEJ5Lm1hdGNoKC9eKHRpdGxlfHJlbmRlclBhdGh8dnBhdGh8cGFyZW50RGlyfHB1YmxpY2F0aW9uVGltZSkkLykpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50R3JvdXAgc29ydC1ieSBpbmNvcnJlY3QgJHtzb3J0Qnl9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc29ydEJ5RGVzY2VuZGluZyA9IGZhbHNlO1xuICAgICAgICBpZiAodHlwZW9mIHNvcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXNvcnQubWF0Y2goL14oZGVzY3xhc2MpJC8pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudEdyb3VwIHNvcnQgaW5jb3JyZWN0ICR7c29ydH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNvcnRCeURlc2NlbmRpbmcgPSBzb3J0ID09PSAnZGVzYyc7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbGltaXROdW06IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiBsaW1pdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGxpbWl0TnVtID0gTnVtYmVyLnBhcnNlSW50KGxpbWl0LCAxMCk7XG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKGxpbWl0TnVtKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRHcm91cCBsaW1pdCBpbmNvcnJlY3QgJHtsaW1pdH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvZmZzZXROdW06IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvZmZzZXROdW0gPSBOdW1iZXIucGFyc2VJbnQob2Zmc2V0LCAxMCk7XG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKG9mZnNldE51bSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50R3JvdXAgb2Zmc2V0IGluY29ycmVjdCAke29mZnNldH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0ge1xuICAgICAgICAgICAgcmVuZGVyc1RvSFRNTCxcbiAgICAgICAgICAgIHJvb3RQYXRoOiB0eXBlb2Ygcm9vdFBhdGggPT09ICdzdHJpbmcnID8gcm9vdFBhdGggOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBnbG9iOiB0eXBlb2YgdnBhdGhHbG9iID09PSAnc3RyaW5nJyA/IHZwYXRoR2xvYiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHJlbmRlcmdsb2I6IHR5cGVvZiByZW5kZXJHbG9iID09PSAnc3RyaW5nJyA/IHJlbmRlckdsb2IgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsYXlvdXRzLFxuICAgICAgICAgICAgLy8gVGhlIHNlYXJjaCBxdWVyeSBtYXRjaGVzIGFuIGFycmF5IG9mIGJsb2d0YWdzIHZpYSB0aGVcbiAgICAgICAgICAgIC8vIGBibG9ndGFnc2Agb3B0aW9uLCBhbmQgYSBzaW5nbGUgYmxvZ3RhZyB2aWEgYGJsb2d0YWdgLlxuICAgICAgICAgICAgYmxvZ3RhZ3MsXG4gICAgICAgICAgICB0YWc6IHRhZ3MsXG4gICAgICAgICAgICBwYXJlbnREaXI6IHR5cGVvZiBwYXJlbnREaXIgPT09ICdzdHJpbmcnID8gcGFyZW50RGlyIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZGlybmFtZTogdHlwZW9mIGRpcm5hbWUgPT09ICdzdHJpbmcnID8gZGlybmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHNraXBnbG9iOiB0eXBlb2Ygc2tpcEdsb2IgPT09ICdzdHJpbmcnID8gc2tpcEdsb2IgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBsaW1pdDogbGltaXROdW0sXG4gICAgICAgICAgICBvZmZzZXQ6IG9mZnNldE51bSxcbiAgICAgICAgICAgIHNvcnRCeSxcbiAgICAgICAgICAgIHNvcnRCeURlc2NlbmRpbmdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB3cmFwcGVyVG9wID0gYDxkaXZgXG4gICAgICAgICAgICArIGRvSFRNTEF0dHJpYnV0ZSgnaWQnLCBpZClcbiAgICAgICAgICAgICsgZG9IVE1MQXR0cmlidXRlKCdjbGFzcycsIGNsYXp6KVxuICAgICAgICAgICAgKyBkb0hUTUxBdHRyaWJ1dGUoJ3dpZHRoJywgd2lkdGgpXG4gICAgICAgICAgICArIGRvSFRNTEF0dHJpYnV0ZSgnc3R5bGUnLCBzdHlsZSlcbiAgICAgICAgICAgICsgYD5gO1xuICAgICAgICBjb25zdCB3cmFwcGVyQm90dG9tID0gJzwvZGl2Pic7XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZG9jdW1lbnRzLnNlYXJjaChzZWxlY3Rvcik7XG5cbiAgICAgICAgY29uc3QgZWxlbWVudHMgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuICAgICAgICBcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICBlbGVtZW50cy5wdXNoKGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCB7IGVudHJ5IH1cbiAgICAgICAgICAgICkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdyYXBwZXJUb3AgKyBlbGVtZW50cy5qb2luKCdcXG4nKSArIHdyYXBwZXJCb3R0b207XG5cbiAgICB9XG59XG5cbmNsYXNzIFNob3dDb250ZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGNvbnN0IGRvYzJyZWFkID0gcmVzb2x2ZVZwYXRoKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgsIGhyZWYpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2hvd0NvbnRlbnQgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSAke2RvYzJyZWFkfWApO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGRvYzJyZWFkKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0LCBjb250ZW50SW1hZ2UsXG4gICAgICAgICAgICBkb2N1bWVudDogZG9jXG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXQgPSBhd2FpdCB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwgZGF0YSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke2hyZWZ9ICR7dXRpbC5pbnNwZWN0KGRhdGEpfSA9PT4gJHtyZXR9YCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG4vKlxuXG5UaGlzIHdhcyBtb3ZlZCBpbnRvIE1haGFiaHV0YVxuXG4gY2xhc3MgUGFydGlhbCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJwYXJ0aWFsXCI7IH1cblx0cHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0Ly8gV2UgZGVmYXVsdCB0byBtYWtpbmcgcGFydGlhbCBzZXQgdGhlIGRpcnR5IGZsYWcuICBCdXQgYSB1c2VyXG5cdFx0Ly8gb2YgdGhlIHBhcnRpYWwgdGFnIGNhbiBjaG9vc2UgdG8gdGVsbCB1cyBpdCBpc24ndCBkaXJ0eS5cblx0XHQvLyBGb3IgZXhhbXBsZSwgaWYgdGhlIHBhcnRpYWwgb25seSBzdWJzdGl0dXRlcyBub3JtYWwgdGFnc1xuXHRcdC8vIHRoZXJlJ3Mgbm8gbmVlZCB0byBkbyB0aGUgZGlydHkgdGhpbmcuXG5cdFx0dmFyIGRvdGhlZGlydHl0aGluZyA9ICRlbGVtZW50LmF0dHIoJ2RpcnR5Jyk7XG5cdFx0aWYgKCFkb3RoZWRpcnR5dGhpbmcgfHwgZG90aGVkaXJ0eXRoaW5nLm1hdGNoKC90cnVlL2kpKSB7XG5cdFx0XHRkaXJ0eSgpO1xuXHRcdH1cblx0XHR2YXIgZm5hbWUgPSAkZWxlbWVudC5hdHRyKFwiZmlsZS1uYW1lXCIpO1xuXHRcdHZhciB0eHQgICA9ICRlbGVtZW50Lmh0bWwoKTtcblx0XHR2YXIgZCA9IHt9O1xuXHRcdGZvciAodmFyIG1wcm9wIGluIG1ldGFkYXRhKSB7IGRbbXByb3BdID0gbWV0YWRhdGFbbXByb3BdOyB9XG5cdFx0dmFyIGRhdGEgPSAkZWxlbWVudC5kYXRhKCk7XG5cdFx0Zm9yICh2YXIgZHByb3AgaW4gZGF0YSkgeyBkW2Rwcm9wXSA9IGRhdGFbZHByb3BdOyB9XG5cdFx0ZFtcInBhcnRpYWxCb2R5XCJdID0gdHh0O1xuXHRcdGxvZygncGFydGlhbCB0YWcgZm5hbWU9JysgZm5hbWUgKycgYXR0cnMgJysgdXRpbC5pbnNwZWN0KGRhdGEpKTtcblx0XHRyZXR1cm4gcmVuZGVyLnBhcnRpYWwodGhpcy5jb25maWcsIGZuYW1lLCBkKVxuXHRcdC50aGVuKGh0bWwgPT4geyByZXR1cm4gaHRtbDsgfSlcblx0XHQuY2F0Y2goZXJyID0+IHtcblx0XHRcdGVycm9yKG5ldyBFcnJvcihcIkZBSUwgcGFydGlhbCBmaWxlLW5hbWU9XCIrIGZuYW1lICtcIiBiZWNhdXNlIFwiKyBlcnIpKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZBSUwgcGFydGlhbCBmaWxlLW5hbWU9XCIrIGZuYW1lICtcIiBiZWNhdXNlIFwiKyBlcnIpO1xuXHRcdH0pO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cy5tYWhhYmh1dGEuYWRkTWFoYWZ1bmMobmV3IFBhcnRpYWwoKSk7ICovXG5cbi8vXG4vLyA8c2VsZWN0LWVsZW1lbnRzIGNsYXNzPVwiLi5cIiBpZD1cIi4uXCIgY291bnQ9XCJOXCI+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gICAgIDxlbGVtZW50PjwvZWxlbWVudD5cbi8vIDwvc2VsZWN0LWVsZW1lbnRzPlxuLy9cbmNsYXNzIFNlbGVjdEVsZW1lbnRzIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgbGV0IGNvdW50ID0gJGxpbmsuYXR0cignY291bnQnKVxuICAgICAgICAgICAgICAgICAgICA/IE51bWJlci5wYXJzZUludCgkbGluay5hdHRyKCdjb3VudCcpKVxuICAgICAgICAgICAgICAgICAgICA6IDE7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGxpbmsuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgPSAkbGluay5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCB0biAgICA9ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgPyAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgIDogJ2Rpdic7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSAkbGluay5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoOyBjb3VudCA+PSAxICYmIGNoaWxkcmVuLmxlbmd0aCA+PSAxOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IF9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKF9uKTtcbiAgICAgICAgICAgIGNvbnN0IGNob3NlbiA9ICQoY2hpbGRyZW5bX25dKS5odG1sKCk7XG4gICAgICAgICAgICBzZWxlY3RlZC5wdXNoKGNob3Nlbik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hvc2VuKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbltfbl07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91dWlkID0gdXVpZHYxKCk7XG4gICAgICAgICRsaW5rLnJlcGxhY2VXaXRoKGA8JHt0bn0gaWQ9JyR7X3V1aWR9Jz48LyR7dG59PmApO1xuICAgICAgICBjb25zdCAkbmV3SXRlbSA9ICQoYCR7dG59IyR7X3V1aWR9YCk7XG4gICAgICAgIGlmIChpZCkgJG5ld0l0ZW0uYXR0cignaWQnLCBpZCk7XG4gICAgICAgIGVsc2UgJG5ld0l0ZW0ucmVtb3ZlQXR0cignaWQnKTtcbiAgICAgICAgaWYgKGNsYXp6KSAkbmV3SXRlbS5hZGRDbGFzcyhjbGF6eik7XG4gICAgICAgIGZvciAobGV0IGNob3NlbiBvZiBzZWxlY3RlZCkge1xuICAgICAgICAgICAgJG5ld0l0ZW0uYXBwZW5kKGNob3Nlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5jbGFzcyBBbmNob3JDbGVhbnVwIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cblxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgaHJlZiAgICAgPSAkbGluay5hdHRyKCdocmVmJyk7XG4gICAgICAgIHZhciBsaW5rdGV4dCA9ICRsaW5rLnRleHQoKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7aHJlZn0gJHtsaW5rdGV4dH1gKTtcbiAgICAgICAgaWYgKGhyZWYgJiYgaHJlZiAhPT0gJyMnKSB7XG4gICAgICAgICAgICBjb25zdCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiAhPT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICBpZiAoIXVIcmVmLnBhdGhuYW1lKSByZXR1cm4gXCJva1wiO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBsb2NhbCAke2hyZWZ9ICR7bGlua3RleHR9IHVIcmVmICR7dUhyZWYucGF0aG5hbWV9YCk7XG5cbiAgICAgICAgICAgIC8qIGlmIChtZXRhZGF0YS5kb2N1bWVudC5wYXRoID09PSAnaW5kZXguaHRtbC5tZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gaHJlZiAke2hyZWZ9IHVIcmVmLnBhdGhuYW1lICR7dUhyZWYucGF0aG5hbWV9IHRoaXMuY29uZmlnLnJvb3RfdXJsICR7dGhpcy5jb25maWcucm9vdF91cmx9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJC5odG1sKCkpO1xuICAgICAgICAgICAgfSAqL1xuXG4gICAgICAgICAgICAvLyBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBkZXRlcm1pbmVkIHRoaXMgaXMgYSBsb2NhbCBocmVmLlxuICAgICAgICAgICAgLy8gRm9yIHJlZmVyZW5jZSB3ZSBuZWVkIHRoZSBhYnNvbHV0ZSBwYXRobmFtZSBvZiB0aGUgaHJlZiB3aXRoaW5cbiAgICAgICAgICAgIC8vIHRoZSBwcm9qZWN0LiAgRm9yIGV4YW1wbGUgdG8gcmV0cmlldmUgdGhlIHRpdGxlIHdoZW4gd2UncmUgZmlsbGluZ1xuICAgICAgICAgICAgLy8gaW4gZm9yIGFuIGVtcHR5IDxhPiB3ZSBuZWVkIHRoZSBhYnNvbHV0ZSBwYXRobmFtZS5cblxuICAgICAgICAgICAgLy8gTWFyayB0aGlzIGxpbmsgYXMgaGF2aW5nIGJlZW4gcHJvY2Vzc2VkLlxuICAgICAgICAgICAgLy8gVGhlIHB1cnBvc2UgaXMgaWYgTWFoYWJodXRhIHJ1bnMgbXVsdGlwbGUgcGFzc2VzLFxuICAgICAgICAgICAgLy8gdG8gbm90IHByb2Nlc3MgdGhlIGxpbmsgbXVsdGlwbGUgdGltZXMuXG4gICAgICAgICAgICAvLyBCZWZvcmUgYWRkaW5nIHRoaXMgLSB3ZSBzYXcgdGhpcyBNdW5nZXIgdGFrZSBhcyBtdWNoXG4gICAgICAgICAgICAvLyBhcyA4MDBtcyB0byBleGVjdXRlLCBmb3IgRVZFUlkgcGFzcyBtYWRlIGJ5IE1haGFiaHV0YS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBZGRpbmcgdGhpcyBhdHRyaWJ1dGUsIGFuZCBjaGVja2luZyBmb3IgaXQgaW4gdGhlIHNlbGVjdG9yLFxuICAgICAgICAgICAgLy8gbWVhbnMgd2Ugb25seSBwcm9jZXNzIHRoZSBsaW5rIG9uY2UuXG4gICAgICAgICAgICAkbGluay5hdHRyKCdtdW5nZWQnLCAneWVzJyk7XG5cbiAgICAgICAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSByZXNvbHZlVnBhdGgobWV0YWRhdGEuZG9jdW1lbnQucGF0aCwgaHJlZik7XG5cbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gZW5zdXJlIGFsbCBsb2NhbCBocmVmJ3MgYXJlIFxuICAgICAgICAgICAgLy8gZm9yIGEgcmVsYXRpdmUgcGF0aCByYXRoZXIgdGhhbiBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSB1c2UgdGhlIHJlbGF0aXZlIG1vZHVsZSB0byBjb21wdXRlIHRoZSByZWxhdGl2ZSBwYXRoXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgL2luZGV4Lmh0bWwgaW4ge1xuICAgICAgICAgICAgLy8gIGJhc2VkaXI6ICcvVm9sdW1lcy9FeHRyYS9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL3Rlc3QvZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICByZWxwYXRoOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sLm1kJyxcbiAgICAgICAgICAgIC8vICByZWxyZW5kZXI6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnLFxuICAgICAgICAgICAgLy8gIHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbmRlclRvOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sJ1xuICAgICAgICAgICAgLy8gfSB0byAuLi8uLi8uLi9pbmRleC5odG1sXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzXG4gICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vayB0byBzZWUgaWYgaXQncyBhbiBhc3NldCBmaWxlXG4gICAgICAgICAgICBsZXQgZm91bmRBc3NldDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgYXNzZXQgJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRBc3NldCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcblxuICAgICAgICAgICAgLy8gQXNrIHBsdWdpbnMgaWYgdGhlIGhyZWYgaXMgb2theVxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihhYnNvbHV0ZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgbGVnaXQgbG9jYWwgaHJlZiAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGxpbmsgaGFzIGEgYm9keSwgdGhlbiBkb24ndCBtb2RpZnkgaXRcbiAgICAgICAgICAgIGlmICgobGlua3RleHQgJiYgbGlua3RleHQubGVuZ3RoID4gMCAmJiBsaW5rdGV4dCAhPT0gYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHx8ICgkbGluay5jaGlsZHJlbigpLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgc2tpcHBpbmcgJHthYnNvbHV0ZVBhdGh9IHcvICR7dXRpbC5pbnNwZWN0KGxpbmt0ZXh0KX0gY2hpbGRyZW49ICR7JGxpbmsuY2hpbGRyZW4oKX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEb2VzIGl0IGV4aXN0IGluIGRvY3VtZW50cyBkaXI/XG4gICAgICAgICAgICBpZiAoYWJzb2x1dGVQYXRoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSAnL2luZGV4Lmh0bWwnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmRSZW5kZXJzVG8gJHthYnNvbHV0ZVBhdGh9ICR7dXRpbC5pbnNwZWN0KGZvdW5kKX1gKTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBhYnNvbHV0ZVBhdGggJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyc1RvICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgZGlyZWN0b3J5LCB0aGVyZSBtaWdodCBiZSAvcGF0aC90by9pbmRleC5odG1sIHNvIHdlIHRyeSBmb3IgdGhhdC5cbiAgICAgICAgICAgIC8vIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aCB3b3VsZCBmYWlsIG9uIGp1c3QgL3BhdGgvdG8gYnV0IHN1Y2NlZWRcbiAgICAgICAgICAgIC8vIG9uIC9wYXRoL3RvL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIGlmIChmb3VuZC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aC5qb2luKGFic29sdXRlUGF0aCwgXCJpbmRleC5odG1sXCIpKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBsb29rIGludG8gZmlsbGluZyBlbXB0aW5lc3Mgd2l0aCB0aXRsZVxuXG4gICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7ZG9jbWV0YS50aXRsZX1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7aHJlZn1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZFJlbmRlcmVyUGF0aCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLyogdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvY21ldGEgPSBhd2FpdCByZW5kZXJlci5tZXRhZGF0YShmb3VuZC5mb3VuZERpciwgZm91bmQuZm91bmRQYXRoV2l0aGluRGlyKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZXRyaWV2ZSBkb2N1bWVudCBtZXRhZGF0YSBmb3IgJHtmb3VuZC5mb3VuZERpcn0gJHtmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXJ9IGJlY2F1c2UgJHtlcnJ9YCk7XG4gICAgICAgICAgICAgICAgfSAqLS0vXG4gICAgICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgaWYgKCEkbGluay5hdHRyKCd0aXRsZScpICYmIGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmlzaGVkYCk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IERPTkUgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgYm90aGVyIHRocm93aW5nIGFuIGVycm9yLiAgSnVzdCBmaWxsIGl0IGluIHdpdGhcbiAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcuXG4gICAgICAgICAgICAgICAgJGxpbmsudGV4dChocmVmKTtcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaWxsIGluIGVtcHR5ICdhJyBlbGVtZW50IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gd2l0aCBocmVmICR7aHJlZn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vICBNQUhBRlVOQ1MgRk9SIEZJTkFMIFBBU1NcblxuLyoqXG4gKiBSZW1vdmVzIHRoZSA8Y29kZT5tdW5nZWQ9eWVzPC9jb2RlPiBhdHRyaWJ1dGUgdGhhdCBpcyBhZGRlZFxuICogYnkgPGNvZGU+QW5jaG9yQ2xlYW51cDwvY29kZT4uXG4gKi9cbmNsYXNzIE11bmdlZEF0dHJSZW1vdmVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ211bmdlZCcpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vKipcbiAqIEhhbmRsZXMgdGhlIHJlY29tbWVuZGF0aW9ucyBpbjpcbiAqIGh0dHBzOi8vamF2YXNjcmlwdC5wbGFpbmVuZ2xpc2guaW8vb25lLWxpbmUtb2YtaHRtbC10aGF0LW1ha2VzLWV4dGVybmFsLWxpbmtzLXNhZmVyLTk1ZmU0YmE2ZmYyOFxuICovXG5jbGFzcyBCbGFua0xpbmtEZWZhbmdlciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW3RhcmdldD1fYmxhbmtdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVt0YXJnZXQ9X2JsYW5rXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIHRoaXMuYWthc2hhLmxpbmtSZWxTZXRBdHRyKCRlbGVtZW50LCAnbm9vcGVuZXInLCB0cnVlKTtcbiAgICAgICAgdGhpcy5ha2FzaGEubGlua1JlbFNldEF0dHIoJGVsZW1lbnQsICdub3JlZmVycmVyJywgdHJ1ZSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGFuZ2VkIHJlbCBhdHRyIHRvICR7JGVsZW1lbnQuYXR0cigncmVsJyl9YCk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8gTnVuanVja3MgRXh0ZW5zaW9uc1xuXG4vLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2Z0b25pYy9udW5qdWNrcy1pbmNsdWRlLXdpdGgvdHJlZS9tYXN0ZXJcblxuY2xhc3Mgc3R5bGVzaGVldHNFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtzdHlsZXNoZWV0cycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHN0eWxlc2hlZXRzRXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBzdHlsZXNoZWV0c0V4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRhZyB0b2tlblxuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcblxuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYXJncyBhbmQgbW92ZSBhZnRlciB0aGUgYmxvY2sgZW5kLiBwYXNzaW5nIHRydWVcbiAgICAgICAgICAgIC8vIGFzIHRoZSBzZWNvbmQgYXJnIGlzIHJlcXVpcmVkIGlmIHRoZXJlIGFyZSBubyBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGJvZHkgYW5kIHBvc3NpYmx5IHRoZSBlcnJvciBibG9jaywgd2hpY2ggaXMgb3B0aW9uYWxcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrc3R5bGVzaGVldHMnKTtcblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHN0eWxlc2hlZXRzRXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb1N0eWxlc2hlZXRzKGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5jbGFzcyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2FraGVhZGVyanMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtoZWFkZXJqcycpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb0hlYWRlckphdmFTY3JpcHQoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtmb290ZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2Zvb3RlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvRm9vdGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdGVzdEV4dGVuc2lvbigpIHtcbiAgICB0aGlzLnRhZ3MgPSBbICdha25qa3Rlc3QnIF07XG5cbiAgICB0aGlzLnBhcnNlID0gZnVuY3Rpb24ocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbmNvbnNvbGUubG9nKGBpbiB0ZXN0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZXJyb3InLCAnZW5kYWtuamt0ZXN0Jyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JCb2R5ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYocGFyc2VyLnNraXBTeW1ib2woJ2Vycm9yJykpIHtcbiAgICAgICAgICAgICAgICBwYXJzZXIuc2tpcChsZXhlci5UT0tFTl9CTE9DS19FTkQpO1xuICAgICAgICAgICAgICAgIGVycm9yQm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keSwgZXJyb3JCb2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGVzdEV4dGlvbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHRoaXMucnVuID0gZnVuY3Rpb24oY29udGV4dCwgdXJsLCBib2R5LCBlcnJvckJvZHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCAke3V0aWwuaW5zcGVjdChjb250ZXh0KX0gJHt1dGlsLmluc3BlY3QodXJsKX0gJHt1dGlsLmluc3BlY3QoYm9keSl9ICR7dXRpbC5pbnNwZWN0KGVycm9yQm9keSl9YCk7XG4gICAgfTtcblxufVxuIl19