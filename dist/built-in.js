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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbHQtaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9saWIvYnVpbHQtaW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBaUJHOzs7Ozs7Ozs7Ozs7O0FBRUgsT0FBTyxHQUFHLE1BQU0sa0JBQWtCLENBQUM7QUFFbkMsT0FBTyxJQUFJLE1BQU0sV0FBVyxDQUFDO0FBQzdCLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEtBQUssTUFBTSxPQUFPLENBQUM7QUFDMUIsT0FBTyxLQUFLLElBQUksTUFBTSxNQUFNLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztBQUV2QixPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUNoQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxTQUFTLE1BQU0sV0FBVyxDQUFDO0FBQ2xDLE9BQU8sWUFBWSxNQUFNLDRCQUE0QixDQUFDO0FBR3RELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDckMsT0FBTyxFQUFpQixhQUFhLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBa0IsWUFBWSxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRS9HLE1BQU0sVUFBVSxHQUFHLG1CQUFtQixDQUFDO0FBRXZDLE1BQU0sT0FBTyxhQUFjLFNBQVEsTUFBTTtJQUN4QztRQUNDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUtoQix3Q0FBUTtRQUNSLDhDQUFjO1FBTFYsdUJBQUEsSUFBSSwrQkFBaUIsRUFBRSxNQUFBLENBQUM7SUFFL0IsQ0FBQztJQUtELFNBQVMsQ0FBQyxNQUFxQixFQUFFLE9BQU87UUFDakMsdUJBQUEsSUFBSSx5QkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLE1B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QUFDO1lBRUQsTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFFOUIsMENBQTBDO1lBQzFDLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDekUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxDQUFDO0lBQ0wsQ0FBQyxDQUFDO0lBR0YsSUFBSSxDQUFDLEdBQUcsR0FBRyxVQUFTLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVM7UUFDN0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzVILENBQUMsQ0FBQztBQUVOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IGZzcCBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB1cmwgZnJvbSAnbm9kZTp1cmwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB1dGlsIGZyb20gJ25vZGU6dXRpbCc7XG5pbXBvcnQgc2hhcnAgZnJvbSAnc2hhcnAnO1xuaW1wb3J0ICogYXMgdXVpZCBmcm9tICd1dWlkJztcbmNvbnN0IHV1aWR2MSA9IHV1aWQudjE7XG5pbXBvcnQgKiBhcyByZW5kZXIgZnJvbSAnLi9yZW5kZXIuanMnO1xuaW1wb3J0IHsgUGx1Z2luIH0gZnJvbSAnLi9QbHVnaW4uanMnO1xuaW1wb3J0IHJlbGF0aXZlIGZyb20gJ3JlbGF0aXZlJztcbmltcG9ydCBobGpzIGZyb20gJ2hpZ2hsaWdodC5qcyc7XG5pbXBvcnQgbWFoYWJodXRhIGZyb20gJ21haGFiaHV0YSc7XG5pbXBvcnQgbWFoYU1ldGFkYXRhIGZyb20gJ21haGFiaHV0YS9tYWhhL21ldGFkYXRhLmpzJztcbmltcG9ydCBtYWhhUGFydGlhbCBmcm9tICdtYWhhYmh1dGEvbWFoYS9wYXJ0aWFsLmpzJztcbmltcG9ydCBSZW5kZXJlcnMgZnJvbSAnQGFrYXNoYWNtcy9yZW5kZXJlcnMnO1xuaW1wb3J0IHtlbmNvZGV9IGZyb20gJ2h0bWwtZW50aXRpZXMnO1xuaW1wb3J0IHsgQ29uZmlndXJhdGlvbiwgQ3VzdG9tRWxlbWVudCwgTXVuZ2VyLCBQYWdlUHJvY2Vzc29yLCBqYXZhU2NyaXB0SXRlbSwgcmVzb2x2ZVZwYXRoIH0gZnJvbSAnLi9pbmRleC5qcyc7XG5cbmNvbnN0IHBsdWdpbk5hbWUgPSBcImFrYXNoYWNtcy1idWlsdGluXCI7XG5cbmV4cG9ydCBjbGFzcyBCdWlsdEluUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIocGx1Z2luTmFtZSk7XG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZSA9IFtdO1xuXG5cdH1cblxuICAgICNjb25maWc7XG4gICAgI3Jlc2l6ZV9xdWV1ZTtcblxuXHRjb25maWd1cmUoY29uZmlnOiBDb25maWd1cmF0aW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuI2NvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgLy8gdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMuYWthc2hhID0gY29uZmlnLmFrYXNoYTtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucyA/IG9wdGlvbnMgOiB7fTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplSGVhZExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLnJlbGF0aXZpemVCb2R5TGlua3MgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtb2R1bGVEaXJuYW1lID0gaW1wb3J0Lm1ldGEuZGlybmFtZTtcbiAgICAgICAgLy8gTmVlZCB0aGlzIGFzIHRoZSBwbGFjZSB0byBzdG9yZSBOdW5qdWNrcyBtYWNyb3MgYW5kIHRlbXBsYXRlc1xuICAgICAgICBjb25maWcuYWRkTGF5b3V0c0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ2xheW91dHMnKSk7XG4gICAgICAgIGNvbmZpZy5hZGRQYXJ0aWFsc0RpcihwYXRoLmpvaW4obW9kdWxlRGlybmFtZSwgJy4uJywgJ3BhcnRpYWxzJykpO1xuICAgICAgICAvLyBEbyBub3QgbmVlZCB0aGlzIGhlcmUgYW55IGxvbmdlciBiZWNhdXNlIGl0IGlzIGhhbmRsZWRcbiAgICAgICAgLy8gaW4gdGhlIENvbmZpZ3VyYXRpb24gY29uc3RydWN0b3IuICBUaGUgaWRlYSBpcyB0byBwdXRcbiAgICAgICAgLy8gbWFoYVBhcnRpYWwgYXMgdGhlIHZlcnkgZmlyc3QgTWFoYWZ1bmMgc28gdGhhdCBhbGxcbiAgICAgICAgLy8gUGFydGlhbCdzIGFyZSBoYW5kbGVkIGJlZm9yZSBhbnl0aGluZyBlbHNlLiAgVGhlIGlzc3VlIGNhdXNpbmdcbiAgICAgICAgLy8gdGhpcyBjaGFuZ2UgaXMgdGhlIE9wZW5HcmFwaFByb21vdGVJbWFnZXMgTWFoYWZ1bmMgaW5cbiAgICAgICAgLy8gYWthc2hhY2hzLWJhc2UgYW5kIHByb2Nlc3NpbmcgYW55IGltYWdlcyBicm91Z2h0IGluIGJ5IHBhcnRpYWxzLlxuICAgICAgICAvLyBFbnN1cmluZyB0aGUgcGFydGlhbCB0YWcgaXMgcHJvY2Vzc2VkIGJlZm9yZSBPcGVuR3JhcGhQcm9tb3RlSW1hZ2VzXG4gICAgICAgIC8vIG1lYW50IHN1Y2ggaW1hZ2VzIHdlcmUgcHJvcGVybHkgcHJvbW90ZWQuXG4gICAgICAgIC8vIGNvbmZpZy5hZGRNYWhhYmh1dGEobWFoYVBhcnRpYWwubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAvLyAgICAgcmVuZGVyUGFydGlhbDogb3B0aW9ucy5yZW5kZXJQYXJ0aWFsXG4gICAgICAgIC8vIH0pKTtcbiAgICAgICAgY29uZmlnLmFkZE1haGFiaHV0YShtYWhhTWV0YWRhdGEubWFoYWJodXRhQXJyYXkoe1xuICAgICAgICAgICAgLy8gRG8gbm90IHBhc3MgdGhpcyB0aHJvdWdoIHNvIHRoYXQgTWFoYWJodXRhIHdpbGwgbm90XG4gICAgICAgICAgICAvLyBtYWtlIGFic29sdXRlIGxpbmtzIHRvIHN1YmRpcmVjdG9yaWVzXG4gICAgICAgICAgICAvLyByb290X3VybDogY29uZmlnLnJvb3RfdXJsXG4gICAgICAgICAgICAvLyBUT0RPIGhvdyB0byBjb25maWd1cmUgdGhpc1xuICAgICAgICAgICAgLy8gc2l0ZW1hcF90aXRsZTogLi4uLj9cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25maWcuYWRkTWFoYWJodXRhKG1haGFiaHV0YUFycmF5KG9wdGlvbnMsIGNvbmZpZywgdGhpcy5ha2FzaGEsIHRoaXMpKTtcblxuICAgICAgICBjb25zdCBuamsgPSB0aGlzLmNvbmZpZy5maW5kUmVuZGVyZXJOYW1lKCcuaHRtbC5uamsnKSBhcyBSZW5kZXJlcnMuTnVuanVja3NSZW5kZXJlcjtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICBuZXcgc3R5bGVzaGVldHNFeHRlbnNpb24odGhpcy5jb25maWcsIHRoaXMsIG5qaylcbiAgICAgICAgKTtcbiAgICAgICAgbmprLm5qa2VudigpLmFkZEV4dGVuc2lvbignYWtoZWFkZXJqcycsXG4gICAgICAgICAgICBuZXcgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbih0aGlzLmNvbmZpZywgdGhpcywgbmprKVxuICAgICAgICApO1xuICAgICAgICBuamsubmprZW52KCkuYWRkRXh0ZW5zaW9uKCdha2Zvb3RlcmpzJyxcbiAgICAgICAgICAgIG5ldyBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uKHRoaXMuY29uZmlnLCB0aGlzLCBuamspXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gVmVyaWZ5IHRoYXQgdGhlIGV4dGVuc2lvbnMgd2VyZSBpbnN0YWxsZWRcbiAgICAgICAgZm9yIChjb25zdCBleHQgb2YgW1xuICAgICAgICAgICAgICAgICAgICAnYWtzdHlsZXNoZWV0cycsXG4gICAgICAgICAgICAgICAgICAgICdha2hlYWRlcmpzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2FrZm9vdGVyanMnXG4gICAgICAgIF0pIHtcbiAgICAgICAgICAgIGlmICghbmprLm5qa2VudigpLmhhc0V4dGVuc2lvbihleHQpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDb25maWd1cmUgLSBOSksgZG9lcyBub3QgaGF2ZSBleHRlbnNpb24gLSAke2V4dH1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gdHJ5IHtcbiAgICAgICAgLy8gICAgIG5qay5uamtlbnYoKS5hZGRFeHRlbnNpb24oJ2FrbmprdGVzdCcsIG5ldyB0ZXN0RXh0ZW5zaW9uKCkpO1xuICAgICAgICAvLyB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKCkpO1xuICAgICAgICAvLyB9XG4gICAgICAgIFxuICAgICAgICAvLyBpZiAoIW5qay5uamtlbnYoKS5oYXNFeHRlbnNpb24oJ2FrbmprdGVzdCcpKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKGBha25qa3Rlc3QgZXh0ZW5zaW9uIG5vdCBhZGRlZD9gKTtcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGBha25qa3Rlc3QgZXhpc3RzYCk7XG4gICAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBnZXQgY29uZmlnKCkgeyByZXR1cm4gdGhpcy4jY29uZmlnOyB9XG4gICAgLy8gZ2V0IHJlc2l6ZXF1ZXVlKCkgeyByZXR1cm4gdGhpcy4jcmVzaXplX3F1ZXVlOyB9XG5cbiAgICBnZXQgcmVzaXplcXVldWUoKSB7IHJldHVybiB0aGlzLiNyZXNpemVfcXVldWU7IH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8bGluaz4gdGFncyBpbiB0aGUgPGhlYWQ+IGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplSGVhZExpbmtzKHJlbCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMucmVsYXRpdml6ZUhlYWRMaW5rcyA9IHJlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmUgd2hldGhlciA8c2NyaXB0PiB0YWdzIGZvciBsb2NhbFxuICAgICAqIFVSTHMgYXJlIHJlbGF0aXZpemVkIG9yIGFic29sdXRpemVkLlxuICAgICAqL1xuICAgIHNldCByZWxhdGl2aXplU2NyaXB0TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplU2NyaXB0TGlua3MgPSByZWw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lIHdoZXRoZXIgPEE+IHRhZ3MgZm9yIGxvY2FsXG4gICAgICogVVJMcyBhcmUgcmVsYXRpdml6ZWQgb3IgYWJzb2x1dGl6ZWQuXG4gICAgICovXG4gICAgc2V0IHJlbGF0aXZpemVCb2R5TGlua3MocmVsKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzID0gcmVsO1xuICAgIH1cblxuICAgIGRvU3R5bGVzaGVldHMobWV0YWRhdGEpIHtcbiAgICBcdHJldHVybiBfZG9TdHlsZXNoZWV0cyhtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9IZWFkZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvSGVhZGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhKSB7XG4gICAgXHRyZXR1cm4gX2RvRm9vdGVySmF2YVNjcmlwdChtZXRhZGF0YSwgdGhpcy5vcHRpb25zLCB0aGlzLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgYWRkSW1hZ2VUb1Jlc2l6ZShzcmM6IHN0cmluZywgcmVzaXpld2lkdGg6IG51bWJlciwgcmVzaXpldG86IHN0cmluZywgZG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBhZGRJbWFnZVRvUmVzaXplICR7c3JjfSByZXNpemV3aWR0aCAke3Jlc2l6ZXdpZHRofSByZXNpemV0byAke3Jlc2l6ZXRvfWApXG4gICAgICAgIHRoaXMuI3Jlc2l6ZV9xdWV1ZS5wdXNoKHsgc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIGRvY1BhdGggfSk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBzZWN0aW9uIHdhcyBhZGRlZCBpbiB0aGUgcG9zc2liaWxpdHkgb2ZcbiAgICAvLyBtb3ZpbmcgdGFnZ2VkLWNvbnRlbnQgaW50byB0aGUgY29yZS5cbiAgICAvLyBBZnRlciB0cnlpbmcgdGhpcywgdGhhdCBzZWVtcyBsaWtlIGEgbm9uLXN0YXJ0ZXJcbiAgICAvLyBvZiBhIHByb2plY3QgaWRlYS5cblxuICAgIC8vICNwYXRoSW5kZXhlczogc3RyaW5nO1xuXG4gICAgLy8gc2V0IHBhdGhJbmRleGVzKGluZGV4ZXMpIHsgdGhpcy4jcGF0aEluZGV4ZXMgPSBpbmRleGVzOyB9XG4gICAgLy8gZ2V0IHBhdGhJbmRleGVzKCkgICAgICAgIHsgcmV0dXJuIHRoaXMuI3BhdGhJbmRleGVzOyB9XG5cbiAgICAvLyB0YWdQYWdlVXJsKGNvbmZpZywgdGFnTmFtZSkge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHRoaXMuI3BhdGhJbmRleGVzICE9PSAnc3RyaW5nJykge1xuICAgIC8vICAgICAgICAgY29uc29sZS5lcnJvcihgQnVpbHRJblBsdWdpbiBwYXRoSW5kZXhlcyBoYXMgbm90IGJlZW4gc2V0ICR7dXRpbC5pbnNwZWN0KHRoaXMuI3BhdGhJbmRleGVzKX1gKTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBpZiAodGhpcy5wYXRoSW5kZXhlcy5lbmRzV2l0aCgnLycpKSB7XG4gICAgLy8gICAgICAgICByZXR1cm4gdGhpcy5wYXRoSW5kZXhlcyArIHRhZzJlbmNvZGU0dXJsKHRhZ05hbWUpICsnLmh0bWwnO1xuICAgIC8vICAgICB9IGVsc2Uge1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMucGF0aEluZGV4ZXMgKycvJysgdGFnMmVuY29kZTR1cmwodGFnTmFtZSkgKycuaHRtbCc7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhc3luYyBkb1RhZ3NGb3JEb2N1bWVudChjb25maWcsIG1ldGFkYXRhLCB0ZW1wbGF0ZSkge1xuICAgIC8vICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgLy8gICAgIGNvbnN0IHBsdWdpbiA9IHRoaXM7XG4gICAgLy8gICAgICAgICBjb25zb2xlLmxvZygnZG9UYWdzRm9yRG9jdW1lbnQgJysgdXRpbC5pbnNwZWN0KG1ldGFkYXRhKSk7XG4gICAgLy8gICAgIGNvbnN0IHRhZ2xpc3QgPSAoXG4gICAgLy8gICAgICAgICAgICAgJ3RhZ3MnIGluIG1ldGFkYXRhXG4gICAgLy8gICAgICAgICAgICYmIEFycmF5LmlzQXJyYXkobWV0YWRhdGEudGFncylcbiAgICAvLyAgICAgICAgICkgPyBtZXRhZGF0YS50YWdzIDogW107XG4gICAgLy8gICAgIGlmICh0YWdsaXN0KSB7XG4gICAgLy8gICAgICAgICBjb25zdCB0YWd6bGlzdCA9IFtdO1xuICAgIC8vICAgICAgICAgZm9yIChjb25zdCB0YWcgb2YgdGFnbGlzdCkge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3psaXN0LnB1c2goe1xuICAgIC8vICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWcsXG4gICAgLy8gICAgICAgICAgICAgICAgIHRhZ1VybDogcGx1Z2luLnRhZ1BhZ2VVcmwoY29uZmlnLCB0YWcpLFxuICAgIC8vICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYXdhaXQgZG9jdW1lbnRzLmdldFRhZ0Rlc2NyaXB0aW9uKHRhZylcbiAgICAvLyAgICAgICAgICAgICB9KTtcbiAgICAvLyAgICAgICAgIH1cbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKCdkb1RhZ3NGb3JEb2N1bWVudCAnKyB1dGlsLmluc3BlY3QodGFnbGlzdCkpO1xuICAgIC8vICAgICAgICAgcmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwoY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgIC8vICAgICAgICAgICAgIHRhZ3o6IHRhZ3psaXN0XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfSBlbHNlIHJldHVybiBcIlwiO1xuICAgIC8vIH1cblxuICAgIGFzeW5jIG9uU2l0ZVJlbmRlcmVkKGNvbmZpZykge1xuXG4gICAgICAgIGNvbnN0IGRvY3VtZW50cyA9IHRoaXMuYWthc2hhLmZpbGVjYWNoZS5kb2N1bWVudHNDYWNoZTtcbiAgICAgICAgLy8gYXdhaXQgZG9jdW1lbnRzLmlzUmVhZHkoKTtcbiAgICAgICAgY29uc3QgYXNzZXRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmFzc2V0c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBhc3NldHMuaXNSZWFkeSgpO1xuICAgICAgICB3aGlsZSAoQXJyYXkuaXNBcnJheSh0aGlzLiNyZXNpemVfcXVldWUpXG4gICAgICAgICAgICAmJiB0aGlzLiNyZXNpemVfcXVldWUubGVuZ3RoID4gMCkge1xuXG4gICAgICAgICAgICBsZXQgdG9yZXNpemUgPSB0aGlzLiNyZXNpemVfcXVldWUucG9wKCk7XG5cbiAgICAgICAgICAgIGxldCBpbWcycmVzaXplO1xuICAgICAgICAgICAgaWYgKCFwYXRoLmlzQWJzb2x1dGUodG9yZXNpemUuc3JjKSkge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSBwYXRoLm5vcm1hbGl6ZShwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgdG9yZXNpemUuc3JjXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltZzJyZXNpemUgPSB0b3Jlc2l6ZS5zcmM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBzcmNmaWxlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBsZXQgZm91bmQgPSBhd2FpdCBhc3NldHMuZmluZChpbWcycmVzaXplKTtcbiAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgIHNyY2ZpbGUgPSBmb3VuZC5mc3BhdGg7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoaW1nMnJlc2l6ZSk7XG4gICAgICAgICAgICAgICAgc3JjZmlsZSA9IGZvdW5kID8gZm91bmQuZnNwYXRoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFzcmNmaWxlKSB0aHJvdyBuZXcgRXJyb3IoYGFrYXNoYWNtcy1idWlsdGluOiBEaWQgbm90IGZpbmQgc291cmNlIGZpbGUgZm9yIGltYWdlIHRvIHJlc2l6ZSAke2ltZzJyZXNpemV9YCk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGV0IGltZyA9IGF3YWl0IHNoYXJwKHNyY2ZpbGUpO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkID0gYXdhaXQgaW1nLnJlc2l6ZShOdW1iZXIucGFyc2VJbnQodG9yZXNpemUucmVzaXpld2lkdGgpKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGNvbXB1dGUgdGhlIGNvcnJlY3QgZGVzdGluYXRpb24gcGF0aFxuICAgICAgICAgICAgICAgIC8vIGZvciB0aGUgcmVzaXplZCBpbWFnZVxuICAgICAgICAgICAgICAgIGxldCBpbWd0b3Jlc2l6ZSA9IHRvcmVzaXplLnJlc2l6ZXRvID8gdG9yZXNpemUucmVzaXpldG8gOiBpbWcycmVzaXplO1xuICAgICAgICAgICAgICAgIGxldCByZXNpemVkZXN0O1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLmlzQWJzb2x1dGUoaW1ndG9yZXNpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLCBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBmb3IgcmVsYXRpdmUgaW1hZ2UgcGF0aHMsIGhlbmNlIGl0IG5lZWRzIHRvIGJlXG4gICAgICAgICAgICAgICAgICAgIC8vIHJlbGF0aXZlIHRvIHRoZSBkb2NQYXRoXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6ZWRlc3QgPSBwYXRoLmpvaW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlnLnJlbmRlckRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGguZGlybmFtZSh0b3Jlc2l6ZS5kb2NQYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWd0b3Jlc2l6ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICAgICAgICAgICAgYXdhaXQgZnNwLm1rZGlyKHBhdGguZGlybmFtZShyZXNpemVkZXN0KSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgYXdhaXQgcmVzaXplZC50b0ZpbGUocmVzaXplZGVzdCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBidWlsdC1pbjogSW1hZ2UgcmVzaXplIGZhaWxlZCBmb3IgJHtzcmNmaWxlfSAodG9yZXNpemUgJHt1dGlsLmluc3BlY3QodG9yZXNpemUpfSBmb3VuZCAke3V0aWwuaW5zcGVjdChmb3VuZCl9KSBiZWNhdXNlICR7ZX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5leHBvcnQgY29uc3QgbWFoYWJodXRhQXJyYXkgPSBmdW5jdGlvbihcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICBjb25maWc/OiBDb25maWd1cmF0aW9uLFxuICAgICAgICAgICAgYWthc2hhPzogYW55LFxuICAgICAgICAgICAgcGx1Z2luPzogUGx1Z2luXG4pIHtcbiAgICBsZXQgcmV0ID0gbmV3IG1haGFiaHV0YS5NYWhhZnVuY0FycmF5KHBsdWdpbk5hbWUsIG9wdGlvbnMpO1xuICAgIC8vIHJldC5hZGRNYWhhZnVuYyhuZXcgVGFnc0ZvckRvY3VtZW50RWxlbWVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTdHlsZXNoZWV0c0VsZW1lbnQoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSGVhZGVySmF2YVNjcmlwdChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGb290ZXJKYXZhU2NyaXB0KGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IEhlYWRMaW5rUmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgU2NyaXB0UmVsYXRpdml6ZXIoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW5zZXJ0VGVhc2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcbiAgICByZXQuYWRkTWFoYWZ1bmMobmV3IENvZGVFbWJlZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBa0JvZHlDbGFzc0FkZChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBGaWd1cmVJbWFnZShjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBpbWcyZmlndXJlSW1hZ2UoY29uZmlnLCBha2FzaGEsIHBsdWdpbikpO1xuICAgIHJldC5hZGRNYWhhZnVuYyhuZXcgSW1hZ2VSZXdyaXRlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTaG93Q29udGVudChjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBTZWxlY3RFbGVtZW50cyhjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZE1haGFmdW5jKG5ldyBBbmNob3JDbGVhbnVwKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldC5hZGRGaW5hbE1haGFmdW5jKG5ldyBNdW5nZWRBdHRyUmVtb3Zlcihjb25maWcsIGFrYXNoYSwgcGx1Z2luKSk7XG4gICAgcmV0LmFkZEZpbmFsTWFoYWZ1bmMobmV3IEJsYW5rTGlua0RlZmFuZ2VyKGNvbmZpZywgYWthc2hhLCBwbHVnaW4pKTtcblxuICAgIHJldHVybiByZXQ7XG59O1xuXG4vLyBjbGFzcyBUYWdzRm9yRG9jdW1lbnRFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4vLyAgICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay10YWdzLWZvci1kb2N1bWVudFwiOyB9XG4vLyAgICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5LCBkb25lKSB7XG4vLyAgICAgICAgIGNvbnN0IHBsdWdpbiA9IHRoaXMuY29uZmlnLnBsdWdpbihwbHVnaW5OYW1lKTtcbi8vICAgICAgICAgcmV0dXJuIGF3YWl0IHBsdWdpbi5kb1RhZ3NGb3JEb2N1bWVudCh0aGlzLmNvbmZpZyxcbi8vICAgICAgICAgICAgICAgICBtZXRhZGF0YSwgXCJha19kb2N1bWVudF90YWdzLmh0bWwubmprXCIpO1xuLy8gICAgIH1cbi8vIH1cblxuZnVuY3Rpb24gX2RvU3R5bGVzaGVldHMobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuICAgIC8vIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyAke3V0aWwuaW5zcGVjdChtZXRhZGF0YSl9YCk7XG5cbiAgICB2YXIgc2NyaXB0cztcbiAgICBpZiAodHlwZW9mIG1ldGFkYXRhLmhlYWRlclN0eWxlc2hlZXRzQWRkICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5zdHlsZXNoZWV0cy5jb25jYXQobWV0YWRhdGEuaGVhZGVyU3R5bGVzaGVldHNBZGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLnN0eWxlc2hlZXRzIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmxvZyhgYWstc3R5bGVzaGVldHMgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5oZWFkZXJTdHlsZXNoZWV0c0FkZCl9ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX0gJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHRocm93IG5ldyBFcnJvcignX2RvU3R5bGVzaGVldHMgbm8gb3B0aW9ucycpO1xuICAgIGlmICghY29uZmlnKSB0aHJvdyBuZXcgRXJyb3IoJ19kb1N0eWxlc2hlZXRzIG5vIGNvbmZpZycpO1xuXG4gICAgdmFyIHJldCA9ICcnO1xuICAgIGlmICh0eXBlb2Ygc2NyaXB0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZm9yICh2YXIgc3R5bGUgb2Ygc2NyaXB0cykge1xuXG4gICAgICAgICAgICBsZXQgc3R5bGVocmVmID0gc3R5bGUuaHJlZjtcbiAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoc3R5bGUuaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHByb2Nlc3MgJHtzdHlsZWhyZWZ9YCk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuXG4gICAgICAgICAgICAgICAgLy8gVGhlIGJpdCB3aXRoICdodHRwOi8vZXhhbXBsZS5jb20nIG1lYW5zIHRoZXJlXG4gICAgICAgICAgICAgICAgLy8gd29uJ3QgYmUgYW4gZXhjZXB0aW9uIHRocm93biBmb3IgYSBsb2NhbCBVUkwuXG4gICAgICAgICAgICAgICAgLy8gQnV0LCBpbiBzdWNoIGEgY2FzZSwgdUhyZWYucGF0aG5hbWUgd291bGRcbiAgICAgICAgICAgICAgICAvLyBzdGFydCB3aXRoIGEgc2xhc2guICBUaGVyZWZvcmUsIHRvIGNvcnJlY3RseVxuICAgICAgICAgICAgICAgIC8vIGRldGVybWluZSBpZiB0aGlzIFVSTCBpcyBhYnNvbHV0ZSB3ZSBtdXN0IGNoZWNrXG4gICAgICAgICAgICAgICAgLy8gd2l0aCB0aGUgb3JpZ2luYWwgVVJMIHN0cmluZywgd2hpY2ggaXMgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgc3R5bGVocmVmIHZhcmlhYmxlLlxuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3NcbiAgICAgICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKHN0eWxlaHJlZikpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogaWYgKCFtZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIE5PIE1FVEFEQVRBYCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW1ldGFkYXRhLmRvY3VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgTk8gTUVUQURBVEEgRE9DVU1FTlRgKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghbWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBfZG9TdHlsZXNoZWV0cyBOTyBNRVRBREFUQSBET0NVTUVOVCBSRU5ERVJUT2ApO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIHJlbGF0aXZlKC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfSwgJHtzdHlsZWhyZWZ9KSA9ICR7cmVsYXRpdmUoJy8nK21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvLCBzdHlsZWhyZWYpfWApXG4gICAgICAgICAgICAgICAgICAgIH0gKi9cbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3R5bGVocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYF9kb1N0eWxlc2hlZXRzIGFic29sdXRlIHN0eWxlaHJlZiAke3N0eWxlaHJlZn0gaW4gJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSByZXdyb3RlIHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRvU3R5bGVNZWRpYSA9IChtZWRpYSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChtZWRpYSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYG1lZGlhPVwiJHtlbmNvZGUobWVkaWEpfVwiYFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgbGV0IGh0ID0gYDxsaW5rIHJlbD1cInN0eWxlc2hlZXRcIiB0eXBlPVwidGV4dC9jc3NcIiBocmVmPVwiJHtlbmNvZGUoc3R5bGVocmVmKX1cIiAke2RvU3R5bGVNZWRpYShzdHlsZS5tZWRpYSl9Lz5gXG4gICAgICAgICAgICByZXQgKz0gaHQ7XG5cbiAgICAgICAgICAgIC8vIFRoZSBpc3N1ZSB3aXRoIHRoaXMgYW5kIG90aGVyIGluc3RhbmNlc1xuICAgICAgICAgICAgLy8gaXMgdGhhdCB0aGlzIHRlbmRlZCB0byByZXN1bHQgaW5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyAgIDxodG1sPjxib2R5PjxsaW5rLi4+PC9ib2R5PjwvaHRtbD5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBXaGVuIGl0IG5lZWRlZCB0byBqdXN0IGJlIHRoZSA8bGluaz4gdGFnLlxuICAgICAgICAgICAgLy8gSW4gb3RoZXIgd29yZHMsIGl0IHRyaWVkIHRvIGNyZWF0ZSBhbiBlbnRpcmVcbiAgICAgICAgICAgIC8vIEhUTUwgZG9jdW1lbnQuICBXaGlsZSB0aGVyZSB3YXMgYSB3YXkgYXJvdW5kXG4gICAgICAgICAgICAvLyB0aGlzIC0gJCgnc2VsZWN0b3InKS5wcm9wKCdvdXRlckhUTUwnKVxuICAgICAgICAgICAgLy8gVGhpcyBhbHNvIHNlZW1lZCB0byBiZSBhbiBvdmVyaGVhZFxuICAgICAgICAgICAgLy8gd2UgY2FuIGF2b2lkLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFRoZSBwYXR0ZXJuIGlzIHRvIHVzZSBUZW1wbGF0ZSBTdHJpbmdzIHdoaWxlXG4gICAgICAgICAgICAvLyBiZWluZyBjYXJlZnVsIHRvIGVuY29kZSB2YWx1ZXMgc2FmZWx5IGZvciB1c2VcbiAgICAgICAgICAgIC8vIGluIGFuIGF0dHJpYnV0ZS4gIFRoZSBcImVuY29kZVwiIGZ1bmN0aW9uIGRvZXNcbiAgICAgICAgICAgIC8vIHRoZSBlbmNvZGluZy5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FrYXNoYWNtcy9ha2FzaGFyZW5kZXIvaXNzdWVzLzQ5XG5cbiAgICAgICAgICAgIC8vIGxldCAkID0gbWFoYWJodXRhLnBhcnNlKCc8bGluayByZWw9XCJzdHlsZXNoZWV0XCIgdHlwZT1cInRleHQvY3NzXCIgaHJlZj1cIlwiLz4nKTtcbiAgICAgICAgICAgIC8vICQoJ2xpbmsnKS5hdHRyKCdocmVmJywgc3R5bGVocmVmKTtcbiAgICAgICAgICAgIC8vIGlmIChzdHlsZS5tZWRpYSkge1xuICAgICAgICAgICAgLy8gICAgICQoJ2xpbmsnKS5hdHRyKCdtZWRpYScsIHN0eWxlLm1lZGlhKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIHJldCArPSAkLmh0bWwoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvU3R5bGVzaGVldHMgJHtyZXR9YCk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0phdmFTY3JpcHRzKFxuICAgIG1ldGFkYXRhLFxuICAgIHNjcmlwdHM6IGphdmFTY3JpcHRJdGVtW10sXG4gICAgb3B0aW9ucyxcbiAgICBjb25maWc6IENvbmZpZ3VyYXRpb25cbikge1xuXHR2YXIgcmV0ID0gJyc7XG5cdGlmICghc2NyaXB0cykgcmV0dXJuIHJldDtcblxuICAgIGlmICghb3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKCdfZG9KYXZhU2NyaXB0cyBubyBvcHRpb25zJyk7XG4gICAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcignX2RvSmF2YVNjcmlwdHMgbm8gY29uZmlnJyk7XG5cbiAgICBmb3IgKHZhciBzY3JpcHQgb2Ygc2NyaXB0cykge1xuXHRcdGlmICghc2NyaXB0LmhyZWYgJiYgIXNjcmlwdC5zY3JpcHQpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTXVzdCBzcGVjaWZ5IGVpdGhlciBocmVmIG9yIHNjcmlwdCBpbiAke3V0aWwuaW5zcGVjdChzY3JpcHQpfWApO1xuXHRcdH1cbiAgICAgICAgaWYgKCFzY3JpcHQuc2NyaXB0KSBzY3JpcHQuc2NyaXB0ID0gJyc7XG5cbiAgICAgICAgY29uc3QgZG9UeXBlID0gKGxhbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGB0eXBlPVwiJHtlbmNvZGUobGFuZyl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9IcmVmID0gKGhyZWYpID0+IHtcbiAgICAgICAgICAgIGlmIChocmVmKSB7XG4gICAgICAgICAgICAgICAgbGV0IHNjcmlwdGhyZWYgPSBocmVmO1xuICAgICAgICAgICAgICAgIGxldCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgYSBsb2NhbCBVUkxcbiAgICAgICAgICAgICAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzXG4gICAgICAgICAgICAgICAgICAgICYmIHBhdGguaXNBYnNvbHV0ZShzY3JpcHRocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc2NyaXB0aHJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgX2RvSmF2YVNjcmlwdHMgYWJzb2x1dGUgc2NyaXB0aHJlZiAke3NjcmlwdGhyZWZ9IGluICR7dXRpbC5pbnNwZWN0KG1ldGFkYXRhLmRvY3VtZW50KX0gcmV3cm90ZSB0byAke25ld0hyZWZ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JpcHRocmVmID0gbmV3SHJlZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYHNyYz1cIiR7ZW5jb2RlKHNjcmlwdGhyZWYpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsZXQgaHQgPSBgPHNjcmlwdCAke2RvVHlwZShzY3JpcHQubGFuZyl9ICR7ZG9IcmVmKHNjcmlwdC5ocmVmKX0+JHtzY3JpcHQuc2NyaXB0fTwvc2NyaXB0PmA7XG4gICAgICAgIHJldCArPSBodDtcbiAgICB9XG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIG9wdGlvbnMsIGNvbmZpZzogQ29uZmlndXJhdGlvbikge1xuXHR2YXIgc2NyaXB0cztcblx0aWYgKHR5cGVvZiBtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkVG9wICE9PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0c2NyaXB0cyA9IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AuY29uY2F0KG1ldGFkYXRhLmhlYWRlckphdmFTY3JpcHRBZGRUb3ApO1xuXHR9IGVsc2Uge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cyA/IGNvbmZpZy5zY3JpcHRzLmphdmFTY3JpcHRUb3AgOiB1bmRlZmluZWQ7XG5cdH1cblx0Ly8gY29uc29sZS5sb2coYF9kb0hlYWRlckphdmFTY3JpcHQgJHt1dGlsLmluc3BlY3Qoc2NyaXB0cyl9YCk7XG5cdC8vIGNvbnNvbGUubG9nKGBfZG9IZWFkZXJKYXZhU2NyaXB0ICR7dXRpbC5pbnNwZWN0KGNvbmZpZy5zY3JpcHRzKX1gKTtcblx0cmV0dXJuIF9kb0phdmFTY3JpcHRzKG1ldGFkYXRhLCBzY3JpcHRzLCBvcHRpb25zLCBjb25maWcpO1xufVxuXG5mdW5jdGlvbiBfZG9Gb290ZXJKYXZhU2NyaXB0KG1ldGFkYXRhLCBvcHRpb25zLCBjb25maWc6IENvbmZpZ3VyYXRpb24pIHtcblx0dmFyIHNjcmlwdHM7XG5cdGlmICh0eXBlb2YgbWV0YWRhdGEuaGVhZGVySmF2YVNjcmlwdEFkZEJvdHRvbSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdHNjcmlwdHMgPSBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tLmNvbmNhdChtZXRhZGF0YS5oZWFkZXJKYXZhU2NyaXB0QWRkQm90dG9tKTtcblx0fSBlbHNlIHtcblx0XHRzY3JpcHRzID0gY29uZmlnLnNjcmlwdHMgPyBjb25maWcuc2NyaXB0cy5qYXZhU2NyaXB0Qm90dG9tIDogdW5kZWZpbmVkO1xuXHR9XG5cdHJldHVybiBfZG9KYXZhU2NyaXB0cyhtZXRhZGF0YSwgc2NyaXB0cywgb3B0aW9ucywgY29uZmlnKTtcbn1cblxuY2xhc3MgU3R5bGVzaGVldHNFbGVtZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstc3R5bGVzaGVldHNcIjsgfVxuXHRhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pIHtcblx0XHRsZXQgcmV0ID0gIF9kb1N0eWxlc2hlZXRzKG1ldGFkYXRhLCB0aGlzLmFycmF5Lm9wdGlvbnMsIHRoaXMuY29uZmlnKTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYFN0eWxlc2hlZXRzRWxlbWVudCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEhlYWRlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1oZWFkZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIHNldERpcnR5OiBGdW5jdGlvbiwgZG9uZT86IEZ1bmN0aW9uKSB7XG5cdFx0bGV0IHJldCA9IF9kb0hlYWRlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgSGVhZGVySmF2YVNjcmlwdCBgLCByZXQpO1xuICAgICAgICByZXR1cm4gcmV0O1xuXHR9XG59XG5cbmNsYXNzIEZvb3RlckphdmFTY3JpcHQgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJhay1mb290ZXJKYXZhU2NyaXB0XCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0cmV0dXJuIF9kb0Zvb3RlckphdmFTY3JpcHQobWV0YWRhdGEsIHRoaXMuYXJyYXkub3B0aW9ucywgdGhpcy5jb25maWcpO1xuXHR9XG59XG5cbmNsYXNzIEhlYWRMaW5rUmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiaHRtbCBoZWFkIGxpbmtcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIC8vIE9ubHkgcmVsYXRpdml6ZSBpZiBkZXNpcmVkXG4gICAgICAgIGlmICghdGhpcy5hcnJheS5vcHRpb25zLnJlbGF0aXZpemVIZWFkTGlua3MpIHJldHVybjtcbiAgICAgICAgbGV0IGhyZWYgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cbiAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1SHJlZi5vcmlnaW4gPT09ICdodHRwOi8vZXhhbXBsZS5jb20nKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgbG9jYWwgbGlua1xuICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYW4gYWJzb2x1dGUgbG9jYWwgbGlua1xuICAgICAgICAgICAgICAgIGxldCBuZXdIcmVmID0gcmVsYXRpdmUoYC8ke21ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvfWAsIGhyZWYpO1xuICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCBuZXdIcmVmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgU2NyaXB0UmVsYXRpdml6ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwic2NyaXB0XCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcInNjcmlwdFwiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgLy8gT25seSByZWxhdGl2aXplIGlmIGRlc2lyZWRcbiAgICAgICAgaWYgKCF0aGlzLmFycmF5Lm9wdGlvbnMucmVsYXRpdml6ZVNjcmlwdExpbmtzKSByZXR1cm47XG4gICAgICAgIGxldCBocmVmID0gJGxpbmsuYXR0cignc3JjJyk7XG5cbiAgICAgICAgaWYgKGhyZWYpIHtcbiAgICAgICAgICAgIC8vIFRoZXJlIGlzIGEgbGlua1xuICAgICAgICAgICAgbGV0IHVIcmVmID0gbmV3IFVSTChocmVmLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgICAgICBpZiAodUhyZWYub3JpZ2luID09PSAnaHR0cDovL2V4YW1wbGUuY29tJykge1xuICAgICAgICAgICAgICAgIC8vIEl0J3MgYSBsb2NhbCBsaW5rXG4gICAgICAgICAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShocmVmKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIGFuIGFic29sdXRlIGxvY2FsIGxpbmtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY2xhc3MgSW5zZXJ0VGVhc2VyIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG5cdGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiYWstdGVhc2VyXCI7IH1cblx0YXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHRyeSB7XG5cdFx0cmV0dXJuIHRoaXMuYWthc2hhLnBhcnRpYWwodGhpcy5jb25maWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWtfdGVhc2VyLmh0bWwubmprXCIsIHtcblx0XHRcdHRlYXNlcjogdHlwZW9mIG1ldGFkYXRhW1wiYWstdGVhc2VyXCJdICE9PSBcInVuZGVmaW5lZFwiXG5cdFx0XHRcdD8gbWV0YWRhdGFbXCJhay10ZWFzZXJcIl0gOiBtZXRhZGF0YS50ZWFzZXJcblx0XHR9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW5zZXJ0VGVhc2VyIGNhdWdodCBlcnJvciBgLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cblx0fVxufVxuXG5jbGFzcyBBa0JvZHlDbGFzc0FkZCBleHRlbmRzIFBhZ2VQcm9jZXNzb3Ige1xuXHRhc3luYyBwcm9jZXNzKCQsIG1ldGFkYXRhLCBkaXJ0eSk6IFByb21pc2U8c3RyaW5nPiB7XG5cdFx0aWYgKHR5cGVvZiBtZXRhZGF0YS5ha0JvZHlDbGFzc0FkZCAhPT0gJ3VuZGVmaW5lZCdcblx0XHQgJiYgbWV0YWRhdGEuYWtCb2R5Q2xhc3NBZGQgIT0gJydcblx0XHQgJiYgJCgnaHRtbCBib2R5JykuZ2V0KDApKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXHRcdFx0XHRpZiAoISQoJ2h0bWwgYm9keScpLmhhc0NsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKSkge1xuXHRcdFx0XHRcdCQoJ2h0bWwgYm9keScpLmFkZENsYXNzKG1ldGFkYXRhLmFrQm9keUNsYXNzQWRkKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNvbHZlKHVuZGVmaW5lZCk7XG5cdFx0XHR9KTtcblx0XHR9IGVsc2UgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgnJyk7XG5cdH1cbn1cblxuY2xhc3MgQ29kZUVtYmVkIGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJjb2RlLWVtYmVkXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCRlbGVtZW50LCBtZXRhZGF0YSwgZGlydHkpIHtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhgQ29kZUVtYmVkIHByb2Nlc3MgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQsIGZhbHNlLCAxMCl9YCk7XG5cbiAgICAgICAgY29uc3QgZm4gPSAkZWxlbWVudC5hdHRyKCdmaWxlLW5hbWUnKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICRlbGVtZW50LmF0dHIoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgaWQgPSAkZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgICAgIGlmICghZm4gfHwgZm4gPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgbXVzdCBoYXZlIGZpbGUtbmFtZSBhcmd1bWVudCwgZ290ICR7Zm59YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdHh0cGF0aDtcbiAgICAgICAgaWYgKHBhdGguaXNBYnNvbHV0ZShmbikpIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBmbjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHR4dHBhdGggPSBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKSwgZm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICBjb25zdCBmb3VuZCA9IGF3YWl0IGRvY3VtZW50cy5maW5kKHR4dHBhdGgpO1xuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGUtZW1iZWQgZmlsZS1uYW1lICR7Zm59IGRvZXMgbm90IHJlZmVyIHRvIHVzYWJsZSBmaWxlYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0eHQgPSBhd2FpdCBmc3AucmVhZEZpbGUoZm91bmQuZnNwYXRoLCAndXRmOCcpO1xuXG4gICAgICAgIGNvbnN0IGRvTGFuZyA9IChsYW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobGFuZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBgY2xhc3M9XCJobGpzICR7ZW5jb2RlKGxhbmcpfVwiYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdjbGFzcz1cImhsanNcIic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IGRvSUQgPSAoaWQpID0+IHtcbiAgICAgICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgaWQ9XCIke2VuY29kZShpZCl9XCJgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZG9Db2RlID0gKGxhbmcsIGNvZGUpID0+IHtcbiAgICAgICAgICAgIGlmIChsYW5nICYmIGxhbmcgIT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQoY29kZSwge1xuICAgICAgICAgICAgICAgICAgICBsYW5ndWFnZTogbGFuZ1xuICAgICAgICAgICAgICAgIH0pLnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHRBdXRvKGNvZGUpLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCByZXQgPSBgPHByZSAke2RvSUQoaWQpfT48Y29kZSAke2RvTGFuZyhsYW5nKX0+JHtkb0NvZGUobGFuZywgdHh0KX08L2NvZGU+PC9wcmU+YDtcbiAgICAgICAgcmV0dXJuIHJldDtcblxuICAgICAgICAvLyBsZXQgJCA9IG1haGFiaHV0YS5wYXJzZShgPHByZT48Y29kZT48L2NvZGU+PC9wcmU+YCk7XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYWRkQ2xhc3MobGFuZyk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gJCgnY29kZScpLmFkZENsYXNzKCdobGpzJyk7XG4gICAgICAgIC8vIGlmIChpZCAmJiBpZCAhPT0gJycpIHtcbiAgICAgICAgLy8gICAgICQoJ3ByZScpLmF0dHIoJ2lkJywgaWQpO1xuICAgICAgICAvLyB9XG4gICAgICAgIC8vIGlmIChsYW5nICYmIGxhbmcgIT09ICcnKSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0KHR4dCwge1xuICAgICAgICAvLyAgICAgICAgIGxhbmd1YWdlOiBsYW5nXG4gICAgICAgIC8vICAgICB9KS52YWx1ZSk7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAkKCdjb2RlJykuYXBwZW5kKGhsanMuaGlnaGxpZ2h0QXV0byh0eHQpLnZhbHVlKTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyByZXR1cm4gJC5odG1sKCk7XG4gICAgfVxufVxuXG5jbGFzcyBGaWd1cmVJbWFnZSBleHRlbmRzIEN1c3RvbUVsZW1lbnQge1xuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuIFwiZmlnLWltZ1wiOyB9XG4gICAgYXN5bmMgcHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG4gICAgICAgIHZhciB0ZW1wbGF0ZSA9ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJyk7XG4gICAgICAgIGlmICghdGVtcGxhdGUpIHRlbXBsYXRlID0gJ2FrX2ZpZ2ltZy5odG1sLm5qayc7XG4gICAgICAgIGNvbnN0IGhyZWYgICAgPSAkZWxlbWVudC5hdHRyKCdocmVmJyk7XG4gICAgICAgIGlmICghaHJlZikgdGhyb3cgbmV3IEVycm9yKCdmaWctaW1nIG11c3QgcmVjZWl2ZSBhbiBocmVmJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaHJlZiwgY2xhenosIGlkLCBjYXB0aW9uLCB3aWR0aCwgc3R5bGUsIGRlc3RcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5jbGFzcyBpbWcyZmlndXJlSW1hZ2UgZXh0ZW5kcyBDdXN0b21FbGVtZW50IHtcbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGltZ1tmaWd1cmVdJzsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSwgZG9uZSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gJGVsZW1lbnQuYXR0cigndGVtcGxhdGUnKSBcbiAgICAgICAgICAgICAgICA/ICRlbGVtZW50LmF0dHIoJ3RlbXBsYXRlJylcbiAgICAgICAgICAgICAgICA6ICBcImFrX2ZpZ2ltZy5odG1sLm5qa1wiO1xuICAgICAgICBjb25zdCBpZCA9ICRlbGVtZW50LmF0dHIoJ2lkJyk7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGVsZW1lbnQuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCB3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHNyYyA9ICRlbGVtZW50LmF0dHIoJ3NyYycpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRlbGVtZW50LmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBjb25zdCBjb250ZW50ID0gJGVsZW1lbnQuYXR0cignY2FwdGlvbicpXG4gICAgICAgICAgICAgICAgPyAkZWxlbWVudC5hdHRyKCdjYXB0aW9uJylcbiAgICAgICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gdGhpcy5ha2FzaGEucGFydGlhbChcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwge1xuICAgICAgICAgICAgaWQsIGNsYXp6LCBzdHlsZSwgd2lkdGgsIGhyZWY6IHNyYywgZGVzdCwgcmVzaXpld2lkdGgsIHJlc2l6ZXRvLFxuICAgICAgICAgICAgY2FwdGlvbjogY29udGVudFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmNsYXNzIEltYWdlUmV3cml0ZXIgZXh0ZW5kcyBNdW5nZXIge1xuICAgIGdldCBzZWxlY3RvcigpIHsgcmV0dXJuIFwiaHRtbCBib2R5IGltZ1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJodG1sIGJvZHkgaW1nXCI7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRsaW5rLCBtZXRhZGF0YSwgZGlydHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJGVsZW1lbnQpO1xuXG4gICAgICAgIC8vIFdlIG9ubHkgZG8gcmV3cml0ZXMgZm9yIGxvY2FsIGltYWdlc1xuICAgICAgICBsZXQgc3JjID0gJGxpbmsuYXR0cignc3JjJyk7XG4gICAgICAgIC8vIEZvciBsb2NhbCBVUkxzLCB0aGlzIG5ldyBVUkwgY2FsbCB3aWxsXG4gICAgICAgIC8vIG1ha2UgdVNyYy5vcmlnaW4gPT09IGh0dHA6Ly9leGFtcGxlLmNvbVxuICAgICAgICAvLyBIZW5jZSwgaWYgc29tZSBvdGhlciBkb21haW4gYXBwZWFyc1xuICAgICAgICAvLyB0aGVuIHdlIGtvbncgaXQncyBub3QgYSBsb2NhbCBpbWFnZS5cbiAgICAgICAgY29uc3QgdVNyYyA9IG5ldyBVUkwoc3JjLCAnaHR0cDovL2V4YW1wbGUuY29tJyk7XG4gICAgICAgIGlmICh1U3JjLm9yaWdpbiAhPT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHtcbiAgICAgICAgICAgIHJldHVybiBcIm9rXCI7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIEFyZSB3ZSBhc2tlZCB0byByZXNpemUgdGhlIGltYWdlP1xuICAgICAgICBjb25zdCByZXNpemV3aWR0aCA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS13aWR0aCcpO1xuICAgICAgICBjb25zdCByZXNpemV0byA9ICRsaW5rLmF0dHIoJ3Jlc2l6ZS10bycpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHJlc2l6ZXdpZHRoKSB7XG4gICAgICAgICAgICAvLyBBZGQgdG8gYSBxdWV1ZSB0aGF0IGlzIHJ1biBhdCB0aGUgZW5kIFxuICAgICAgICAgICAgdGhpcy5jb25maWcucGx1Z2luKHBsdWdpbk5hbWUpXG4gICAgICAgICAgICAgICAgLmFkZEltYWdlVG9SZXNpemUoc3JjLCByZXNpemV3aWR0aCwgcmVzaXpldG8sIG1ldGFkYXRhLmRvY3VtZW50LnJlbmRlclRvKTtcblxuICAgICAgICAgICAgaWYgKHJlc2l6ZXRvKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignc3JjJywgcmVzaXpldG8pO1xuICAgICAgICAgICAgICAgIHNyYyA9IHJlc2l6ZXRvO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaGVzZSBhcmUgbm8gbG9uZ2VyIG5lZWRlZFxuICAgICAgICAgICAgJGxpbmsucmVtb3ZlQXR0cigncmVzaXplLXdpZHRoJyk7XG4gICAgICAgICAgICAkbGluay5yZW1vdmVBdHRyKCdyZXNpemUtdG8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoZSBpZGVhIGhlcmUgaXMgZm9yIGV2ZXJ5IGxvY2FsIGltYWdlIHNyYyB0byBiZSBhIHJlbGF0aXZlIFVSTFxuICAgICAgICBpZiAocGF0aC5pc0Fic29sdXRlKHNyYykpIHtcbiAgICAgICAgICAgIGxldCBuZXdTcmMgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgc3JjKTtcbiAgICAgICAgICAgICRsaW5rLmF0dHIoJ3NyYycsIG5ld1NyYyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgSW1hZ2VSZXdyaXRlciBhYnNvbHV0ZSBpbWFnZSBwYXRoICR7c3JjfSByZXdyb3RlIHRvICR7bmV3U3JjfWApO1xuICAgICAgICAgICAgc3JjID0gbmV3U3JjO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICB9XG59XG5cbmNsYXNzIFNob3dDb250ZW50IGV4dGVuZHMgQ3VzdG9tRWxlbWVudCB7XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzaG93LWNvbnRlbnRcIjsgfVxuICAgIGFzeW5jIHByb2Nlc3MoJGVsZW1lbnQsIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgdGVtcGxhdGUgPSAkZWxlbWVudC5hdHRyKCd0ZW1wbGF0ZScpO1xuICAgICAgICBpZiAoIXRlbXBsYXRlKSB0ZW1wbGF0ZSA9ICdha19zaG93LWNvbnRlbnQuaHRtbC5uamsnO1xuICAgICAgICBsZXQgaHJlZiAgICA9ICRlbGVtZW50LmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgaWYgKCFocmVmKSByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdzaG93LWNvbnRlbnQgbXVzdCByZWNlaXZlIGFuIGhyZWYnKSk7XG4gICAgICAgIGNvbnN0IGNsYXp6ICAgPSAkZWxlbWVudC5hdHRyKCdjbGFzcycpO1xuICAgICAgICBjb25zdCBpZCAgICAgID0gJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICAgICAgY29uc3QgY2FwdGlvbiA9ICRlbGVtZW50Lmh0bWwoKTtcbiAgICAgICAgY29uc3Qgd2lkdGggICA9ICRlbGVtZW50LmF0dHIoJ3dpZHRoJyk7XG4gICAgICAgIGNvbnN0IHN0eWxlICAgPSAkZWxlbWVudC5hdHRyKCdzdHlsZScpO1xuICAgICAgICBjb25zdCBkZXN0ICAgID0gJGVsZW1lbnQuYXR0cignZGVzdCcpO1xuICAgICAgICBjb25zdCBjb250ZW50SW1hZ2UgPSAkZWxlbWVudC5hdHRyKCdjb250ZW50LWltYWdlJyk7XG4gICAgICAgIGNvbnN0IGRvYzJyZWFkID0gcmVzb2x2ZVZwYXRoKG1ldGFkYXRhLmRvY3VtZW50LnBhdGgsIGhyZWYpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2hvd0NvbnRlbnQgJHt1dGlsLmluc3BlY3QobWV0YWRhdGEuZG9jdW1lbnQpfSAke2RvYzJyZWFkfWApO1xuICAgICAgICBjb25zdCBkb2N1bWVudHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuZG9jdW1lbnRzQ2FjaGU7XG4gICAgICAgIGNvbnN0IGRvYyA9IGF3YWl0IGRvY3VtZW50cy5maW5kKGRvYzJyZWFkKTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHtcbiAgICAgICAgICAgIGhyZWYsIGNsYXp6LCBpZCwgY2FwdGlvbiwgd2lkdGgsIHN0eWxlLCBkZXN0LCBjb250ZW50SW1hZ2UsXG4gICAgICAgICAgICBkb2N1bWVudDogZG9jXG4gICAgICAgIH07XG4gICAgICAgIGxldCByZXQgPSBhd2FpdCB0aGlzLmFrYXNoYS5wYXJ0aWFsKFxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLCB0ZW1wbGF0ZSwgZGF0YSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBTaG93Q29udGVudCAke2hyZWZ9ICR7dXRpbC5pbnNwZWN0KGRhdGEpfSA9PT4gJHtyZXR9YCk7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfVxufVxuXG4vKlxuXG5UaGlzIHdhcyBtb3ZlZCBpbnRvIE1haGFiaHV0YVxuXG4gY2xhc3MgUGFydGlhbCBleHRlbmRzIG1haGFiaHV0YS5DdXN0b21FbGVtZW50IHtcblx0Z2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJwYXJ0aWFsXCI7IH1cblx0cHJvY2VzcygkZWxlbWVudCwgbWV0YWRhdGEsIGRpcnR5KSB7XG5cdFx0Ly8gV2UgZGVmYXVsdCB0byBtYWtpbmcgcGFydGlhbCBzZXQgdGhlIGRpcnR5IGZsYWcuICBCdXQgYSB1c2VyXG5cdFx0Ly8gb2YgdGhlIHBhcnRpYWwgdGFnIGNhbiBjaG9vc2UgdG8gdGVsbCB1cyBpdCBpc24ndCBkaXJ0eS5cblx0XHQvLyBGb3IgZXhhbXBsZSwgaWYgdGhlIHBhcnRpYWwgb25seSBzdWJzdGl0dXRlcyBub3JtYWwgdGFnc1xuXHRcdC8vIHRoZXJlJ3Mgbm8gbmVlZCB0byBkbyB0aGUgZGlydHkgdGhpbmcuXG5cdFx0dmFyIGRvdGhlZGlydHl0aGluZyA9ICRlbGVtZW50LmF0dHIoJ2RpcnR5Jyk7XG5cdFx0aWYgKCFkb3RoZWRpcnR5dGhpbmcgfHwgZG90aGVkaXJ0eXRoaW5nLm1hdGNoKC90cnVlL2kpKSB7XG5cdFx0XHRkaXJ0eSgpO1xuXHRcdH1cblx0XHR2YXIgZm5hbWUgPSAkZWxlbWVudC5hdHRyKFwiZmlsZS1uYW1lXCIpO1xuXHRcdHZhciB0eHQgICA9ICRlbGVtZW50Lmh0bWwoKTtcblx0XHR2YXIgZCA9IHt9O1xuXHRcdGZvciAodmFyIG1wcm9wIGluIG1ldGFkYXRhKSB7IGRbbXByb3BdID0gbWV0YWRhdGFbbXByb3BdOyB9XG5cdFx0dmFyIGRhdGEgPSAkZWxlbWVudC5kYXRhKCk7XG5cdFx0Zm9yICh2YXIgZHByb3AgaW4gZGF0YSkgeyBkW2Rwcm9wXSA9IGRhdGFbZHByb3BdOyB9XG5cdFx0ZFtcInBhcnRpYWxCb2R5XCJdID0gdHh0O1xuXHRcdGxvZygncGFydGlhbCB0YWcgZm5hbWU9JysgZm5hbWUgKycgYXR0cnMgJysgdXRpbC5pbnNwZWN0KGRhdGEpKTtcblx0XHRyZXR1cm4gcmVuZGVyLnBhcnRpYWwodGhpcy5jb25maWcsIGZuYW1lLCBkKVxuXHRcdC50aGVuKGh0bWwgPT4geyByZXR1cm4gaHRtbDsgfSlcblx0XHQuY2F0Y2goZXJyID0+IHtcblx0XHRcdGVycm9yKG5ldyBFcnJvcihcIkZBSUwgcGFydGlhbCBmaWxlLW5hbWU9XCIrIGZuYW1lICtcIiBiZWNhdXNlIFwiKyBlcnIpKTtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkZBSUwgcGFydGlhbCBmaWxlLW5hbWU9XCIrIGZuYW1lICtcIiBiZWNhdXNlIFwiKyBlcnIpO1xuXHRcdH0pO1xuXHR9XG59XG5tb2R1bGUuZXhwb3J0cy5tYWhhYmh1dGEuYWRkTWFoYWZ1bmMobmV3IFBhcnRpYWwoKSk7ICovXG5cbi8vXG4vLyA8c2VsZWN0LWVsZW1lbnRzIGNsYXNzPVwiLi5cIiBpZD1cIi4uXCIgY291bnQ9XCJOXCI+XG4vLyAgICAgPGVsZW1lbnQ+PC9lbGVtZW50PlxuLy8gICAgIDxlbGVtZW50PjwvZWxlbWVudD5cbi8vIDwvc2VsZWN0LWVsZW1lbnRzPlxuLy9cbmNsYXNzIFNlbGVjdEVsZW1lbnRzIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcInNlbGVjdC1lbGVtZW50c1wiOyB9XG4gICAgZ2V0IGVsZW1lbnROYW1lKCkgeyByZXR1cm4gXCJzZWxlY3QtZWxlbWVudHNcIjsgfVxuXG4gICAgYXN5bmMgcHJvY2VzcygkLCAkbGluaywgbWV0YWRhdGEsIGRpcnR5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgbGV0IGNvdW50ID0gJGxpbmsuYXR0cignY291bnQnKVxuICAgICAgICAgICAgICAgICAgICA/IE51bWJlci5wYXJzZUludCgkbGluay5hdHRyKCdjb3VudCcpKVxuICAgICAgICAgICAgICAgICAgICA6IDE7XG4gICAgICAgIGNvbnN0IGNsYXp6ID0gJGxpbmsuYXR0cignY2xhc3MnKTtcbiAgICAgICAgY29uc3QgaWQgICAgPSAkbGluay5hdHRyKCdpZCcpO1xuICAgICAgICBjb25zdCB0biAgICA9ICRsaW5rLmF0dHIoJ3RhZy1uYW1lJylcbiAgICAgICAgICAgICAgICAgICAgPyAkbGluay5hdHRyKCd0YWctbmFtZScpXG4gICAgICAgICAgICAgICAgICAgIDogJ2Rpdic7XG5cbiAgICAgICAgY29uc3QgY2hpbGRyZW4gPSAkbGluay5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCBzZWxlY3RlZCA9IFtdO1xuXG4gICAgICAgIGZvciAoOyBjb3VudCA+PSAxICYmIGNoaWxkcmVuLmxlbmd0aCA+PSAxOyBjb3VudC0tKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIGNvbnN0IF9uID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hpbGRyZW4ubGVuZ3RoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKF9uKTtcbiAgICAgICAgICAgIGNvbnN0IGNob3NlbiA9ICQoY2hpbGRyZW5bX25dKS5odG1sKCk7XG4gICAgICAgICAgICBzZWxlY3RlZC5wdXNoKGNob3Nlbik7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgU2VsZWN0RWxlbWVudHMgYCwgY2hvc2VuKTtcbiAgICAgICAgICAgIGRlbGV0ZSBjaGlsZHJlbltfbl07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF91dWlkID0gdXVpZHYxKCk7XG4gICAgICAgICRsaW5rLnJlcGxhY2VXaXRoKGA8JHt0bn0gaWQ9JyR7X3V1aWR9Jz48LyR7dG59PmApO1xuICAgICAgICBjb25zdCAkbmV3SXRlbSA9ICQoYCR7dG59IyR7X3V1aWR9YCk7XG4gICAgICAgIGlmIChpZCkgJG5ld0l0ZW0uYXR0cignaWQnLCBpZCk7XG4gICAgICAgIGVsc2UgJG5ld0l0ZW0ucmVtb3ZlQXR0cignaWQnKTtcbiAgICAgICAgaWYgKGNsYXp6KSAkbmV3SXRlbS5hZGRDbGFzcyhjbGF6eik7XG4gICAgICAgIGZvciAobGV0IGNob3NlbiBvZiBzZWxlY3RlZCkge1xuICAgICAgICAgICAgJG5ld0l0ZW0uYXBwZW5kKGNob3Nlbik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG5jbGFzcyBBbmNob3JDbGVhbnVwIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiBcImh0bWwgYm9keSBhW211bmdlZCE9J3llcyddXCI7IH1cblxuICAgIGFzeW5jIHByb2Nlc3MoJCwgJGxpbmssIG1ldGFkYXRhLCBkaXJ0eSkge1xuICAgICAgICB2YXIgaHJlZiAgICAgPSAkbGluay5hdHRyKCdocmVmJyk7XG4gICAgICAgIHZhciBsaW5rdGV4dCA9ICRsaW5rLnRleHQoKTtcbiAgICAgICAgY29uc3QgZG9jdW1lbnRzID0gdGhpcy5ha2FzaGEuZmlsZWNhY2hlLmRvY3VtZW50c0NhY2hlO1xuICAgICAgICAvLyBhd2FpdCBkb2N1bWVudHMuaXNSZWFkeSgpO1xuICAgICAgICBjb25zdCBhc3NldHMgPSB0aGlzLmFrYXNoYS5maWxlY2FjaGUuYXNzZXRzQ2FjaGU7XG4gICAgICAgIC8vIGF3YWl0IGFzc2V0cy5pc1JlYWR5KCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7aHJlZn0gJHtsaW5rdGV4dH1gKTtcbiAgICAgICAgaWYgKGhyZWYgJiYgaHJlZiAhPT0gJyMnKSB7XG4gICAgICAgICAgICBjb25zdCB1SHJlZiA9IG5ldyBVUkwoaHJlZiwgJ2h0dHA6Ly9leGFtcGxlLmNvbScpO1xuICAgICAgICAgICAgaWYgKHVIcmVmLm9yaWdpbiAhPT0gJ2h0dHA6Ly9leGFtcGxlLmNvbScpIHJldHVybiBcIm9rXCI7XG4gICAgICAgICAgICBpZiAoIXVIcmVmLnBhdGhuYW1lKSByZXR1cm4gXCJva1wiO1xuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBpcyBsb2NhbCAke2hyZWZ9ICR7bGlua3RleHR9IHVIcmVmICR7dUhyZWYucGF0aG5hbWV9YCk7XG5cbiAgICAgICAgICAgIC8qIGlmIChtZXRhZGF0YS5kb2N1bWVudC5wYXRoID09PSAnaW5kZXguaHRtbC5tZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBtZXRhZGF0YS5kb2N1bWVudC5wYXRoICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gaHJlZiAke2hyZWZ9IHVIcmVmLnBhdGhuYW1lICR7dUhyZWYucGF0aG5hbWV9IHRoaXMuY29uZmlnLnJvb3RfdXJsICR7dGhpcy5jb25maWcucm9vdF91cmx9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJC5odG1sKCkpO1xuICAgICAgICAgICAgfSAqL1xuXG4gICAgICAgICAgICAvLyBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcblxuICAgICAgICAgICAgLy8gV2UgaGF2ZSBkZXRlcm1pbmVkIHRoaXMgaXMgYSBsb2NhbCBocmVmLlxuICAgICAgICAgICAgLy8gRm9yIHJlZmVyZW5jZSB3ZSBuZWVkIHRoZSBhYnNvbHV0ZSBwYXRobmFtZSBvZiB0aGUgaHJlZiB3aXRoaW5cbiAgICAgICAgICAgIC8vIHRoZSBwcm9qZWN0LiAgRm9yIGV4YW1wbGUgdG8gcmV0cmlldmUgdGhlIHRpdGxlIHdoZW4gd2UncmUgZmlsbGluZ1xuICAgICAgICAgICAgLy8gaW4gZm9yIGFuIGVtcHR5IDxhPiB3ZSBuZWVkIHRoZSBhYnNvbHV0ZSBwYXRobmFtZS5cblxuICAgICAgICAgICAgLy8gTWFyayB0aGlzIGxpbmsgYXMgaGF2aW5nIGJlZW4gcHJvY2Vzc2VkLlxuICAgICAgICAgICAgLy8gVGhlIHB1cnBvc2UgaXMgaWYgTWFoYWJodXRhIHJ1bnMgbXVsdGlwbGUgcGFzc2VzLFxuICAgICAgICAgICAgLy8gdG8gbm90IHByb2Nlc3MgdGhlIGxpbmsgbXVsdGlwbGUgdGltZXMuXG4gICAgICAgICAgICAvLyBCZWZvcmUgYWRkaW5nIHRoaXMgLSB3ZSBzYXcgdGhpcyBNdW5nZXIgdGFrZSBhcyBtdWNoXG4gICAgICAgICAgICAvLyBhcyA4MDBtcyB0byBleGVjdXRlLCBmb3IgRVZFUlkgcGFzcyBtYWRlIGJ5IE1haGFiaHV0YS5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBZGRpbmcgdGhpcyBhdHRyaWJ1dGUsIGFuZCBjaGVja2luZyBmb3IgaXQgaW4gdGhlIHNlbGVjdG9yLFxuICAgICAgICAgICAgLy8gbWVhbnMgd2Ugb25seSBwcm9jZXNzIHRoZSBsaW5rIG9uY2UuXG4gICAgICAgICAgICAkbGluay5hdHRyKCdtdW5nZWQnLCAneWVzJyk7XG5cbiAgICAgICAgICAgIGxldCBhYnNvbHV0ZVBhdGggPSByZXNvbHZlVnBhdGgobWV0YWRhdGEuZG9jdW1lbnQucGF0aCwgaHJlZik7XG5cbiAgICAgICAgICAgIC8vIFRoZSBpZGVhIGZvciB0aGlzIHNlY3Rpb24gaXMgdG8gZW5zdXJlIGFsbCBsb2NhbCBocmVmJ3MgYXJlIFxuICAgICAgICAgICAgLy8gZm9yIGEgcmVsYXRpdmUgcGF0aCByYXRoZXIgdGhhbiBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAvLyBIZW5jZSB3ZSB1c2UgdGhlIHJlbGF0aXZlIG1vZHVsZSB0byBjb21wdXRlIHRoZSByZWxhdGl2ZSBwYXRoXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gRXhhbXBsZTpcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgL2luZGV4Lmh0bWwgaW4ge1xuICAgICAgICAgICAgLy8gIGJhc2VkaXI6ICcvVm9sdW1lcy9FeHRyYS9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL3Rlc3QvZG9jdW1lbnRzJyxcbiAgICAgICAgICAgIC8vICByZWxwYXRoOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sLm1kJyxcbiAgICAgICAgICAgIC8vICByZWxyZW5kZXI6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwnLFxuICAgICAgICAgICAgLy8gIHBhdGg6ICdoaWVyL2RpcjEvZGlyMi9uZXN0ZWQtYW5jaG9yLmh0bWwubWQnLFxuICAgICAgICAgICAgLy8gIHJlbmRlclRvOiAnaGllci9kaXIxL2RpcjIvbmVzdGVkLWFuY2hvci5odG1sJ1xuICAgICAgICAgICAgLy8gfSB0byAuLi8uLi8uLi9pbmRleC5odG1sXG4gICAgICAgICAgICAvL1xuXG4gICAgICAgICAgICAvLyBPbmx5IHJlbGF0aXZpemUgaWYgZGVzaXJlZFxuICAgICAgICAgICAgaWYgKHRoaXMuYXJyYXkub3B0aW9ucy5yZWxhdGl2aXplQm9keUxpbmtzXG4gICAgICAgICAgICAgJiYgcGF0aC5pc0Fic29sdXRlKGhyZWYpKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5ld0hyZWYgPSByZWxhdGl2ZShgLyR7bWV0YWRhdGEuZG9jdW1lbnQucmVuZGVyVG99YCwgaHJlZik7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cignaHJlZicsIG5ld0hyZWYpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGRlLWFic29sdXRlIGhyZWYgJHtocmVmfSBpbiAke3V0aWwuaW5zcGVjdChtZXRhZGF0YS5kb2N1bWVudCl9IHRvICR7bmV3SHJlZn1gKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vayB0byBzZWUgaWYgaXQncyBhbiBhc3NldCBmaWxlXG4gICAgICAgICAgICBsZXQgZm91bmRBc3NldDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IGF3YWl0IGFzc2V0cy5maW5kKGFic29sdXRlUGF0aCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgZm91bmRBc3NldCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3VuZEFzc2V0KSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgYXNzZXQgJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IGZpbmRBc3NldCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcblxuICAgICAgICAgICAgLy8gQXNrIHBsdWdpbnMgaWYgdGhlIGhyZWYgaXMgb2theVxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmFza1BsdWdpbnNMZWdpdExvY2FsSHJlZihhYnNvbHV0ZVBhdGgpKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgaXMgbGVnaXQgbG9jYWwgaHJlZiAke2Fic29sdXRlUGF0aH1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGxpbmsgaGFzIGEgYm9keSwgdGhlbiBkb24ndCBtb2RpZnkgaXRcbiAgICAgICAgICAgIGlmICgobGlua3RleHQgJiYgbGlua3RleHQubGVuZ3RoID4gMCAmJiBsaW5rdGV4dCAhPT0gYWJzb2x1dGVQYXRoKVxuICAgICAgICAgICAgICAgIHx8ICgkbGluay5jaGlsZHJlbigpLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgc2tpcHBpbmcgJHthYnNvbHV0ZVBhdGh9IHcvICR7dXRpbC5pbnNwZWN0KGxpbmt0ZXh0KX0gY2hpbGRyZW49ICR7JGxpbmsuY2hpbGRyZW4oKX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEb2VzIGl0IGV4aXN0IGluIGRvY3VtZW50cyBkaXI/XG4gICAgICAgICAgICBpZiAoYWJzb2x1dGVQYXRoID09PSAnLycpIHtcbiAgICAgICAgICAgICAgICBhYnNvbHV0ZVBhdGggPSAnL2luZGV4Lmh0bWwnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQoYWJzb2x1dGVQYXRoKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmRSZW5kZXJzVG8gJHthYnNvbHV0ZVBhdGh9ICR7dXRpbC5pbnNwZWN0KGZvdW5kKX1gKTtcbiAgICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgV0FSTklORzogRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSBhYnNvbHV0ZVBhdGggJHthYnNvbHV0ZVBhdGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gJHtocmVmfSBmaW5kUmVuZGVyc1RvICR7KG5ldyBEYXRlKCkgLSBzdGFydFRpbWUpIC8gMTAwMH0gc2Vjb25kc2ApO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgZGlyZWN0b3J5LCB0aGVyZSBtaWdodCBiZSAvcGF0aC90by9pbmRleC5odG1sIHNvIHdlIHRyeSBmb3IgdGhhdC5cbiAgICAgICAgICAgIC8vIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aCB3b3VsZCBmYWlsIG9uIGp1c3QgL3BhdGgvdG8gYnV0IHN1Y2NlZWRcbiAgICAgICAgICAgIC8vIG9uIC9wYXRoL3RvL2luZGV4Lmh0bWxcbiAgICAgICAgICAgIGlmIChmb3VuZC5pc0RpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gYXdhaXQgZG9jdW1lbnRzLmZpbmQocGF0aC5qb2luKGFic29sdXRlUGF0aCwgXCJpbmRleC5odG1sXCIpKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRGlkIG5vdCBmaW5kICR7aHJlZn0gaW4gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcuZG9jdW1lbnREaXJzKX0gaW4gJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSBsb29rIGludG8gZmlsbGluZyBlbXB0aW5lc3Mgd2l0aCB0aXRsZVxuXG4gICAgICAgICAgICBsZXQgZG9jbWV0YSA9IGZvdW5kLmRvY01ldGFkYXRhO1xuICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoISRsaW5rLmF0dHIoJ3RpdGxlJykgJiYgZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgJGxpbmsuYXR0cigndGl0bGUnLCBkb2NtZXRhLnRpdGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChkb2NtZXRhICYmIGRvY21ldGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7ZG9jbWV0YS50aXRsZX1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCBjaGFuZ2VkIGxpbmsgdGV4dCAke2hyZWZ9IHRvICR7aHJlZn1gKTtcbiAgICAgICAgICAgICAgICAkbGluay50ZXh0KGhyZWYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKlxuICAgICAgICAgICAgdmFyIHJlbmRlcmVyID0gdGhpcy5jb25maWcuZmluZFJlbmRlcmVyUGF0aChmb3VuZC52cGF0aCk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhgQW5jaG9yQ2xlYW51cCAke21ldGFkYXRhLmRvY3VtZW50LnBhdGh9ICR7aHJlZn0gZmluZFJlbmRlcmVyUGF0aCAkeyhuZXcgRGF0ZSgpIC0gc3RhcnRUaW1lKSAvIDEwMDB9IHNlY29uZHNgKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlciAmJiByZW5kZXJlci5tZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBkb2NtZXRhID0gZm91bmQuZG9jTWV0YWRhdGE7XG4gICAgICAgICAgICAgICAgLyogdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvY21ldGEgPSBhd2FpdCByZW5kZXJlci5tZXRhZGF0YShmb3VuZC5mb3VuZERpciwgZm91bmQuZm91bmRQYXRoV2l0aGluRGlyKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCByZXRyaWV2ZSBkb2N1bWVudCBtZXRhZGF0YSBmb3IgJHtmb3VuZC5mb3VuZERpcn0gJHtmb3VuZC5mb3VuZFBhdGhXaXRoaW5EaXJ9IGJlY2F1c2UgJHtlcnJ9YCk7XG4gICAgICAgICAgICAgICAgfSAqLS0vXG4gICAgICAgICAgICAgICAgLy8gQXV0b21hdGljYWxseSBhZGQgYSB0aXRsZT0gYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgaWYgKCEkbGluay5hdHRyKCd0aXRsZScpICYmIGRvY21ldGEgJiYgZG9jbWV0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAkbGluay5hdHRyKCd0aXRsZScsIGRvY21ldGEudGl0bGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZG9jbWV0YSAmJiBkb2NtZXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgICAgICRsaW5rLnRleHQoZG9jbWV0YS50aXRsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGBBbmNob3JDbGVhbnVwIGZpbmlzaGVkYCk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYEFuY2hvckNsZWFudXAgJHttZXRhZGF0YS5kb2N1bWVudC5wYXRofSAke2hyZWZ9IERPTkUgJHsobmV3IERhdGUoKSAtIHN0YXJ0VGltZSkgLyAxMDAwfSBzZWNvbmRzYCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwib2tcIjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRG9uJ3QgYm90aGVyIHRocm93aW5nIGFuIGVycm9yLiAgSnVzdCBmaWxsIGl0IGluIHdpdGhcbiAgICAgICAgICAgICAgICAvLyBzb21ldGhpbmcuXG4gICAgICAgICAgICAgICAgJGxpbmsudGV4dChocmVmKTtcbiAgICAgICAgICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCBmaWxsIGluIGVtcHR5ICdhJyBlbGVtZW50IGluICR7bWV0YWRhdGEuZG9jdW1lbnQucGF0aH0gd2l0aCBocmVmICR7aHJlZn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICovXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJva1wiO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vICBNQUhBRlVOQ1MgRk9SIEZJTkFMIFBBU1NcblxuLyoqXG4gKiBSZW1vdmVzIHRoZSA8Y29kZT5tdW5nZWQ9eWVzPC9jb2RlPiBhdHRyaWJ1dGUgdGhhdCBpcyBhZGRlZFxuICogYnkgPGNvZGU+QW5jaG9yQ2xlYW51cDwvY29kZT4uXG4gKi9cbmNsYXNzIE11bmdlZEF0dHJSZW1vdmVyIGV4dGVuZHMgTXVuZ2VyIHtcbiAgICBnZXQgc2VsZWN0b3IoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBnZXQgZWxlbWVudE5hbWUoKSB7IHJldHVybiAnaHRtbCBib2R5IGFbbXVuZ2VkXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgICRlbGVtZW50LnJlbW92ZUF0dHIoJ211bmdlZCcpO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxufVxuXG4vKipcbiAqIEhhbmRsZXMgdGhlIHJlY29tbWVuZGF0aW9ucyBpbjpcbiAqIGh0dHBzOi8vamF2YXNjcmlwdC5wbGFpbmVuZ2xpc2guaW8vb25lLWxpbmUtb2YtaHRtbC10aGF0LW1ha2VzLWV4dGVybmFsLWxpbmtzLXNhZmVyLTk1ZmU0YmE2ZmYyOFxuICovXG5jbGFzcyBCbGFua0xpbmtEZWZhbmdlciBleHRlbmRzIE11bmdlciB7XG4gICAgZ2V0IHNlbGVjdG9yKCkgeyByZXR1cm4gJ2h0bWwgYm9keSBhW3RhcmdldD1fYmxhbmtdJzsgfVxuICAgIGdldCBlbGVtZW50TmFtZSgpIHsgcmV0dXJuICdodG1sIGJvZHkgYVt0YXJnZXQ9X2JsYW5rXSc7IH1cbiAgICBhc3luYyBwcm9jZXNzKCQsICRlbGVtZW50LCBtZXRhZGF0YSwgc2V0RGlydHk6IEZ1bmN0aW9uLCBkb25lPzogRnVuY3Rpb24pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkZWxlbWVudCk7XG4gICAgICAgIHRoaXMuYWthc2hhLmxpbmtSZWxTZXRBdHRyKCRlbGVtZW50LCAnbm9vcGVuZXInLCB0cnVlKTtcbiAgICAgICAgdGhpcy5ha2FzaGEubGlua1JlbFNldEF0dHIoJGVsZW1lbnQsICdub3JlZmVycmVyJywgdHJ1ZSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBDaGFuZ2VkIHJlbCBhdHRyIHRvICR7JGVsZW1lbnQuYXR0cigncmVsJyl9YCk7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8gTnVuanVja3MgRXh0ZW5zaW9uc1xuXG4vLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zb2Z0b25pYy9udW5qdWNrcy1pbmNsdWRlLXdpdGgvdHJlZS9tYXN0ZXJcblxuY2xhc3Mgc3R5bGVzaGVldHNFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtzdHlsZXNoZWV0cycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYHN0eWxlc2hlZXRzRXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBzdHlsZXNoZWV0c0V4dGVuc2lvbiAtIHBhcnNlYCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBnZXQgdGhlIHRhZyB0b2tlblxuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcblxuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYXJncyBhbmQgbW92ZSBhZnRlciB0aGUgYmxvY2sgZW5kLiBwYXNzaW5nIHRydWVcbiAgICAgICAgICAgIC8vIGFzIHRoZSBzZWNvbmQgYXJnIGlzIHJlcXVpcmVkIGlmIHRoZXJlIGFyZSBubyBwYXJlbnRoZXNlc1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBwYXJzZXIucGFyc2VTaWduYXR1cmUobnVsbCwgdHJ1ZSk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQodG9rLnZhbHVlKTtcblxuICAgICAgICAgICAgLy8gcGFyc2UgdGhlIGJvZHkgYW5kIHBvc3NpYmx5IHRoZSBlcnJvciBibG9jaywgd2hpY2ggaXMgb3B0aW9uYWxcbiAgICAgICAgICAgIHZhciBib2R5ID0gcGFyc2VyLnBhcnNlVW50aWxCbG9ja3MoJ2VuZGFrc3R5bGVzaGVldHMnKTtcblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keV0pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYHN0eWxlc2hlZXRzRXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgc3R5bGVzaGVldHNFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb1N0eWxlc2hlZXRzKGNvbnRleHQuY3R4KTtcbiAgICB9O1xufVxuXG5jbGFzcyBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIHtcbiAgICB0YWdzO1xuICAgIGNvbmZpZztcbiAgICBwbHVnaW47XG4gICAgbmprUmVuZGVyZXI7XG4gICAgY29uc3RydWN0b3IoY29uZmlnLCBwbHVnaW4sIG5qa1JlbmRlcmVyKSB7XG4gICAgICAgIHRoaXMudGFncyA9IFsgJ2FraGVhZGVyanMnIF07XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICAgICAgdGhpcy5uamtSZW5kZXJlciA9IG5qa1JlbmRlcmVyO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uICR7dXRpbC5pbnNwZWN0KHRoaXMudGFncyl9ICR7dXRpbC5pbnNwZWN0KHRoaXMuY29uZmlnKX0gJHt1dGlsLmluc3BlY3QodGhpcy5wbHVnaW4pfWApO1xuICAgIH1cblxuICAgIHBhcnNlKHBhcnNlciwgbm9kZXMsIGxleGVyKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGBpbiBoZWFkZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBwYXJzZXIubmV4dFRva2VuKCk7XG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZW5kYWtoZWFkZXJqcycpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IG5vZGVzLkNhbGxFeHRlbnNpb24odGhpcywgJ3J1bicsIGFyZ3MsIFtib2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgaGVhZGVySmF2YVNjcmlwdEV4dGVuc2lvbiBgLCBlcnIuc3RhY2spO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcnVuKGNvbnRleHQsIGFyZ3MsIGJvZHkpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGhlYWRlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QoY29udGV4dCl9YCk7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWdpbi5kb0hlYWRlckphdmFTY3JpcHQoY29udGV4dC5jdHgpO1xuICAgIH07XG59XG5cbmNsYXNzIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24ge1xuICAgIHRhZ3M7XG4gICAgY29uZmlnO1xuICAgIHBsdWdpbjtcbiAgICBuamtSZW5kZXJlcjtcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcsIHBsdWdpbiwgbmprUmVuZGVyZXIpIHtcbiAgICAgICAgdGhpcy50YWdzID0gWyAnYWtmb290ZXJqcycgXTtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICAgICAgICB0aGlzLm5qa1JlbmRlcmVyID0gbmprUmVuZGVyZXI7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gJHt1dGlsLmluc3BlY3QodGhpcy50YWdzKX0gJHt1dGlsLmluc3BlY3QodGhpcy5jb25maWcpfSAke3V0aWwuaW5zcGVjdCh0aGlzLnBsdWdpbil9YCk7XG4gICAgfVxuXG4gICAgcGFyc2UocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYGluIGZvb3RlckphdmFTY3JpcHRFeHRlbnNpb24gLSBwYXJzZWApO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvayA9IHBhcnNlci5uZXh0VG9rZW4oKTtcbiAgICAgICAgICAgIHZhciBhcmdzID0gcGFyc2VyLnBhcnNlU2lnbmF0dXJlKG51bGwsIHRydWUpO1xuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKHRvay52YWx1ZSk7XG4gICAgICAgICAgICB2YXIgYm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha2Zvb3RlcmpzJyk7XG4gICAgICAgICAgICBwYXJzZXIuYWR2YW5jZUFmdGVyQmxvY2tFbmQoKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgbm9kZXMuQ2FsbEV4dGVuc2lvbih0aGlzLCAncnVuJywgYXJncywgW2JvZHldKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBmb290ZXJKYXZhU2NyaXB0RXh0ZW5zaW9uIGAsIGVyci5zdGFjayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBydW4oY29udGV4dCwgYXJncywgYm9keSkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhgZm9vdGVySmF2YVNjcmlwdEV4dGVuc2lvbiAke3V0aWwuaW5zcGVjdChjb250ZXh0KX1gKTtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Z2luLmRvRm9vdGVySmF2YVNjcmlwdChjb250ZXh0LmN0eCk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gdGVzdEV4dGVuc2lvbigpIHtcbiAgICB0aGlzLnRhZ3MgPSBbICdha25qa3Rlc3QnIF07XG5cbiAgICB0aGlzLnBhcnNlID0gZnVuY3Rpb24ocGFyc2VyLCBub2RlcywgbGV4ZXIpIHtcbmNvbnNvbGUubG9nKGBpbiB0ZXN0RXh0ZW5zaW9uIC0gcGFyc2VgKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFnIHRva2VuXG4gICAgICAgICAgICB2YXIgdG9rID0gcGFyc2VyLm5leHRUb2tlbigpO1xuXG5cbiAgICAgICAgICAgIC8vIHBhcnNlIHRoZSBhcmdzIGFuZCBtb3ZlIGFmdGVyIHRoZSBibG9jayBlbmQuIHBhc3NpbmcgdHJ1ZVxuICAgICAgICAgICAgLy8gYXMgdGhlIHNlY29uZCBhcmcgaXMgcmVxdWlyZWQgaWYgdGhlcmUgYXJlIG5vIHBhcmVudGhlc2VzXG4gICAgICAgICAgICB2YXIgYXJncyA9IHBhcnNlci5wYXJzZVNpZ25hdHVyZShudWxsLCB0cnVlKTtcbiAgICAgICAgICAgIHBhcnNlci5hZHZhbmNlQWZ0ZXJCbG9ja0VuZCh0b2sudmFsdWUpO1xuXG4gICAgICAgICAgICAvLyBwYXJzZSB0aGUgYm9keSBhbmQgcG9zc2libHkgdGhlIGVycm9yIGJsb2NrLCB3aGljaCBpcyBvcHRpb25hbFxuICAgICAgICAgICAgdmFyIGJvZHkgPSBwYXJzZXIucGFyc2VVbnRpbEJsb2NrcygnZXJyb3InLCAnZW5kYWtuamt0ZXN0Jyk7XG4gICAgICAgICAgICB2YXIgZXJyb3JCb2R5ID0gbnVsbDtcblxuICAgICAgICAgICAgaWYocGFyc2VyLnNraXBTeW1ib2woJ2Vycm9yJykpIHtcbiAgICAgICAgICAgICAgICBwYXJzZXIuc2tpcChsZXhlci5UT0tFTl9CTE9DS19FTkQpO1xuICAgICAgICAgICAgICAgIGVycm9yQm9keSA9IHBhcnNlci5wYXJzZVVudGlsQmxvY2tzKCdlbmRha25qa3Rlc3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyc2VyLmFkdmFuY2VBZnRlckJsb2NrRW5kKCk7XG5cbiAgICAgICAgICAgIC8vIFNlZSBhYm92ZSBmb3Igbm90ZXMgYWJvdXQgQ2FsbEV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBub2Rlcy5DYWxsRXh0ZW5zaW9uKHRoaXMsICdydW4nLCBhcmdzLCBbYm9keSwgZXJyb3JCb2R5XSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgdGVzdEV4dGlvbnNpb24gYCwgZXJyLnN0YWNrKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIHRoaXMucnVuID0gZnVuY3Rpb24oY29udGV4dCwgdXJsLCBib2R5LCBlcnJvckJvZHkpIHtcbiAgICAgICAgY29uc29sZS5sb2coYGFrbmprdGVzdCAke3V0aWwuaW5zcGVjdChjb250ZXh0KX0gJHt1dGlsLmluc3BlY3QodXJsKX0gJHt1dGlsLmluc3BlY3QoYm9keSl9ICR7dXRpbC5pbnNwZWN0KGVycm9yQm9keSl9YCk7XG4gICAgfTtcblxufVxuIl19