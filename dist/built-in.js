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
import { CustomElement, Munger, PageProcessor, resolveVpath } from './index.js';
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
        const doAttr = (name, value) => {
            return typeof value === 'string'
                ? ` ${name}="${encode(value)}"`
                : '';
        };
        const wrapperTop = `<div`
            + doAttr('id', id)
            + doAttr('class', clazz)
            + doAttr('width', width)
            + doAttr('style', style)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsWUFBWSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRS9HLE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDO0FBRXZDLE1BQU0sT0FBTyxhQUFjLFNBQVEsTUFBTTtJQUN4QztRQUNDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUtoQix3Q0FBUTtRQUNSLDhDQUFjO1FBTFYsdUJBQUEsSUFBSSwrQkFBaUIsRUFBRSxNQUFBLENBQUM7SUFFL0IsQ0FBQztJQUtELFNBQVMsQ0FBQyxNQUFxQixFQUFFLE9BQU87UUFDakMsdUJBQUEsSUFBSSx5QkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLE1B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QUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0lBR0YsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVILENBQUMsQ0FBQztBQUVOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IGZzcCBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB1cmwgZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgc2hhcnAgZnJvbSAnc2hhcnAnO1xuaW1wb3J0ICogYXMgdXVpZCBmcm9tICd1dWlkJztcbmNvbnN0IHV1aWR2MSA9IHV1aWQudjE7XG5pbXBvcnQgKiBhcyByZW5kZXIgZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuaW1wb3J0IHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcyc7XG5pbXBvcnQgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5pbXBvcnQgbWFoYU1ldGFkYXRhIGZyb20gJ21haGFiaHV0YS9tYWhhL21ldGFkYXRhLmpzJztcbmltcG9ydCBtYWhhUGFydGlhbCBmcm9tICdtYWhhYmh1dGEvbWFoYS9wYXJ0aWFsLmpzJztcbmltcG9ydCBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHtlbmNvZGV9IGZyb20gJ2h0bWwtZW50aXRpZXMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgQ3VzdG9tRWxlbWVudCwgTXVuZ2VyLCBQYWdlUHJvY2Vzc29yLCBqYXZhU2NyaXB0SXRlbSwgcmVzb2x2ZVZwYXRoIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5cbmNvbnN0IHBsdWdpbk5hbWUgPSBcImFrYXNoYWNtcy1idWlsdGluXCI7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdEluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIocGx1Z2luTmFtZSk7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZSA9IFtdO1xuXG5cdH1cblxuICAgICNjb25maWc7XG4gICAgI3Jlc2l6ZV9xdWV1ZTtcblxuXHRjb25maWd1cmUoY29uZmlnOiBDb25maWd1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtb2R1bGVEaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbiAgICAgICAgLy8gTmVlZCB0aGlzIGFzIHRoZSBwbGFjZSB0byBzdG9yZSBOdW5qdWNrcyBtYWNyb3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICBjb25maWcuYWRkTGF5b3V0c0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ2xheW91dHMnKSk7XG4gICAgICAgIGNvbmZpZy5hZGRQYXJ0aWFsc0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ3BhcnRpYWxzJykpO1xuICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gdGhlIENvbmZpZ3VyYXRpb24gY29uc3RydWN0b3IuICBUaGUgaWRlYSBpcyB0byBwdXRcbiAgICAgICAgLy8gbWFoYVBhcnRpYWwgYXMgdGhlIHZlcnkgZmlyc3QgTWFoYWZ1bmMgc28gdGhhdCBhbGxcbiAgICAgICAgLy8gUGFydGlhbCdzIGFyZSBoYW5kbGVkIGJlZm9yZSBhbnl0aGluZyBlbHNlLiAgVGhlIGlzc3VlIGNhdXNpbmdcbiAgICAgICAgLy8gdGhpcyBjaGFuZ2UgaXMgdGhlIE9wZW5HcmFwaFByb21vdGVJbWFnZXMgTWFoYWZ1bmMgaW5cbiAgICAgICAgLy8gYWthc2hhY2hzLWJhc2UgYW5kIHByb2Nlc3NpbmcgYW55IGltYWdlcyBicm91Z2h0IGluIGJ5IHBhcnRpYWxzLlxuICAgICAgICAvLyBFbnN1cmluZyB0aGUgcGFydGlhbCB0YWcgaXMgcHJvY2Vzc2VkIGJlZm9yZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzXG4gICAgICAgIC8vIG1lYW50IHN1Y2ggaW1hZ2VzIHdlcmUgcHJvcGVybHkgcHJvbW90ZWQuXG4gICAgICAgIC8vIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAvLyAgICAgcmVuZGVyUGFydGlhbDogb3B0aW9ucy5yZW5kZXJQYXJ0aWFsXG4gICAgICAgIC8vIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhTWV0YWRhdGEubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgLy8gRG8gbm90IHBhc3MgdGhpcyB0aHJvdWdoIHNvIHRoYXQgTWFoYWJodXRhIHdpbGwgbm90XG4gICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIGxpbmtzIHRvIHN1YmRpcmVjdG9yaWVzXG4gICAgICAgICAgICAvLyByb290X3VybDogY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICAvLyBUT0RPIGhvdyB0byBjb25maWd1cmUgdGhpc1xuICAgICAgICAgICAgLy8gc2l0ZW1hcF90aXRsZTogLi4uLj9cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFiaHV0YUFycmF5KG9wdGlvbnMsIGNvbmZpZywgdGhpcy5ha2FzaGEsIHRoaXMpKTtcblxuICAgICAgICBjb25zdCBuamsgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJOYW1lKCcuaHRtbC5uamsnKSBhcyBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICBuZXcgc3R5bGVzaGVldHNFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtoZWFkZXJqcycsXG4gICAgICAgICAgICBuZXcgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2Zvb3RlcmpzJyxcbiAgICAgICAgICAgIG5ldyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIGV4dGVuc2lvbnMgd2VyZSBpbnN0YWxsZWRcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgW1xuICAgICAgICAgICAgICAgICAgICAnYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICAgICAgICAgICdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FrZm9vdGVyanMnXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbihleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmUgLSBOSksgZG9lcyBub3QgaGF2ZSBleHRlbnNpb24gLSAke2V4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gdHJ5IHtcbiAgICAgICAgLy8gICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrbmprdGVzdCcsIG5ldyB0ZXN0RXh0ZW5zaW9uKCkpO1xuICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKCkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIFxuICAgICAgICAvLyBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oJ2FrbmprdGVzdCcpKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBha25qa3Rlc3QgZXh0ZW5zaW9uIG5vdCBhZGRlZD9gKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgZXhpc3RzYCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgLy8gZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG5cbiAgICBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8bGluaz4gdGFncyBpbiB0aGUgPGhlYWQ+IGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplSGVhZExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8c2NyaXB0PiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplU2NyaXB0TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPEE+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVCb2R5TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIGRvU3R5bGVzaGVldHMobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgYWRkSW1hZ2VUb1Jlc2l6ZShzcmM6IHN0cmluZywgcmVzaXpld2lkdGg6IG51bWJlciwgcmVzaXpldG86IHN0cmluZywgZG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGRJbWFnZVRvUmVzaXplICR7c3JjfSByZXNpemV3aWR0aCAke3Jlc2l6ZXdpZHRofSByZXNpemV0byAke3Jlc2l6ZXRvfWApXG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBzZWN0aW9uIHdhcyBhZGRlZCBpbiB0aGUgcG9zc2liaWxpdHkgb2ZcbiAgICAvLyBtb3ZpbmcgdGFnZ2VkLWNvbnRlbnQgaW50byB0aGUgY29yZS5cbiAgICAvLyBBZnRlciB0cnlpbmcgdGhpcywgdGhhdCBzZWVtcyBsaWtlIGEgbm9uLXN0YXJ0ZXJcbiAgICAvLyBvZiBhIHByb2plY3QgaWRlYS5cblxuICAgIC8vICNwYXRoSW5kZXhlczogc3RyaW5nO1xuXG4gICAgLy8gc2V0IHBhdGhJbmRleGVzKGluZGV4ZXMpIHsgdGhpcy4jcGF0aEluZGV4ZXMgPSBpbmRleGVzOyB9XG4gICAgLy8gZ2V0IHBhdGhJbmRleGVzKCkgICAgICAgIHsgcmV0dXJuIHRoaXMuI3BhdGhJbmRleGVzOyB9XG5cbiAgICAvLyB0YWdQYWdlVXJsKGNvbmZpZywgdGFnTmFtZSkge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHRoaXMuI3BhdGhJbmRleGVzICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcihgQnVpbHRJblBsdWdpbiBwYXRoSW5kZXhlcyBoYXMgbm90IGJlZW4gc2V0ICR7dXRpbC5pbnNwZWN0KHRoaXMuI3BhdGhJbmRleGVzKX1gKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBpZiAodGhpcy5wYXRoSW5kZXhlcy5lbmRzV2l0aCgnLycpKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5wYXRoSW5kZXhlcyArIHRhZzJlbmNvZGU0dXJsKHRhZ05hbWUpICsnLmh0bWwnO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucGF0aEluZGV4ZXMgKycvJysgdGFnMmVuY29kZTR1cmwodGFnTmFtZSkgKycuaHRtbCc7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhc3luYyBkb1RhZ3NGb3JEb2N1bWVudChjb25maWcsIG1ldGFkYXRhLCB0ZW1wbGF0ZSkge1xuICAgIC8vICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gICAgIGNvbnN0IHBsdWdpbiA9IHRoaXM7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnZG9UYWdzRm9yRG9jdW1lbnQgJysgdXRpbC5pbnNwZWN0KG1ldGFkYXRhKSk7XG4gICAgLy8gICAgIGNvbnN0IHRhZ2xpc3QgPSAoXG4gICAgLy8gICAgICAgICAgICAgJ3RhZ3MnIGluIG1ldGFkYXRhXG4gICAgLy8gICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkobWV0YWRhdGEudGFncylcbiAgICAvLyAgICAgICAgICkgPyBtZXRhZGF0YS50YWdzIDogW107XG4gICAgLy8gICAgIGlmICh0YWdsaXN0KSB7XG4gICAgLy8gICAgICAgICBjb25zdCB0YWd6bGlzdCA9IFtdO1xuICAgIC8vICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFnbGlzdCkge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3psaXN0LnB1c2goe1xuICAgIC8vICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ1VybDogcGx1Z2luLnRhZ1BhZ2VVcmwoY29uZmlnLCB0YWcpLFxuICAgIC8vICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYXdhaXQgZG9jdW1lbnRzLmdldFRhZ0Rlc2NyaXB0aW9uKHRhZylcbiAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkb1RhZ3NGb3JEb2N1bWVudCAnKyB1dGlsLmluc3BlY3QodGFnbGlzdCkpO1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3o6IHRhZ3psaXN0XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfSBlbHNlIHJldHVybiBcIlwiO1xuICAgIC8vIH1cblxuICAgIGFzeW5jIG9uU2l0ZVJlbmRlcmVkKGNvbmZpZykge1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICB3aGlsZSAoQXJyYXkuaXNBcnJheSh0aGlzLiNyZXNpemVfcXVldWUpXG4gICAgICAgICAgICAmJiB0aGlzLiNyZXNpemVfcXVldWUubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgICBsZXQgdG9yZXNpemUgPSB0aGlzLiNyZXNpemVfcXVldWUucG9wKCk7XG5cbiAgICAgICAgICAgIGxldCBpbWcycmVzaXplO1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodG9yZXNpemUuc3JjKSkge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgdG9yZXNpemUuc3JjXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSB0b3Jlc2l6ZS5zcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzcmNmaWxlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBhc3NldHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIHNyY2ZpbGUgPSBmb3VuZC5mc3BhdGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoaW1nMnJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kID8gZm91bmQuZnNwYXRoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzcmNmaWxlKSB0aHJvdyBuZXcgRXJyb3IoYGFrYXNoYWNtcy1idWlsdGluOiBEaWQgbm90IGZpbmQgc291cmNlIGZpbGUgZm9yIGltYWdlIHRvIHJlc2l6ZSAke2ltZzJyZXNpemV9YCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IGltZyA9IGF3YWl0IHNoYXJwKHNyY2ZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkID0gYXdhaXQgaW1nLnJlc2l6ZShOdW1iZXIucGFyc2VJbnQodG9yZXNpemUucmVzaXpld2lkdGgpKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNvbXB1dGUgdGhlIGNvcnJlY3QgZGVzdGluYXRpb24gcGF0aFxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgcmVzaXplZCBpbWFnZVxuICAgICAgICAgICAgICAgIGxldCBpbWd0b3Jlc2l6ZSA9IHRvcmVzaXplLnJlc2l6ZXRvID8gdG9yZXNpemUucmVzaXpldG8gOiBpbWcycmVzaXplO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkZXN0O1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaW1ndG9yZXNpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBmb3IgcmVsYXRpdmUgaW1hZ2UgcGF0aHMsIGhlbmNlIGl0IG5lZWRzIHRvIGJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBkb2NQYXRoXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZXNpemVkZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzaXplZC50b0ZpbGUocmVzaXplZGVzdCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBidWlsdC1pbjogSW1hZ2UgcmVzaXplIGZhaWxlZCBmb3IgJHtzcmNmaWxlfSAodG9yZXNpemUgJHt1dGlsLmluc3BlY3QodG9yZXNpemUpfSBmb3VuZCAke3V0aWwuaW5zcGVjdChmb3VuZCl9KSBiZWNhdXNlICR7ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5leHBvcnQgY29uc3QgbWFoYWJodXRhQXJyYXkgPSBmdW5jdGlvbihcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBjb25maWc/OiBDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgYWthc2hhPzogYW55LFxuICAgICAgICAgICAgcGx1Z2luPzogUGx1Z2luXG4pIHtcbiAgICBsZXQgcmV0ID0gbmV3IG1haGFiaHV0YS5NYWhhZnVuY0FycmF5KHBsdWdpbk5hbWUsIG9wdGlvbnMpO1xuICAgIC8vIHJldC5hZGRNYWhhZnVuYyhuZXcgVGFnc0ZvckRvY3VtZW50RWxlbWVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTdHlsZXNoZWV0c0VsZW1lbnQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZGVySmF2YVNjcmlwdChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGb290ZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEluc2VydFRlYXNlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBDb2RlRW1iZWQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgQWtCb2R5Q2xhc3NBZGQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgRmlndXJlSW1hZ2UoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgaW1nMmZpZ3VyZUltYWdlKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEltYWdlUmV3cml0ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgRG9jdW1lbnRHcm91cChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTaG93Q29udGVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTZWxlY3RFbGVtZW50cyhjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBbmNob3JDbGVhbnVwKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEhlYWRMaW5rUmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2NyaXB0UmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuXG4gICAgcmV0LmFkZEZpbmFsTWFoYWZ1bmMobmV3IE11bmdlZEF0dHJSZW1vdmVyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkRmluYWxNYWhhZnVuYyhuZXcgQmxhbmtMaW5rRGVmYW5nZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuXG4gICAgcmV0dXJuIHJldDtcbn07XG5cbi8vIGNsYXNzIFRhZ3NGb3JEb2N1bWVudEVsZW1lbnQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbi8vICAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLXRhZ3MtZm9yLWRvY3VtZW50XCI7IH1cbi8vICAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHksIGRvbmUpIHtcbi8vICAgICAgICAgY29uc3QgcGx1Z2luID0gdGhpcy5jb25maWcucGx1Z2luKHBsdWdpbk5hbWUpO1xuLy8gICAgICAgICByZXR1cm4gYXdhaXQgcGx1Z2luLmRvVGFnc0ZvckRvY3VtZW50KHRoaXMuY29uZmlnLFxuLy8gICAgICAgICAgICAgICAgIG1ldGFkYXRhLCBcImFrX2RvY3VtZW50X3RhZ3MuaHRtbC5uamtcIik7XG4vLyAgICAgfVxuLy8gfVxuXG5mdW5jdGlvbiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgb3B0aW9ucywgY29uZmlnOiBDb25maWd1cmF0aW9uKSB7XG4gICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhKX1gKTtcblxuICAgIHZhciBzY3JpcHRzO1xuICAgIGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgc2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzID8gY29uZmlnLnNjcmlwdHMuc3R5bGVzaGVldHMgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKGBhay1zdHlsZXNoZWV0cyAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkKX0gJHt1dGlsLmluc3BlY3QoY29uZmlnLnNjcmlwdHMpfSAke3V0aWwuaW5zcGVjdChzY3JpcHRzKX1gKTtcblxuICAgIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdfZG9TdHlsZXNoZWV0cyBubyBvcHRpb25zJyk7XG4gICAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvU3R5bGVzaGVldHMgbm8gY29uZmlnJyk7XG5cbiAgICB2YXIgcmV0ID0gJyc7XG4gICAgaWYgKHR5cGVvZiBzY3JpcHRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBmb3IgKHZhciBzdHlsZSBvZiBzY3JpcHRzKSB7XG5cbiAgICAgICAgICAgIGxldCBzdHlsZWhyZWYgPSBzdHlsZS5ocmVmO1xuICAgICAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChzdHlsZS5ocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgcHJvY2VzcyAke3N0eWxlaHJlZn1gKTtcbiAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIGxvY2FsIFVSTFxuICAgICAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG5cbiAgICAgICAgICAgICAgICAvLyBUaGUgYml0IHdpdGggJ2h0dHA6Ly9leGFtcGxlLmNvbScgbWVhbnMgdGhlcmVcbiAgICAgICAgICAgICAgICAvLyB3b24ndCBiZSBhbiBleGNlcHRpb24gdGhyb3duIGZvciBhIGxvY2FsIFVSTC5cbiAgICAgICAgICAgICAgICAvLyBCdXQsIGluIHN1Y2ggYSBjYXNlLCB1SHJlZi5wYXRobmFtZSB3b3VsZFxuICAgICAgICAgICAgICAgIC8vIHN0YXJ0IHdpdGggYSBzbGFzaC4gIFRoZXJlZm9yZSwgdG8gY29ycmVjdGx5XG4gICAgICAgICAgICAgICAgLy8gZGV0ZXJtaW5lIGlmIHRoaXMgVVJMIGlzIGFic29sdXRlIHdlIG11c3QgY2hlY2tcbiAgICAgICAgICAgICAgICAvLyB3aXRoIHRoZSBvcmlnaW5hbCBVUkwgc3RyaW5nLCB3aGljaCBpcyBpblxuICAgICAgICAgICAgICAgIC8vIHRoZSBzdHlsZWhyZWYgdmFyaWFibGUuXG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rc1xuICAgICAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoc3R5bGVocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAvKiBpZiAoIW1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEFgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVGApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFtZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBIERPQ1VNRU5UIFJFTkRFUlRPYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgcmVsYXRpdmUoLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99LCAke3N0eWxlaHJlZn0pID0gJHtyZWxhdGl2ZSgnLycrbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8sIHN0eWxlaHJlZil9YClcbiAgICAgICAgICAgICAgICAgICAgfSAqL1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBzdHlsZWhyZWYpO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgYWJzb2x1dGUgc3R5bGVocmVmICR7c3R5bGVocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHJld3JvdGUgdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgICAgICAgICBzdHlsZWhyZWYgPSBuZXdIcmVmO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZG9TdHlsZU1lZGlhID0gKG1lZGlhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG1lZGlhKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgbWVkaWE9XCIke2VuY29kZShtZWRpYSl9XCJgXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBsZXQgaHQgPSBgPGxpbmsgcmVsPVwic3R5bGVzaGVldFwiIHR5cGU9XCJ0ZXh0L2Nzc1wiIGhyZWY9XCIke2VuY29kZShzdHlsZWhyZWYpfVwiICR7ZG9TdHlsZU1lZGlhKHN0eWxlLm1lZGlhKX0vPmBcbiAgICAgICAgICAgIHJldCArPSBodDtcblxuICAgICAgICAgICAgLy8gVGhlIGlzc3VlIHdpdGggdGhpcyBhbmQgb3RoZXIgaW5zdGFuY2VzXG4gICAgICAgICAgICAvLyBpcyB0aGF0IHRoaXMgdGVuZGVkIHRvIHJlc3VsdCBpblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vICAgPGh0bWw+PGJvZHk+PGxpbmsuLj48L2JvZHk+PC9odG1sPlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFdoZW4gaXQgbmVlZGVkIHRvIGp1c3QgYmUgdGhlIDxsaW5rPiB0YWcuXG4gICAgICAgICAgICAvLyBJbiBvdGhlciB3b3JkcywgaXQgdHJpZWQgdG8gY3JlYXRlIGFuIGVudGlyZVxuICAgICAgICAgICAgLy8gSFRNTCBkb2N1bWVudC4gIFdoaWxlIHRoZXJlIHdhcyBhIHdheSBhcm91bmRcbiAgICAgICAgICAgIC8vIHRoaXMgLSAkKCdzZWxlY3RvcicpLnByb3AoJ291dGVySFRNTCcpXG4gICAgICAgICAgICAvLyBUaGlzIGFsc28gc2VlbWVkIHRvIGJlIGFuIG92ZXJoZWFkXG4gICAgICAgICAgICAvLyB3ZSBjYW4gYXZvaWQuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gVGhlIHBhdHRlcm4gaXMgdG8gdXNlIFRlbXBsYXRlIFN0cmluZ3Mgd2hpbGVcbiAgICAgICAgICAgIC8vIGJlaW5nIGNhcmVmdWwgdG8gZW5jb2RlIHZhbHVlcyBzYWZlbHkgZm9yIHVzZVxuICAgICAgICAgICAgLy8gaW4gYW4gYXR0cmlidXRlLiAgVGhlIFwiZW5jb2RlXCIgZnVuY3Rpb24gZG9lc1xuICAgICAgICAgICAgLy8gdGhlIGVuY29kaW5nLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYWthc2hhY21zL2FrYXNoYXJlbmRlci9pc3N1ZXMvNDlcblxuICAgICAgICAgICAgLy8gbGV0ICQgPSBtYWhhYmh1dGEucGFyc2UoJzxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiXCIvPicpO1xuICAgICAgICAgICAgLy8gJCgnbGluaycpLmF0dHIoJ2hyZWYnLCBzdHlsZWhyZWYpO1xuICAgICAgICAgICAgLy8gaWYgKHN0eWxlLm1lZGlhKSB7XG4gICAgICAgICAgICAvLyAgICAgJCgnbGluaycpLmF0dHIoJ21lZGlhJywgc3R5bGUubWVkaWEpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gcmV0ICs9ICQuaHRtbCgpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3JldH1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2RvSmF2YVNjcmlwdHMoXG4gICAgbWV0YWRhdGEsXG4gICAgc2NyaXB0czogamF2YVNjcmlwdEl0ZW1bXSxcbiAgICBvcHRpb25zLFxuICAgIGNvbmZpZzogQ29uZmlndXJhdGlvblxuKSB7XG5cdHZhciByZXQgPSAnJztcblx0aWYgKCFzY3JpcHRzKSByZXR1cm4gcmV0O1xuXG4gICAgaWYgKCFvcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoJ19kb0phdmFTY3JpcHRzIG5vIG9wdGlvbnMnKTtcbiAgICBpZiAoIWNvbmZpZykgdGhyb3cgbmV3IEVycm9yKCdfZG9KYXZhU2NyaXB0cyBubyBjb25maWcnKTtcblxuICAgIGZvciAodmFyIHNjcmlwdCBvZiBzY3JpcHRzKSB7XG5cdFx0aWYgKCFzY3JpcHQuaHJlZiAmJiAhc2NyaXB0LnNjcmlwdCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBNdXN0IHNwZWNpZnkgZWl0aGVyIGhyZWYgb3Igc2NyaXB0IGluICR7dXRpbC5pbnNwZWN0KHNjcmlwdCl9YCk7XG5cdFx0fVxuICAgICAgICBpZiAoIXNjcmlwdC5zY3JpcHQpIHNjcmlwdC5zY3JpcHQgPSAnJztcblxuICAgICAgICBjb25zdCBkb1R5cGUgPSAobGFuZykgPT4ge1xuICAgICAgICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYHR5cGU9XCIke2VuY29kZShsYW5nKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkb0hyZWYgPSAoaHJlZikgPT4ge1xuICAgICAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgICAgICBsZXQgc2NyaXB0aHJlZiA9IGhyZWY7XG4gICAgICAgICAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhIGxvY2FsIFVSTFxuICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3NcbiAgICAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHNjcmlwdGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBzY3JpcHRocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBfZG9KYXZhU2NyaXB0cyBhYnNvbHV0ZSBzY3JpcHRocmVmICR7c2NyaXB0aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcmlwdGhyZWYgPSBuZXdIcmVmO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgc3JjPVwiJHtlbmNvZGUoc2NyaXB0aHJlZil9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGxldCBodCA9IGA8c2NyaXB0ICR7ZG9UeXBlKHNjcmlwdC5sYW5nKX0gJHtkb0hyZWYoc2NyaXB0LmhyZWYpfT4ke3NjcmlwdC5zY3JpcHR9PC9zY3JpcHQ+YDtcbiAgICAgICAgcmV0ICs9IGh0O1xuICAgIH1cblx0cmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgb3B0aW9ucywgY29uZmlnOiBDb25maWd1cmF0aW9uKSB7XG5cdHZhciBzY3JpcHRzO1xuXHRpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3AgIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdFRvcC5jb25jYXQobWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZFRvcCk7XG5cdH0gZWxzZSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzID8gY29uZmlnLnNjcmlwdHMuamF2YVNjcmlwdFRvcCA6IHVuZGVmaW5lZDtcblx0fVxuXHQvLyBjb25zb2xlLmxvZyhgX2RvSGVhZGVySmF2YVNjcmlwdCAke3V0aWwuaW5zcGVjdChzY3JpcHRzKX1gKTtcblx0Ly8gY29uc29sZS5sb2coYF9kb0hlYWRlckphdmFTY3JpcHQgJHt1dGlsLmluc3BlY3QoY29uZmlnLnNjcmlwdHMpfWApO1xuXHRyZXR1cm4gX2RvSmF2YVNjcmlwdHMobWV0YWRhdGEsIHNjcmlwdHMsIG9wdGlvbnMsIGNvbmZpZyk7XG59XG5cbmZ1bmN0aW9uIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRCb3R0b20uY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRCb3R0b20pO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRCb3R0b20gOiB1bmRlZmluZWQ7XG5cdH1cblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zLCBjb25maWcpO1xufVxuXG5jbGFzcyBTdHlsZXNoZWV0c0VsZW1lbnQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1zdHlsZXNoZWV0c1wiOyB9XG5cdGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbikge1xuXHRcdGxldCByZXQgPSAgX2RvU3R5bGVzaGVldHMobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU3R5bGVzaGVldHNFbGVtZW50IGAsIHJldCk7XG4gICAgICAgIHJldHVybiByZXQ7XG5cdH1cbn1cblxuY2xhc3MgSGVhZGVySmF2YVNjcmlwdCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLWhlYWRlckphdmFTY3JpcHRcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pIHtcblx0XHRsZXQgcmV0ID0gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBIZWFkZXJKYXZhU2NyaXB0IGAsIHJldCk7XG4gICAgICAgIHJldHVybiByZXQ7XG5cdH1cbn1cblxuY2xhc3MgRm9vdGVySmF2YVNjcmlwdCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImFrLWZvb3RlckphdmFTY3JpcHRcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblx0XHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5hcnJheS5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG5cdH1cbn1cblxuY2xhc3MgSGVhZExpbmtSZWxhdGl2aXplciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGhlYWQgbGlua1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGhlYWQgbGlua1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcykgcmV0dXJuO1xuICAgICAgICBsZXQgaHJlZiA9ICRsaW5rLmF0dHIoJ2hyZWYnKTtcblxuICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiA9PT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgLy8gSXQncyBhbiBhYnNvbHV0ZSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBTY3JpcHRSZWxhdGl2aXplciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJzY3JpcHRcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICBpZiAoIXRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdzcmMnKTtcblxuICAgICAgICBpZiAoaHJlZikge1xuICAgICAgICAgICAgLy8gVGhlcmUgaXMgYSBsaW5rXG4gICAgICAgICAgICBsZXQgdUhyZWYgPSBuZXcgVVJMKGhyZWYsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAgICAgLy8gSXQncyBhIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgYW4gYWJzb2x1dGUgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3SHJlZik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5jbGFzcyBJbnNlcnRUZWFzZXIgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay10ZWFzZXJcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdHJ5IHtcblx0XHRyZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbCh0aGlzLmNvbmZpZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJha190ZWFzZXIuaHRtbC5uamtcIiwge1xuXHRcdFx0dGVhc2VyOiB0eXBlb2YgbWV0YWRhdGFbXCJhay10ZWFzZXJcIl0gIT09IFwidW5kZWZpbmVkXCJcblx0XHRcdFx0PyBtZXRhZGF0YVtcImFrLXRlYXNlclwiXSA6IG1ldGFkYXRhLnRlYXNlclxuXHRcdH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBJbnNlcnRUZWFzZXIgY2F1Z2h0IGVycm9yIGAsIGUpO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuXHR9XG59XG5cbmNsYXNzIEFrQm9keUNsYXNzQWRkIGV4dGVuZHMgUGFnZVByb2Nlc3NvciB7XG5cdGFzeW5jIHByb2Nlc3MoJCwgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcblx0XHRpZiAodHlwZW9mIG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkICE9PSAndW5kZWZpbmVkJ1xuXHRcdCAmJiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPSAnJ1xuXHRcdCAmJiAkKCdodG1sIGJvZHknKS5nZXQoMCkpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cdFx0XHRcdGlmICghJCgnaHRtbCBib2R5JykuaGFzQ2xhc3MobWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQpKSB7XG5cdFx0XHRcdFx0JCgnaHRtbCBib2R5JykuYWRkQ2xhc3MobWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc29sdmUodW5kZWZpbmVkKTtcblx0XHRcdH0pO1xuXHRcdH0gZWxzZSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCcnKTtcblx0fVxufVxuXG5jbGFzcyBDb2RlRW1iZWQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImNvZGUtZW1iZWRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBDb2RlRW1iZWQgcHJvY2VzcyAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCwgZmFsc2UsIDEwKX1gKTtcblxuICAgICAgICBjb25zdCBmbiA9ICRlbGVtZW50LmF0dHIoJ2ZpbGUtbmFtZScpO1xuICAgICAgICBjb25zdCBsYW5nID0gJGVsZW1lbnQuYXR0cignbGFuZycpO1xuICAgICAgICBjb25zdCBpZCA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG5cbiAgICAgICAgaWYgKCFmbiB8fCBmbiA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29kZS1lbWJlZCBtdXN0IGhhdmUgZmlsZS1uYW1lIGFyZ3VtZW50LCBnb3QgJHtmbn1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCB0eHRwYXRoO1xuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKGZuKSkge1xuICAgICAgICAgICAgdHh0cGF0aCA9IGZuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdHh0cGF0aCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUobWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pLCBmbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQodHh0cGF0aCk7XG4gICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY29kZS1lbWJlZCBmaWxlLW5hbWUgJHtmbn0gZG9lcyBub3QgcmVmZXIgdG8gdXNhYmxlIGZpbGVgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHR4dCA9IGF3YWl0IGZzcC5yZWFkRmlsZShmb3VuZC5mc3BhdGgsICd1dGY4Jyk7XG5cbiAgICAgICAgY29uc3QgZG9MYW5nID0gKGxhbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBjbGFzcz1cImhsanMgJHtlbmNvZGUobGFuZyl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2NsYXNzPVwiaGxqc1wiJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgZG9JRCA9IChpZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBpZD1cIiR7ZW5jb2RlKGlkKX1cImA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkb0NvZGUgPSAobGFuZywgY29kZSkgPT4ge1xuICAgICAgICAgICAgaWYgKGxhbmcgJiYgbGFuZyAhPSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBobGpzLmhpZ2hsaWdodChjb2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgICAgICAgICAgfSkudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBobGpzLmhpZ2hsaWdodEF1dG8oY29kZSkudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJldCA9IGA8cHJlICR7ZG9JRChpZCl9Pjxjb2RlICR7ZG9MYW5nKGxhbmcpfT4ke2RvQ29kZShsYW5nLCB0eHQpfTwvY29kZT48L3ByZT5gO1xuICAgICAgICByZXR1cm4gcmV0O1xuXG4gICAgICAgIC8vIGxldCAkID0gbWFoYWJodXRhLnBhcnNlKGA8cHJlPjxjb2RlPjwvY29kZT48L3ByZT5gKTtcbiAgICAgICAgLy8gaWYgKGxhbmcgJiYgbGFuZyAhPT0gJycpIHtcbiAgICAgICAgLy8gICAgICQoJ2NvZGUnKS5hZGRDbGFzcyhsYW5nKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyAkKCdjb2RlJykuYWRkQ2xhc3MoJ2hsanMnKTtcbiAgICAgICAgLy8gaWYgKGlkICYmIGlkICE9PSAnJykge1xuICAgICAgICAvLyAgICAgJCgncHJlJykuYXR0cignaWQnLCBpZCk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gaWYgKGxhbmcgJiYgbGFuZyAhPT0gJycpIHtcbiAgICAgICAgLy8gICAgICQoJ2NvZGUnKS5hcHBlbmQoaGxqcy5oaWdobGlnaHQodHh0LCB7XG4gICAgICAgIC8vICAgICAgICAgbGFuZ3VhZ2U6IGxhbmdcbiAgICAgICAgLy8gICAgIH0pLnZhbHVlKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgICQoJ2NvZGUnKS5hcHBlbmQoaGxqcy5oaWdobGlnaHRBdXRvKHR4dCkudmFsdWUpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHJldHVybiAkLmh0bWwoKTtcbiAgICB9XG59XG5cbmNsYXNzIEZpZ3VyZUltYWdlIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJmaWctaW1nXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKTtcbiAgICAgICAgaWYgKCF0ZW1wbGF0ZSkgdGVtcGxhdGUgPSAnYWtfZmlnaW1nLmh0bWwubmprJztcbiAgICAgICAgY29uc3QgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSB0aHJvdyBuZXcgRXJyb3IoJ2ZpZy1pbWcgbXVzdCByZWNlaXZlIGFuIGhyZWYnKTtcbiAgICAgICAgY29uc3QgY2xhenogICA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgICAgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjYXB0aW9uID0gJGVsZW1lbnQuaHRtbCgpO1xuICAgICAgICBjb25zdCB3aWR0aCAgID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgICA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCB7XG4gICAgICAgICAgICBocmVmLCBjbGF6eiwgaWQsIGNhcHRpb24sIHdpZHRoLCBzdHlsZSwgZGVzdFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIGltZzJmaWd1cmVJbWFnZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgaW1nW2ZpZ3VyZV0nOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5LCBkb25lKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgY29uc3QgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpIFxuICAgICAgICAgICAgICAgID8gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKVxuICAgICAgICAgICAgICAgIDogIFwiYWtfZmlnaW1nLmh0bWwubmprXCI7XG4gICAgICAgIGNvbnN0IGlkID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2xhenogPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBzdHlsZSA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3JjID0gJGVsZW1lbnQuYXR0cignc3JjJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXdpZHRoID0gJGVsZW1lbnQuYXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXRvID0gJGVsZW1lbnQuYXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSAkZWxlbWVudC5hdHRyKCdjYXB0aW9uJylcbiAgICAgICAgICAgICAgICA/ICRlbGVtZW50LmF0dHIoJ2NhcHRpb24nKVxuICAgICAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCB7XG4gICAgICAgICAgICBpZCwgY2xhenosIHN0eWxlLCB3aWR0aCwgaHJlZjogc3JjLCBkZXN0LCByZXNpemV3aWR0aCwgcmVzaXpldG8sXG4gICAgICAgICAgICBjYXB0aW9uOiBjb250ZW50XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuY2xhc3MgSW1hZ2VSZXdyaXRlciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgaW1nXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgYm9keSBpbWdcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG5cbiAgICAgICAgLy8gV2Ugb25seSBkbyByZXdyaXRlcyBmb3IgbG9jYWwgaW1hZ2VzXG4gICAgICAgIGxldCBzcmMgPSAkbGluay5hdHRyKCdzcmMnKTtcbiAgICAgICAgLy8gRm9yIGxvY2FsIFVSTHMsIHRoaXMgbmV3IFVSTCBjYWxsIHdpbGxcbiAgICAgICAgLy8gbWFrZSB1U3JjLm9yaWdpbiA9PT0gaHR0cDovL2V4YW1wbGUuY29tXG4gICAgICAgIC8vIEhlbmNlLCBpZiBzb21lIG90aGVyIGRvbWFpbiBhcHBlYXJzXG4gICAgICAgIC8vIHRoZW4gd2Uga29udyBpdCdzIG5vdCBhIGxvY2FsIGltYWdlLlxuICAgICAgICBjb25zdCB1U3JjID0gbmV3IFVSTChzcmMsICdodHRwOi8vZXhhbXBsZS5jb20nKTtcbiAgICAgICAgaWYgKHVTcmMub3JpZ2luICE9PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gQXJlIHdlIGFza2VkIHRvIHJlc2l6ZSB0aGUgaW1hZ2U/XG4gICAgICAgIGNvbnN0IHJlc2l6ZXdpZHRoID0gJGxpbmsuYXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgIGNvbnN0IHJlc2l6ZXRvID0gJGxpbmsuYXR0cigncmVzaXplLXRvJyk7XG4gICAgICAgIFxuICAgICAgICBpZiAocmVzaXpld2lkdGgpIHtcbiAgICAgICAgICAgIC8vIEFkZCB0byBhIHF1ZXVlIHRoYXQgaXMgcnVuIGF0IHRoZSBlbmQgXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5wbHVnaW4ocGx1Z2luTmFtZSlcbiAgICAgICAgICAgICAgICAuYWRkSW1hZ2VUb1Jlc2l6ZShzcmMsIHJlc2l6ZXdpZHRoLCByZXNpemV0bywgbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pO1xuXG4gICAgICAgICAgICBpZiAocmVzaXpldG8pIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdzcmMnLCByZXNpemV0byk7XG4gICAgICAgICAgICAgICAgc3JjID0gcmVzaXpldG87XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZXNlIGFyZSBubyBsb25nZXIgbmVlZGVkXG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtd2lkdGgnKTtcbiAgICAgICAgICAgICRsaW5rLnJlbW92ZUF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIGlkZWEgaGVyZSBpcyBmb3IgZXZlcnkgbG9jYWwgaW1hZ2Ugc3JjIHRvIGJlIGEgcmVsYXRpdmUgVVJMXG4gICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoc3JjKSkge1xuICAgICAgICAgICAgbGV0IG5ld1NyYyA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBzcmMpO1xuICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBJbWFnZVJld3JpdGVyIGFic29sdXRlIGltYWdlIHBhdGggJHtzcmN9IHJld3JvdGUgdG8gJHtuZXdTcmN9YCk7XG4gICAgICAgICAgICBzcmMgPSBuZXdTcmM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgIH1cbn1cblxuY2xhc3MgRG9jdW1lbnRHcm91cCBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiZG9jdW1lbnQtZ3JvdXBcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnQtZ3JvdXAgbXVzdCBiZSBnaXZlbiBhIHRlbXBsYXRlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjbGF6eiAgID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgICA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IHdpZHRoICAgPSAkZWxlbWVudC5hdHRyKCd3aWR0aCcpO1xuICAgICAgICBjb25zdCBzdHlsZSAgID0gJGVsZW1lbnQuYXR0cignc3R5bGUnKTtcblxuICAgICAgICAvLyBtaW1lP1xuXG4gICAgICAgIC8vIFdoZW4gdGhlIHJlbmRlcnMtdG8taHRtbCBhdHRyaWJ1dGUgaXMgYWJzZW50LCBsZWF2ZVxuICAgICAgICAvLyByZW5kZXJzVG9IVE1MIHVuZGVmaW5lZCBzbyB0aGF0IHRoZSBzZWFyY2ggZG9lcyBub3QgZmlsdGVyXG4gICAgICAgIC8vIG9uIGl0LiAgT25seSB3aGVuIHRoZSBhdHRyaWJ1dGUgaXMgZXhwbGljaXRseSBwcmVzZW50IGRvIHdlXG4gICAgICAgIC8vIGNvbnN0cmFpbiB0aGUgc2VhcmNoIHRvIChub24tKUhUTUwgZG9jdW1lbnRzLlxuICAgICAgICBjb25zdCByZW5kZXJzVG9IVE1MQXR0ciA9ICRlbGVtZW50LmF0dHIoJ3JlbmRlcnMtdG8taHRtbCcpO1xuICAgICAgICBsZXQgcmVuZGVyc1RvSFRNTDogYm9vbGVhbiB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHR5cGVvZiByZW5kZXJzVG9IVE1MQXR0ciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUwgPSByZW5kZXJzVG9IVE1MQXR0ciAhPT0gJ2ZhbHNlJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByb290UGF0aCA9ICRlbGVtZW50LmF0dHIoJ3Jvb3QtcGF0aCcpO1xuICAgICAgICBjb25zdCB2cGF0aEdsb2IgPSAkZWxlbWVudC5hdHRyKCd2cGF0aC1nbG9iJyk7XG4gICAgICAgIGNvbnN0IHJlbmRlckdsb2IgPSAkZWxlbWVudC5hdHRyKCdyZW5kZXItZ2xvYicpO1xuXG4gICAgICAgIC8vIFBhcnNlIGFuIGF0dHJpYnV0ZSB0aGF0IG1heSBob2xkIGVpdGhlciBhIHNpbmdsZSB2YWx1ZSBvciBhXG4gICAgICAgIC8vIGxpc3Qgb2YgdmFsdWVzLCBpbnRvIGFuIGFycmF5IG9mIHN0cmluZ3MuICBSZXR1cm5zIHVuZGVmaW5lZFxuICAgICAgICAvLyB3aGVuIHRoZSBhdHRyaWJ1dGUgaXMgYWJzZW50IG9yIGNvbnRhaW5zIG5vIHVzYWJsZSB2YWx1ZXMsIHNvXG4gICAgICAgIC8vIHRoYXQgdGhlIHNlYXJjaCBkb2VzIG5vdCBmaWx0ZXIgb24gaXQuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIEEgdmFsdWUgd2hvc2UgdHJpbW1lZCBmb3JtIGJlZ2lucyB3aXRoICdbJyBpcyBwYXJzZWQgYXMgYVxuICAgICAgICAvLyBKU09OIGFycmF5LCBlLmcuIHRhZz0nW1wiVGFnMVwiLCBcIlRhZy1zdHJpbmctMlwiXScuICBUaGlzIGlzXG4gICAgICAgIC8vIHRoZSByb2J1c3Qgd2F5IHRvIGV4cHJlc3MgbXVsdGlwbGUgdmFsdWVzIGJlY2F1c2UgSlNPTlxuICAgICAgICAvLyBoYW5kbGVzIHZhbHVlcyB0aGF0IHRoZW1zZWx2ZXMgY29udGFpbiBjb21tYXMsIHNwYWNlcywgb3JcbiAgICAgICAgLy8gcXVvdGUgY2hhcmFjdGVycyAodGFncyBzdWNoIGFzIGBTb21ldGhpbmcgXCJxdW90ZWRcImApLiAgQW55XG4gICAgICAgIC8vIG90aGVyIHZhbHVlIGlzIHRyZWF0ZWQgYXMgYSBzaW5nbGUgbGl0ZXJhbCBzdHJpbmcsIHNvIHRoZVxuICAgICAgICAvLyBjb21tb24gY2FzZSBzdGF5cyBzaW1wbGUsIGUuZy4gdGFnPVwiVGFnMVwiLlxuICAgICAgICBjb25zdCBhdHRyTGlzdCA9IChuYW1lOiBzdHJpbmcpOiBzdHJpbmdbXSB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9ICRlbGVtZW50LmF0dHIobmFtZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAodHJpbW1lZC5sZW5ndGggPT09IDApIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGxldCBsaXN0OiBzdHJpbmdbXTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkLnN0YXJ0c1dpdGgoJ1snKSkge1xuICAgICAgICAgICAgICAgIGxldCBwYXJzZWQ7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZSh0cmltbWVkKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnQtZ3JvdXAgJHtuYW1lfSBpcyBub3QgdmFsaWQgSlNPTjogJHt2YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBhcnNlZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBkb2N1bWVudC1ncm91cCAke25hbWV9IEpTT04gbXVzdCBiZSBhbiBhcnJheTogJHt2YWx1ZX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGlzdCA9IHBhcnNlZC5tYXAoaXRlbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZG9jdW1lbnQtZ3JvdXAgJHtuYW1lfSBhcnJheSBtdXN0IGNvbnRhaW4gb25seSBzdHJpbmdzOiAke3ZhbHVlfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnRyaW0oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdCA9IFsgdHJpbW1lZCBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsaXN0ID0gbGlzdC5maWx0ZXIoaXRlbSA9PiBpdGVtLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgcmV0dXJuIGxpc3QubGVuZ3RoID4gMCA/IGxpc3QgOiB1bmRlZmluZWQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRWFjaCBvZiB0aGVzZSBhdHRyaWJ1dGVzIGFjY2VwdHMgZWl0aGVyIGEgc2luZ2xlIHZhbHVlIG9yIGFcbiAgICAgICAgLy8gSlNPTiBhcnJheSBvZiB2YWx1ZXMsIHNvIHRoYXQgYSBkb2N1bWVudCBncm91cCBtYXkgbWF0Y2hcbiAgICAgICAgLy8gbXVsdGlwbGUgbGF5b3V0cywgYmxvZ3RhZ3MsIG9yIHRhZ3MuXG4gICAgICAgIGNvbnN0IGxheW91dHMgPSBhdHRyTGlzdCgnbGF5b3V0Jyk7XG4gICAgICAgIGNvbnN0IGJsb2d0YWdzID0gYXR0ckxpc3QoJ2Jsb2d0YWcnKTtcbiAgICAgICAgY29uc3QgdGFncyA9IGF0dHJMaXN0KCd0YWcnKTtcblxuICAgICAgICBjb25zdCBwYXJlbnREaXIgPSAkZWxlbWVudC5hdHRyKCdwYXJlbnQtZGlyJyk7XG4gICAgICAgIGNvbnN0IGRpcm5hbWUgPSAkZWxlbWVudC5hdHRyKCdkaXJuYW1lJyk7XG4gICAgICAgIGNvbnN0IHNraXBHbG9iID0gJGVsZW1lbnQuYXR0cignc2tpcC1nbG9iJyk7XG4gICAgICAgIGNvbnN0IGxpbWl0ID0gJGVsZW1lbnQuYXR0cignbGltaXQnKTtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gJGVsZW1lbnQuYXR0cignb2Zmc2V0Jyk7XG5cbiAgICAgICAgY29uc3Qgc29ydEJ5ID0gJGVsZW1lbnQuYXR0cignc29ydC1ieScpO1xuICAgICAgICBjb25zdCBzb3J0ICAgPSAkZWxlbWVudC5hdHRyKCdzb3J0Jyk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzb3J0QnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBpZiAoIXNvcnRCeS5tYXRjaCgvXih0aXRsZXxyZW5kZXJQYXRofHZwYXRofHBhcmVudERpcnxwdWJsaWNhdGlvblRpbWUpJC8pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudEdyb3VwIHNvcnQtYnkgaW5jb3JyZWN0ICR7c29ydEJ5fWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNvcnRCeURlc2NlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBzb3J0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgaWYgKCFzb3J0Lm1hdGNoKC9eKGRlc2N8YXNjKSQvKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRG9jdW1lbnRHcm91cCBzb3J0IGluY29ycmVjdCAke3NvcnR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzb3J0QnlEZXNjZW5kaW5nID0gc29ydCA9PT0gJ2Rlc2MnO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGxpbWl0TnVtOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh0eXBlb2YgbGltaXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBsaW1pdE51bSA9IE51bWJlci5wYXJzZUludChsaW1pdCwgMTApO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTihsaW1pdE51bSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYERvY3VtZW50R3JvdXAgbGltaXQgaW5jb3JyZWN0ICR7bGltaXR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb2Zmc2V0TnVtOiBudW1iZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb2Zmc2V0TnVtID0gTnVtYmVyLnBhcnNlSW50KG9mZnNldCwgMTApO1xuICAgICAgICAgICAgaWYgKE51bWJlci5pc05hTihvZmZzZXROdW0pKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEb2N1bWVudEdyb3VwIG9mZnNldCBpbmNvcnJlY3QgJHtvZmZzZXR9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHtcbiAgICAgICAgICAgIHJlbmRlcnNUb0hUTUwsXG4gICAgICAgICAgICByb290UGF0aDogdHlwZW9mIHJvb3RQYXRoID09PSAnc3RyaW5nJyA/IHJvb3RQYXRoIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgZ2xvYjogdHlwZW9mIHZwYXRoR2xvYiA9PT0gJ3N0cmluZycgPyB2cGF0aEdsb2IgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICByZW5kZXJnbG9iOiB0eXBlb2YgcmVuZGVyR2xvYiA9PT0gJ3N0cmluZycgPyByZW5kZXJHbG9iIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgbGF5b3V0cyxcbiAgICAgICAgICAgIC8vIFRoZSBzZWFyY2ggcXVlcnkgbWF0Y2hlcyBhbiBhcnJheSBvZiBibG9ndGFncyB2aWEgdGhlXG4gICAgICAgICAgICAvLyBgYmxvZ3RhZ3NgIG9wdGlvbiwgYW5kIGEgc2luZ2xlIGJsb2d0YWcgdmlhIGBibG9ndGFnYC5cbiAgICAgICAgICAgIGJsb2d0YWdzLFxuICAgICAgICAgICAgdGFnOiB0YWdzLFxuICAgICAgICAgICAgcGFyZW50RGlyOiB0eXBlb2YgcGFyZW50RGlyID09PSAnc3RyaW5nJyA/IHBhcmVudERpciA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGRpcm5hbWU6IHR5cGVvZiBkaXJuYW1lID09PSAnc3RyaW5nJyA/IGRpcm5hbWUgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBza2lwZ2xvYjogdHlwZW9mIHNraXBHbG9iID09PSAnc3RyaW5nJyA/IHNraXBHbG9iIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgbGltaXQ6IGxpbWl0TnVtLFxuICAgICAgICAgICAgb2Zmc2V0OiBvZmZzZXROdW0sXG4gICAgICAgICAgICBzb3J0QnksXG4gICAgICAgICAgICBzb3J0QnlEZXNjZW5kaW5nXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgZG9BdHRyID0gKG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICA/IGAgJHtuYW1lfT1cIiR7ZW5jb2RlKHZhbHVlKX1cImBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHdyYXBwZXJUb3AgPSBgPGRpdmBcbiAgICAgICAgICAgICsgZG9BdHRyKCdpZCcsIGlkKVxuICAgICAgICAgICAgKyBkb0F0dHIoJ2NsYXNzJywgY2xhenopXG4gICAgICAgICAgICArIGRvQXR0cignd2lkdGgnLCB3aWR0aClcbiAgICAgICAgICAgICsgZG9BdHRyKCdzdHlsZScsIHN0eWxlKVxuICAgICAgICAgICAgKyBgPmA7XG4gICAgICAgIGNvbnN0IHdyYXBwZXJCb3R0b20gPSAnPC9kaXY+JztcblxuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBkb2N1bWVudHMuc2VhcmNoKHNlbGVjdG9yKTtcblxuICAgICAgICBjb25zdCBlbGVtZW50cyA9IG5ldyBBcnJheTxzdHJpbmc+KCk7XG4gICAgICAgIFxuICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgIGVsZW1lbnRzLnB1c2goYXdhaXQgdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZywgdGVtcGxhdGUsIHsgZW50cnkgfVxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd3JhcHBlclRvcCArIGVsZW1lbnRzLmpvaW4oJ1xcbicpICsgd3JhcHBlckJvdHRvbTtcblxuICAgIH1cbn1cblxuY2xhc3MgU2hvd0NvbnRlbnQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNob3ctY29udGVudFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX3Nob3ctY29udGVudC5odG1sLm5qayc7XG4gICAgICAgIGxldCBocmVmICAgID0gJGVsZW1lbnQuYXR0cignaHJlZicpO1xuICAgICAgICBpZiAoIWhyZWYpIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ3Nob3ctY29udGVudCBtdXN0IHJlY2VpdmUgYW4gaHJlZicpKTtcbiAgICAgICAgY29uc3QgY2xhenogICA9ICRlbGVtZW50LmF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIGNvbnN0IGlkICAgICAgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCBjYXB0aW9uID0gJGVsZW1lbnQuaHRtbCgpO1xuICAgICAgICBjb25zdCB3aWR0aCAgID0gJGVsZW1lbnQuYXR0cignd2lkdGgnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgICA9ICRlbGVtZW50LmF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGNvbnN0IGRlc3QgICAgPSAkZWxlbWVudC5hdHRyKCdkZXN0Jyk7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRJbWFnZSA9ICRlbGVtZW50LmF0dHIoJ2NvbnRlbnQtaW1hZ2UnKTtcbiAgICAgICAgY29uc3QgZG9jMnJlYWQgPSByZXNvbHZlVnBhdGgobWV0YWRhdGEuZG9jdW1lbnQucGF0aCwgaHJlZik7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9ICR7ZG9jMnJlYWR9YCk7XG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgY29uc3QgZG9jID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoZG9jMnJlYWQpO1xuICAgICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3QsIGNvbnRlbnRJbWFnZSxcbiAgICAgICAgICAgIGRvY3VtZW50OiBkb2NcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJldCA9IGF3YWl0IHRoaXMuYWthc2hhLnBhcnRpYWwoXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcsIHRlbXBsYXRlLCBkYXRhKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFNob3dDb250ZW50ICR7aHJlZn0gJHt1dGlsLmluc3BlY3QoZGF0YSl9ID09PiAke3JldH1gKTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9XG59XG5cbi8qXG5cblRoaXMgd2FzIG1vdmVkIGludG8gTWFoYWJodXRhXG5cbiBjbGFzcyBQYXJ0aWFsIGV4dGVuZHMgbWFoYWJodXRhLkN1c3RvbUVsZW1lbnQge1xuXHRnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInBhcnRpYWxcIjsgfVxuXHRwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblx0XHQvLyBXZSBkZWZhdWx0IHRvIG1ha2luZyBwYXJ0aWFsIHNldCB0aGUgZGlydHkgZmxhZy4gIEJ1dCBhIHVzZXJcblx0XHQvLyBvZiB0aGUgcGFydGlhbCB0YWcgY2FuIGNob29zZSB0byB0ZWxsIHVzIGl0IGlzbid0IGRpcnR5LlxuXHRcdC8vIEZvciBleGFtcGxlLCBpZiB0aGUgcGFydGlhbCBvbmx5IHN1YnN0aXR1dGVzIG5vcm1hbCB0YWdzXG5cdFx0Ly8gdGhlcmUncyBubyBuZWVkIHRvIGRvIHRoZSBkaXJ0eSB0aGluZy5cblx0XHR2YXIgZG90aGVkaXJ0eXRoaW5nID0gJGVsZW1lbnQuYXR0cignZGlydHknKTtcblx0XHRpZiAoIWRvdGhlZGlydHl0aGluZyB8fCBkb3RoZWRpcnR5dGhpbmcubWF0Y2goL3RydWUvaSkpIHtcblx0XHRcdGRpcnR5KCk7XG5cdFx0fVxuXHRcdHZhciBmbmFtZSA9ICRlbGVtZW50LmF0dHIoXCJmaWxlLW5hbWVcIik7XG5cdFx0dmFyIHR4dCAgID0gJGVsZW1lbnQuaHRtbCgpO1xuXHRcdHZhciBkID0ge307XG5cdFx0Zm9yICh2YXIgbXByb3AgaW4gbWV0YWRhdGEpIHsgZFttcHJvcF0gPSBtZXRhZGF0YVttcHJvcF07IH1cblx0XHR2YXIgZGF0YSA9ICRlbGVtZW50LmRhdGEoKTtcblx0XHRmb3IgKHZhciBkcHJvcCBpbiBkYXRhKSB7IGRbZHByb3BdID0gZGF0YVtkcHJvcF07IH1cblx0XHRkW1wicGFydGlhbEJvZHlcIl0gPSB0eHQ7XG5cdFx0bG9nKCdwYXJ0aWFsIHRhZyBmbmFtZT0nKyBmbmFtZSArJyBhdHRycyAnKyB1dGlsLmluc3BlY3QoZGF0YSkpO1xuXHRcdHJldHVybiByZW5kZXIucGFydGlhbCh0aGlzLmNvbmZpZywgZm5hbWUsIGQpXG5cdFx0LnRoZW4oaHRtbCA9PiB7IHJldHVybiBodG1sOyB9KVxuXHRcdC5jYXRjaChlcnIgPT4ge1xuXHRcdFx0ZXJyb3IobmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycikpO1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRkFJTCBwYXJ0aWFsIGZpbGUtbmFtZT1cIisgZm5hbWUgK1wiIGJlY2F1c2UgXCIrIGVycik7XG5cdFx0fSk7XG5cdH1cbn1cbm1vZHVsZS5leHBvcnRzLm1haGFiaHV0YS5hZGRNYWhhZnVuYyhuZXcgUGFydGlhbCgpKTsgKi9cblxuLy9cbi8vIDxzZWxlY3QtZWxlbWVudHMgY2xhc3M9XCIuLlwiIGlkPVwiLi5cIiBjb3VudD1cIk5cIj5cbi8vICAgICA8ZWxlbWVudD48L2VsZW1lbnQ+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gPC9zZWxlY3QtZWxlbWVudHM+XG4vL1xuY2xhc3MgU2VsZWN0RWxlbWVudHMgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2VsZWN0LWVsZW1lbnRzXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG5cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICBsZXQgY291bnQgPSAkbGluay5hdHRyKCdjb3VudCcpXG4gICAgICAgICAgICAgICAgICAgID8gTnVtYmVyLnBhcnNlSW50KCRsaW5rLmF0dHIoJ2NvdW50JykpXG4gICAgICAgICAgICAgICAgICAgIDogMTtcbiAgICAgICAgY29uc3QgY2xhenogPSAkbGluay5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICA9ICRsaW5rLmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IHRuICAgID0gJGxpbmsuYXR0cigndGFnLW5hbWUnKVxuICAgICAgICAgICAgICAgICAgICA/ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgOiAnZGl2JztcblxuICAgICAgICBjb25zdCBjaGlsZHJlbiA9ICRsaW5rLmNoaWxkcmVuKCk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGVkID0gW107XG5cbiAgICAgICAgZm9yICg7IGNvdW50ID49IDEgJiYgY2hpbGRyZW4ubGVuZ3RoID49IDE7IGNvdW50LS0pIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgY29uc3QgX24gPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGlsZHJlbi5sZW5ndGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coX24pO1xuICAgICAgICAgICAgY29uc3QgY2hvc2VuID0gJChjaGlsZHJlbltfbl0pLmh0bWwoKTtcbiAgICAgICAgICAgIHNlbGVjdGVkLnB1c2goY2hvc2VuKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBTZWxlY3RFbGVtZW50cyBgLCBjaG9zZW4pO1xuICAgICAgICAgICAgZGVsZXRlIGNoaWxkcmVuW19uXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgX3V1aWQgPSB1dWlkdjEoKTtcbiAgICAgICAgJGxpbmsucmVwbGFjZVdpdGgoYDwke3RufSBpZD0nJHtfdXVpZH0nPjwvJHt0bn0+YCk7XG4gICAgICAgIGNvbnN0ICRuZXdJdGVtID0gJChgJHt0bn0jJHtfdXVpZH1gKTtcbiAgICAgICAgaWYgKGlkKSAkbmV3SXRlbS5hdHRyKCdpZCcsIGlkKTtcbiAgICAgICAgZWxzZSAkbmV3SXRlbS5yZW1vdmVBdHRyKCdpZCcpO1xuICAgICAgICBpZiAoY2xhenopICRuZXdJdGVtLmFkZENsYXNzKGNsYXp6KTtcbiAgICAgICAgZm9yIChsZXQgY2hvc2VuIG9mIHNlbGVjdGVkKSB7XG4gICAgICAgICAgICAkbmV3SXRlbS5hcHBlbmQoY2hvc2VuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbmNsYXNzIEFuY2hvckNsZWFudXAgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGFbbXVuZ2VkIT0neWVzJ11cIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGFbbXVuZ2VkIT0neWVzJ11cIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciBocmVmICAgICA9ICRsaW5rLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgdmFyIGxpbmt0ZXh0ID0gJGxpbmsudGV4dCgpO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGRvY3VtZW50cy5pc1JlYWR5KCk7XG4gICAgICAgIGNvbnN0IGFzc2V0cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5hc3NldHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgYXNzZXRzLmlzUmVhZHkoKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHtocmVmfSAke2xpbmt0ZXh0fWApO1xuICAgICAgICBpZiAoaHJlZiAmJiBocmVmICE9PSAnIycpIHtcbiAgICAgICAgICAgIGNvbnN0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luICE9PSAnaHR0cDovL2V4YW1wbGUuY29tJykgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIGlmICghdUhyZWYucGF0aG5hbWUpIHJldHVybiBcIm9rXCI7XG5cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGlzIGxvY2FsICR7aHJlZn0gJHtsaW5rdGV4dH0gdUhyZWYgJHt1SHJlZi5wYXRobmFtZX1gKTtcblxuICAgICAgICAgICAgLyogaWYgKG1ldGFkYXRhLmRvY3VtZW50LnBhdGggPT09ICdpbmRleC5odG1sLm1kJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIG1ldGFkYXRhLmRvY3VtZW50LnBhdGggJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBocmVmICR7aHJlZn0gdUhyZWYucGF0aG5hbWUgJHt1SHJlZi5wYXRobmFtZX0gdGhpcy5jb25maWcucm9vdF91cmwgJHt0aGlzLmNvbmZpZy5yb290X3VybH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygkLmh0bWwoKSk7XG4gICAgICAgICAgICB9ICovXG5cbiAgICAgICAgICAgIC8vIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgICAgICAvLyBXZSBoYXZlIGRldGVybWluZWQgdGhpcyBpcyBhIGxvY2FsIGhyZWYuXG4gICAgICAgICAgICAvLyBGb3IgcmVmZXJlbmNlIHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lIG9mIHRoZSBocmVmIHdpdGhpblxuICAgICAgICAgICAgLy8gdGhlIHByb2plY3QuICBGb3IgZXhhbXBsZSB0byByZXRyaWV2ZSB0aGUgdGl0bGUgd2hlbiB3ZSdyZSBmaWxsaW5nXG4gICAgICAgICAgICAvLyBpbiBmb3IgYW4gZW1wdHkgPGE+IHdlIG5lZWQgdGhlIGFic29sdXRlIHBhdGhuYW1lLlxuXG4gICAgICAgICAgICAvLyBNYXJrIHRoaXMgbGluayBhcyBoYXZpbmcgYmVlbiBwcm9jZXNzZWQuXG4gICAgICAgICAgICAvLyBUaGUgcHVycG9zZSBpcyBpZiBNYWhhYmh1dGEgcnVucyBtdWx0aXBsZSBwYXNzZXMsXG4gICAgICAgICAgICAvLyB0byBub3QgcHJvY2VzcyB0aGUgbGluayBtdWx0aXBsZSB0aW1lcy5cbiAgICAgICAgICAgIC8vIEJlZm9yZSBhZGRpbmcgdGhpcyAtIHdlIHNhdyB0aGlzIE11bmdlciB0YWtlIGFzIG11Y2hcbiAgICAgICAgICAgIC8vIGFzIDgwMG1zIHRvIGV4ZWN1dGUsIGZvciBFVkVSWSBwYXNzIG1hZGUgYnkgTWFoYWJodXRhLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFkZGluZyB0aGlzIGF0dHJpYnV0ZSwgYW5kIGNoZWNraW5nIGZvciBpdCBpbiB0aGUgc2VsZWN0b3IsXG4gICAgICAgICAgICAvLyBtZWFucyB3ZSBvbmx5IHByb2Nlc3MgdGhlIGxpbmsgb25jZS5cbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ211bmdlZCcsICd5ZXMnKTtcblxuICAgICAgICAgICAgbGV0IGFic29sdXRlUGF0aCA9IHJlc29sdmVWcGF0aChtZXRhZGF0YS5kb2N1bWVudC5wYXRoLCBocmVmKTtcblxuICAgICAgICAgICAgLy8gVGhlIGlkZWEgZm9yIHRoaXMgc2VjdGlvbiBpcyB0byBlbnN1cmUgYWxsIGxvY2FsIGhyZWYncyBhcmUgXG4gICAgICAgICAgICAvLyBmb3IgYSByZWxhdGl2ZSBwYXRoIHJhdGhlciB0aGFuIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIEhlbmNlIHdlIHVzZSB0aGUgcmVsYXRpdmUgbW9kdWxlIHRvIGNvbXB1dGUgdGhlIHJlbGF0aXZlIHBhdGhcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBFeGFtcGxlOlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAvaW5kZXguaHRtbCBpbiB7XG4gICAgICAgICAgICAvLyAgYmFzZWRpcjogJy9Wb2x1bWVzL0V4dHJhL2FrYXNoYXJlbmRlci9ha2FzaGFyZW5kZXIvdGVzdC9kb2N1bWVudHMnLFxuICAgICAgICAgICAgLy8gIHJlbHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbHJlbmRlcjogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbCcsXG4gICAgICAgICAgICAvLyAgcGF0aDogJ2hpZXIvZGlyMS9kaXIyL25lc3RlZC1hbmNob3IuaHRtbC5tZCcsXG4gICAgICAgICAgICAvLyAgcmVuZGVyVG86ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnXG4gICAgICAgICAgICAvLyB9IHRvIC4uLy4uLy4uL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIC8vXG5cbiAgICAgICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgICAgICBpZiAodGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3NcbiAgICAgICAgICAgICAmJiBwYXRoLmlzQWJzb2x1dGUoaHJlZikpIHtcbiAgICAgICAgICAgICAgICBsZXQgbmV3SHJlZiA9IHJlbGF0aXZlKGAvJHttZXRhZGF0YS5kb2N1bWVudC5yZW5kZXJUb31gLCBocmVmKTtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCdocmVmJywgbmV3SHJlZik7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZGUtYWJzb2x1dGUgaHJlZiAke2hyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gdG8gJHtuZXdIcmVmfWApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29rIHRvIHNlZSBpZiBpdCdzIGFuIGFzc2V0IGZpbGVcbiAgICAgICAgICAgIGxldCBmb3VuZEFzc2V0O1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gYXdhaXQgYXNzZXRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBmb3VuZEFzc2V0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvdW5kQXNzZXQpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBhc3NldCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZEFzc2V0ICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBBc2sgcGx1Z2lucyBpZiB0aGUgaHJlZiBpcyBva2F5XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcuYXNrUGx1Z2luc0xlZ2l0TG9jYWxIcmVmKGFic29sdXRlUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBsZWdpdCBsb2NhbCBocmVmICR7YWJzb2x1dGVQYXRofWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgbGluayBoYXMgYSBib2R5LCB0aGVuIGRvbid0IG1vZGlmeSBpdFxuICAgICAgICAgICAgaWYgKChsaW5rdGV4dCAmJiBsaW5rdGV4dC5sZW5ndGggPiAwICYmIGxpbmt0ZXh0ICE9PSBhYnNvbHV0ZVBhdGgpXG4gICAgICAgICAgICAgICAgfHwgKCRsaW5rLmNoaWxkcmVuKCkubGVuZ3RoID4gMCkpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBza2lwcGluZyAke2Fic29sdXRlUGF0aH0gdy8gJHt1dGlsLmluc3BlY3QobGlua3RleHQpfSBjaGlsZHJlbj0gJHskbGluay5jaGlsZHJlbigpfWApO1xuICAgICAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERvZXMgaXQgZXhpc3QgaW4gZG9jdW1lbnRzIGRpcj9cbiAgICAgICAgICAgIGlmIChhYnNvbHV0ZVBhdGggPT09ICcvJykge1xuICAgICAgICAgICAgICAgIGFic29sdXRlUGF0aCA9ICcvaW5kZXguaHRtbCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChhYnNvbHV0ZVBhdGgpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluZFJlbmRlcnNUbyAke2Fic29sdXRlUGF0aH0gJHt1dGlsLmluc3BlY3QoZm91bmQpfWApO1xuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBXQVJOSU5HOiBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9IGFic29sdXRlUGF0aCAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRSZW5kZXJzVG8gJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBkaXJlY3RvcnksIHRoZXJlIG1pZ2h0IGJlIC9wYXRoL3RvL2luZGV4Lmh0bWwgc28gd2UgdHJ5IGZvciB0aGF0LlxuICAgICAgICAgICAgLy8gVGhlIHByb2JsZW0gaXMgdGhhdCB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoIHdvdWxkIGZhaWwgb24ganVzdCAvcGF0aC90byBidXQgc3VjY2VlZFxuICAgICAgICAgICAgLy8gb24gL3BhdGgvdG8vaW5kZXguaHRtbFxuICAgICAgICAgICAgaWYgKGZvdW5kLmlzRGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgZm91bmQgPSBhd2FpdCBkb2N1bWVudHMuZmluZChwYXRoLmpvaW4oYWJzb2x1dGVQYXRoLCBcImluZGV4Lmh0bWxcIikpO1xuICAgICAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEaWQgbm90IGZpbmQgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZy5kb2N1bWVudERpcnMpfSBpbiAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgaW50byBmaWxsaW5nIGVtcHRpbmVzcyB3aXRoIHRpdGxlXG5cbiAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgIGlmICghJGxpbmsuYXR0cigndGl0bGUnKSAmJiBkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGNoYW5nZWQgbGluayB0ZXh0ICR7aHJlZn0gdG8gJHtkb2NtZXRhLnRpdGxlfWApO1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGNoYW5nZWQgbGluayB0ZXh0ICR7aHJlZn0gdG8gJHtocmVmfWApO1xuICAgICAgICAgICAgICAgICRsaW5rLnRleHQoaHJlZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICB2YXIgcmVuZGVyZXIgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJQYXRoKGZvdW5kLnZwYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyZXJQYXRoICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuICAgICAgICAgICAgaWYgKHJlbmRlcmVyICYmIHJlbmRlcmVyLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGRvY21ldGEgPSBmb3VuZC5kb2NNZXRhZGF0YTtcbiAgICAgICAgICAgICAgICAvKiB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jbWV0YSA9IGF3YWl0IHJlbmRlcmVyLm1ldGFkYXRhKGZvdW5kLmZvdW5kRGlyLCBmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXIpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2goZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJldHJpZXZlIGRvY3VtZW50IG1ldGFkYXRhIGZvciAke2ZvdW5kLmZvdW5kRGlyfSAke2ZvdW5kLmZvdW5kUGF0aFdpdGhpbkRpcn0gYmVjYXVzZSAke2Vycn1gKTtcbiAgICAgICAgICAgICAgICB9ICotLS9cbiAgICAgICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IGFkZCBhIHRpdGxlPSBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3RpdGxlJywgZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgJGxpbmsudGV4dChkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgZmluaXNoZWRgKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gRE9ORSAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBib3RoZXIgdGhyb3dpbmcgYW4gZXJyb3IuICBKdXN0IGZpbGwgaXQgaW4gd2l0aFxuICAgICAgICAgICAgICAgIC8vIHNvbWV0aGluZy5cbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IGZpbGwgaW4gZW1wdHkgJ2EnIGVsZW1lbnQgaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSB3aXRoIGhyZWYgJHtocmVmfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgKi9cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8gIE1BSEFGVU5DUyBGT1IgRklOQUwgUEFTU1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIDxjb2RlPm11bmdlZD15ZXM8L2NvZGU+IGF0dHJpYnV0ZSB0aGF0IGlzIGFkZGVkXG4gKiBieSA8Y29kZT5BbmNob3JDbGVhbnVwPC9jb2RlPi5cbiAqL1xuY2xhc3MgTXVuZ2VkQXR0clJlbW92ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVttdW5nZWRdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgJGVsZW1lbnQucmVtb3ZlQXR0cignbXVuZ2VkJyk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cbi8qKlxuICogSGFuZGxlcyB0aGUgcmVjb21tZW5kYXRpb25zIGluOlxuICogaHR0cHM6Ly9qYXZhc2NyaXB0LnBsYWluZW5nbGlzaC5pby9vbmUtbGluZS1vZi1odG1sLXRoYXQtbWFrZXMtZXh0ZXJuYWwtbGlua3Mtc2FmZXItOTVmZTRiYTZmZjI4XG4gKi9cbmNsYXNzIEJsYW5rTGlua0RlZmFuZ2VyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbdGFyZ2V0PV9ibGFua10nOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW3RhcmdldD1fYmxhbmtdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGVsZW1lbnQsIG1ldGFkYXRhLCBzZXREaXJ0eTogRnVuY3Rpb24sIGRvbmU/OiBGdW5jdGlvbik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCRlbGVtZW50KTtcbiAgICAgICAgdGhpcy5ha2FzaGEubGlua1JlbFNldEF0dHIoJGVsZW1lbnQsICdub29wZW5lcicsIHRydWUpO1xuICAgICAgICB0aGlzLmFrYXNoYS5saW5rUmVsU2V0QXR0cigkZWxlbWVudCwgJ25vcmVmZXJyZXInLCB0cnVlKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYENoYW5nZWQgcmVsIGF0dHIgdG8gJHskZWxlbWVudC5hdHRyKCdyZWwnKX1gKTtcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLyBOdW5qdWNrcyBFeHRlbnNpb25zXG5cbi8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL3NvZnRvbmljL251bmp1Y2tzLWluY2x1ZGUtd2l0aC90cmVlL21hc3RlclxuXG5jbGFzcyBzdHlsZXNoZWV0c0V4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha3N0eWxlc2hlZXRzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIHN0eWxlc2hlZXRzRXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtzdHlsZXNoZWV0cycpO1xuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgc3R5bGVzaGVldHNFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBzdHlsZXNoZWV0c0V4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvU3R5bGVzaGVldHMoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtoZWFkZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2hlYWRlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvSGVhZGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuY2xhc3MgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiB7XG4gICAgdGFncztcbiAgICBjb25maWc7XG4gICAgcGx1Z2luO1xuICAgIG5qa1JlbmRlcmVyO1xuICAgIGNvbnN0cnVjdG9yKGNvbmZpZywgcGx1Z2luLCBuamtSZW5kZXJlcikge1xuICAgICAgICB0aGlzLnRhZ3MgPSBbICdha2Zvb3RlcmpzJyBdO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgICAgIHRoaXMubmprUmVuZGVyZXIgPSBuamtSZW5kZXJlcjtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdCh0aGlzLnRhZ3MpfSAke3V0aWwuaW5zcGVjdCh0aGlzLmNvbmZpZyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMucGx1Z2luKX1gKTtcbiAgICB9XG5cbiAgICBwYXJzZShwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgaW4gZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrZm9vdGVyanMnKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCgpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJ1bihjb250ZXh0LCBhcmdzLCBib2R5KSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfWApO1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVnaW4uZG9Gb290ZXJKYXZhU2NyaXB0KGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiB0ZXN0RXh0ZW5zaW9uKCkge1xuICAgIHRoaXMudGFncyA9IFsgJ2FrbmprdGVzdCcgXTtcblxuICAgIHRoaXMucGFyc2UgPSBmdW5jdGlvbihwYXJzZXIsIG5vZGVzLCBsZXhlcikge1xuY29uc29sZS5sb2coYGluIHRlc3RFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gZ2V0IHRoZSB0YWcgdG9rZW5cbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG5cblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGFyZ3MgYW5kIG1vdmUgYWZ0ZXIgdGhlIGJsb2NrIGVuZC4gcGFzc2luZyB0cnVlXG4gICAgICAgICAgICAvLyBhcyB0aGUgc2Vjb25kIGFyZyBpcyByZXF1aXJlZCBpZiB0aGVyZSBhcmUgbm8gcGFyZW50aGVzZXNcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBib2R5IGFuZCBwb3NzaWJseSB0aGUgZXJyb3IgYmxvY2ssIHdoaWNoIGlzIG9wdGlvbmFsXG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlcnJvcicsICdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIHZhciBlcnJvckJvZHkgPSBudWxsO1xuXG4gICAgICAgICAgICBpZihwYXJzZXIuc2tpcFN5bWJvbCgnZXJyb3InKSkge1xuICAgICAgICAgICAgICAgIHBhcnNlci5za2lwKGxleGVyLlRPS0VOX0JMT0NLX0VORCk7XG4gICAgICAgICAgICAgICAgZXJyb3JCb2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrbmprdGVzdCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcblxuICAgICAgICAgICAgLy8gU2VlIGFib3ZlIGZvciBub3RlcyBhYm91dCBDYWxsRXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5LCBlcnJvckJvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGB0ZXN0RXh0aW9uc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgdGhpcy5ydW4gPSBmdW5jdGlvbihjb250ZXh0LCB1cmwsIGJvZHksIGVycm9yQm9keSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgYWtuamt0ZXN0ICR7dXRpbC5pbnNwZWN0KGNvbnRleHQpfSAke3V0aWwuaW5zcGVjdCh1cmwpfSAke3V0aWwuaW5zcGVjdChib2R5KX0gJHt1dGlsLmluc3BlY3QoZXJyb3JCb2R5KX1gKTtcbiAgICB9O1xuXG59XG4iXX0=