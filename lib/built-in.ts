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

import fsp from 'node:fs/promises';
import url from 'node:url';
import path from 'node:path';
import util from 'node:util';
import sharp from 'sharp';
import * as uuid from 'uuid';
const uuidv1 = uuid.v1;
import * as render from './render.js';
import { Plugin } from './Plugin.js';
import relative from 'relative';
import hljs from 'highlight.js';
import mahabhuta from 'mahabhuta';
import mahaMetadata from 'mahabhuta/maha/metadata.js';
import mahaPartial from 'mahabhuta/maha/partial.js';
import Renderers from '@akashacms/renderers';
import {encode} from 'html-entities';
import { Configuration, CustomElement, Munger, PageProcessor, javaScriptItem } from './index.js';

const pluginName = "akashacms-builtin";

export class BuiltInPlugin extends Plugin {
	constructor() {
		super(pluginName);
        this.#resize_queue = [];

	}

    #config;
    #resize_queue;

	configure(config: Configuration, options) {
        this.#config = config;
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

        const njk = this.config.findRendererName('.html.njk') as Renderers.NunjucksRenderer;
        njk.njkenv().addExtension('akstylesheets',
            new stylesheetsExtension(this.config, this, njk)
        );
        njk.njkenv().addExtension('akheaderjs',
            new headerJavaScriptExtension(this.config, this, njk)
        );
        njk.njkenv().addExtension('akfooterjs',
            new footerJavaScriptExtension(this.config, this, njk)
        );

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

    get config() { return this.#config; }
    // get resizequeue() { return this.#resize_queue; }

    get resizequeue() { return this.#resize_queue; }
    
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

    addImageToResize(src: string, resizewidth: number, resizeto: string, docPath: string) {
        // console.log(`addImageToResize ${src} resizewidth ${resizewidth} resizeto ${resizeto}`)
        this.#resize_queue.push({ src, resizewidth, resizeto, docPath });
    }

    async onSiteRendered(config) {

        const documents = this.akasha.filecache.documentsCache;
        // await documents.isReady();
        const assets = this.akasha.filecache.assetsCache;
        // await assets.isReady();
        while (Array.isArray(this.#resize_queue)
            && this.#resize_queue.length > 0) {

            let toresize = this.#resize_queue.pop();

            let img2resize;
            if (!path.isAbsolute(toresize.src)) {
                img2resize = path.normalize(path.join(
                    path.dirname(toresize.docPath),
                    toresize.src
                ));
            } else {
                img2resize = toresize.src;
            }

            let srcfile = undefined;

            let found = await assets.find(img2resize);
            if (found) {
                srcfile = found.fspath;
            } else {
                found = await documents.find(img2resize);
                srcfile = found ? found.fspath : undefined;
            }
            if (!srcfile) throw new Error(`akashacms-builtin: Did not find source file for image to resize ${img2resize}`);

            try {
                let img = await sharp(srcfile);
                let resized = await img.resize(Number.parseInt(toresize.resizewidth));
                // We need to compute the correct destination path
                // for the resized image
                let imgtoresize = toresize.resizeto ? toresize.resizeto : img2resize;
                let resizedest;
                if (path.isAbsolute(imgtoresize)) {
                    resizedest = path.join(config.renderDestination, imgtoresize);
                } else {
                    // This is for relative image paths, hence it needs to be
                    // relative to the docPath
                    resizedest = path.join(
                            config.renderDestination,
                            path.dirname(toresize.docPath),
                            imgtoresize);
                }

                // Make sure the destination directory exists
                await fsp.mkdir(path.dirname(resizedest), { recursive: true });
                await resized.toFile(resizedest);
            } catch (e) {
                throw new Error(`built-in: Image resize failed for ${srcfile} (toresize ${util.inspect(toresize)} found ${util.inspect(found)}) because ${e}`);
            }
        }
    }

}

export const mahabhutaArray = function(
            options,
            config?: Configuration,
            akasha?: any,
            plugin?: Plugin
) {
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

function _doStylesheets(metadata, options, config: Configuration) {
    // console.log(`_doStylesheets ${util.inspect(metadata)}`);

    var scripts;
    if (typeof metadata.headerStylesheetsAdd !== "undefined") {
        scripts = config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
    } else {
        scripts = config.scripts ? config.scripts.stylesheets : undefined;
    }
    // console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(config.scripts)} ${util.inspect(scripts)}`);

    if (!options) throw new Error('_doStylesheets no options');
    if (!config) throw new Error('_doStylesheets no config');

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
                    return `media="${encode(media)}"`
                } else {
                    return '';
                }
            };
            let ht = `<link rel="stylesheet" type="text/css" href="${encode(stylehref)}" ${doStyleMedia(style.media)}/>`
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

function _doJavaScripts(
    metadata,
    scripts: javaScriptItem[],
    options,
    config: Configuration
) {
	var ret = '';
	if (!scripts) return ret;

    if (!options) throw new Error('_doJavaScripts no options');
    if (!config) throw new Error('_doJavaScripts no config');

    for (var script of scripts) {
		if (!script.href && !script.script) {
			throw new Error(`Must specify either href or script in ${util.inspect(script)}`);
		}
        if (!script.script) script.script = '';

        const doType = (lang) => {
            if (lang) {
                return `type="${encode(lang)}"`;
            } else {
                return '';
            }
        }
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
            } else {
                return '';
            }
        };
        let ht = `<script ${doType(script.lang)} ${doHref(script.href)}>${script.script}</script>`;
        ret += ht;
    }
	return ret;
}

function _doHeaderJavaScript(metadata, options, config: Configuration) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddTop !== "undefined") {
		scripts = config.scripts.javaScriptTop.concat(metadata.headerJavaScriptAddTop);
	} else {
		scripts = config.scripts ? config.scripts.javaScriptTop : undefined;
	}
	// console.log(`_doHeaderJavaScript ${util.inspect(scripts)}`);
	// console.log(`_doHeaderJavaScript ${util.inspect(config.scripts)}`);
	return _doJavaScripts(metadata, scripts, options, config);
}

function _doFooterJavaScript(metadata, options, config: Configuration) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
		scripts = config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
	} else {
		scripts = config.scripts ? config.scripts.javaScriptBottom : undefined;
	}
	return _doJavaScripts(metadata, scripts, options, config);
}

class StylesheetsElement extends CustomElement {
	get elementName() { return "ak-stylesheets"; }
	async process($element, metadata, setDirty: Function, done?: Function) {
		let ret =  _doStylesheets(metadata, this.array.options, this.config);
        // console.log(`StylesheetsElement `, ret);
        return ret;
	}
}

class HeaderJavaScript extends CustomElement {
	get elementName() { return "ak-headerJavaScript"; }
	async process($element, metadata, setDirty: Function, done?: Function) {
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
    async process($, $link, metadata, dirty): Promise<string> {
        // Only relativize if desired
        if (!this.array.options.relativizeHeadLinks) return;
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
    async process($, $link, metadata, dirty): Promise<string> {
        // Only relativize if desired
        if (!this.array.options.relativizeScriptLinks) return;
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
		return this.akasha.partial(this.config,
                                            "ak_teaser.html.njk", {
			teaser: typeof metadata["ak-teaser"] !== "undefined"
				? metadata["ak-teaser"] : metadata.teaser
		});
        } catch (e) {
            console.error(`InsertTeaser caught error `, e);
            throw e;
        }
	}
}

class AkBodyClassAdd extends PageProcessor {
	async process($, metadata, dirty): Promise<string> {
		if (typeof metadata.akBodyClassAdd !== 'undefined'
		 && metadata.akBodyClassAdd != ''
		 && $('html body').get(0)) {
            return new Promise((resolve, reject) => {
				if (!$('html body').hasClass(metadata.akBodyClassAdd)) {
					$('html body').addClass(metadata.akBodyClassAdd);
				}
				resolve(undefined);
			});
		} else return Promise.resolve('');
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
        } else {
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
            } else {
                return 'class="hljs"';
            }
        };
        const doID = (id) => {
            if (id) {
                return `id="${encode(id)}"`;
            } else {
                return '';
            }
        }
        const doCode = (lang, code) => {
            if (lang && lang != '') {
                return hljs.highlight(code, {
                    language: lang
                }).value;
            } else {
                return hljs.highlightAuto(code).value;
            }
        }
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
        if (!template) template = 'ak_figimg.html.njk';
        const href    = $element.attr('href');
        if (!href) throw new Error('fig-img must receive an href');
        const clazz   = $element.attr('class');
        const id      = $element.attr('id');
        const caption = $element.html();
        const width   = $element.attr('width');
        const style   = $element.attr('style');
        const dest    = $element.attr('dest');
        return this.akasha.partial(
            this.config, template, {
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
                :  "ak_figimg.html.njk";
        const id = $element.attr('id');
        const clazz = $element.attr('class');
        const style = $element.attr('style');
        const width = $element.attr('width');
        const src = $element.attr('src');
        const dest    = $element.attr('dest');
        const resizewidth = $element.attr('resize-width');
        const resizeto = $element.attr('resize-to');
        const content = $element.attr('caption')
                ? $element.attr('caption')
                : "";
        
        return this.akasha.partial(
            this.config, template, {
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
        if (!template) template = 'ak_show-content.html.njk';
        let href    = $element.attr('href');
        if (!href) return Promise.reject(new Error('show-content must receive an href'));
        const clazz   = $element.attr('class');
        const id      = $element.attr('id');
        const caption = $element.html();
        const width   = $element.attr('width');
        const style   = $element.attr('style');
        const dest    = $element.attr('dest');
        const contentImage = $element.attr('content-image');
        let doc2read;
        if (! href.startsWith('/')) {
            let dir = path.dirname(metadata.document.path);
            doc2read = path.join('/', dir, href);
        } else {
            doc2read = href;
        }
        // console.log(`ShowContent ${util.inspect(metadata.document)} ${doc2read}`);
        const documents = this.akasha.filecache.documentsCache;
        const doc = await documents.find(doc2read);
        const data = {
            href, clazz, id, caption, width, style, dest, contentImage,
            document: doc
        };
        let ret = await this.akasha.partial(
                this.config, template, data);
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

    async process($, $link, metadata, dirty): Promise<string> {
        let count = $link.attr('count')
                    ? Number.parseInt($link.attr('count'))
                    : 1;
        const clazz = $link.attr('class');
        const id    = $link.attr('id');
        const tn    = $link.attr('tag-name')
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
        if (id) $newItem.attr('id', id);
        else $newItem.removeAttr('id');
        if (clazz) $newItem.addClass(clazz);
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
        var href     = $link.attr('href');
        var linktext = $link.text();
        const documents = this.akasha.filecache.documentsCache;
        // await documents.isReady();
        const assets = this.akasha.filecache.assetsCache;
        // await assets.isReady();
        // console.log(`AnchorCleanup ${href} ${linktext}`);
        if (href && href !== '#') {
            const uHref = new URL(href, 'http://example.com');
            if (uHref.origin !== 'http://example.com') return "ok";
            if (!uHref.pathname) return "ok";

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
            } else {
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
            } catch (e) {
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
            } else {
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
        } else {
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
    async process($, $element, metadata, setDirty: Function, done?: Function): Promise<string> {
        // console.log($element);
        $element.removeAttr('munged');
        return '';
    }
}

////////////// Nunjucks Extensions

// From https://github.com/softonic/nunjucks-include-with/tree/master

class stylesheetsExtension {
    tags;
    config;
    plugin;
    njkRenderer;
    constructor(config, plugin, njkRenderer) {
        this.tags = [ 'akstylesheets' ];
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
        } catch (err) {
            console.error(`stylesheetsExtension `, err.stack);
        }
    }

    run(context, args, body) {
        // console.log(`stylesheetsExtension ${util.inspect(context)}`);
        return this.plugin.doStylesheets(context.ctx);
    };
}

class headerJavaScriptExtension {
    tags;
    config;
    plugin;
    njkRenderer;
    constructor(config, plugin, njkRenderer) {
        this.tags = [ 'akheaderjs' ];
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
        } catch (err) {
            console.error(`headerJavaScriptExtension `, err.stack);
        }
    }

    run(context, args, body) {
        // console.log(`headerJavaScriptExtension ${util.inspect(context)}`);
        return this.plugin.doHeaderJavaScript(context.ctx);
    };
}

class footerJavaScriptExtension {
    tags;
    config;
    plugin;
    njkRenderer;
    constructor(config, plugin, njkRenderer) {
        this.tags = [ 'akfooterjs' ];
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
        } catch (err) {
            console.error(`footerJavaScriptExtension `, err.stack);
        }
    }

    run(context, args, body) {
        // console.log(`footerJavaScriptExtension ${util.inspect(context)}`);
        return this.plugin.doFooterJavaScript(context.ctx);
    };
}

function testExtension() {
    this.tags = [ 'aknjktest' ];

    this.parse = function(parser, nodes, lexer) {
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

            if(parser.skipSymbol('error')) {
                parser.skip(lexer.TOKEN_BLOCK_END);
                errorBody = parser.parseUntilBlocks('endaknjktest');
            }

            parser.advanceAfterBlockEnd();

            // See above for notes about CallExtension
            return new nodes.CallExtension(this, 'run', args, [body, errorBody]);
        } catch (err) {
            console.error(`testExtionsion `, err.stack);
        }
    };


    this.run = function(context, url, body, errorBody) {
        console.log(`aknjktest ${util.inspect(context)} ${util.inspect(url)} ${util.inspect(body)} ${util.inspect(errorBody)}`);
    };

}