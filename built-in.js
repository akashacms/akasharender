/**
 *
 * Copyright 2014-2019 David Herron
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

'use strict';

const fs    = require('fs-extra');
const url   = require('url');
const path  = require('path');
const util  = require('util');
const sharp = require('sharp');
const uuidv1 = require('uuid/v1');
const documents = require('./documents');
const filez = require('./filez');
const render = require('./render');
const Plugin = require('./Plugin');
const relative = require('relative');
const hljs = require('highlight.js');
// const akasha   = require('./index');
const mahabhuta = require('mahabhuta');
const mahaMetadata = require('mahabhuta/maha/metadata');
const mahaPartial = require('mahabhuta/maha/partial');

const pluginName = "akashacms-builtin";

const _plugin_config = Symbol('config');
const _plugin_options = Symbol('options');
const _plugin_resizequeue = Symbol('resizequeue');

module.exports = class BuiltInPlugin extends Plugin {
	constructor() {
		super(pluginName);
	}

	configure(config, options) {
        this[_plugin_config] = config;
        this[_plugin_options] = options;
        options.config = config;
        let moduleDirname;
        try {
            moduleDirname = path.dirname(require.resolve('akasharender'));
        } catch (e) {
            moduleDirname = __dirname;
        }
        config.addPartialsDir(path.join(moduleDirname, 'partials'));
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
        config.addMahabhuta(module.exports.mahabhutaArray(options));

        // TODO These seem to not be used
        // if (!config.builtin) config.builtin = {};
        // if (!config.builtin.suppress) config.builtin.suppress = {};
        this[_plugin_resizequeue] = [];
    }

    get config() { return this[_plugin_config]; }
    get options() { return this[_plugin_options]; }
    get resizequeue() { return this[_plugin_resizequeue]; }

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
        this[_plugin_resizequeue].push({ src, resizewidth, resizeto, docPath });
    }

    async onSiteRendered(config) {

        for (let toresize of this.resizequeue) {
            // if (toresize.docPath === 'mounted/img2resize.html') console.log(`resizing `, toresize);

            let img2resize;
            if (!path.isAbsolute(toresize.src)) {
                img2resize = path.normalize(path.join(
                    path.dirname(toresize.docPath),
                    toresize.src
                ));
            } else {
                img2resize = toresize.src;
            }
            // if (toresize.docPath === 'mounted/img2resize.html') console.log(`img2resize ${img2resize}`);

            let srcfile = undefined;

            let found = await filez.findAsset(config.assetDirs, img2resize);
            if (Array.isArray(found) && found.length >= 1) {
                // if (toresize.docPath === 'mounted/img2resize.html') console.log(`found ${img2resize} as asset `, found);
                srcfile = found[0].fullpath;
            } else {
                found = await filez.findRendersTo(config, img2resize);
                if (found && found.foundMountedOn === '/') {
                    // if (toresize.docPath === 'mounted/img2resize.html') console.log(`found ${img2resize} as document `, found);
                    srcfile = path.join(found.foundDir, found.foundFullPath);
                } else if (found && found.foundMountedOn !== '/') {
                    srcfile = path.join(found.foundDir, found.foundPathWithinDir);
                } else {
                    // if (toresize.docPath === 'mounted/img2resize.html') console.log(`did not find ${img2resize}`);
                }
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
                    resizedest = path.join(config.renderDestination,
                            path.dirname(toresize.docPath),
                            imgtoresize);
                }

                // Make sure the destination directory exists
                await fs.mkdir(path.dirname(resizedest), { recursive: true });
                
                // if (toresize.docPath === 'mounted/img2resize.html') console.log(`resizing ${srcfile} to ${resizedest}`);
                await resized.toFile(resizedest);
            } catch (e) {
                throw new Error(`built-in: Image resize failed for ${srcfile} (toresize ${util.inspect(toresize)} found ${util.inspect(found)}) because ${e}`);
            }
        }
    }

}

module.exports.mahabhutaArray = function(options) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    ret.addMahafunc(new StylesheetsElement());
    ret.addMahafunc(new HeaderJavaScript());
    ret.addMahafunc(new FooterJavaScript());
    ret.addMahafunc(new HeadLinkRelativizer());
    ret.addMahafunc(new ScriptRelativizer());
    ret.addMahafunc(new InsertBodyContent());
    ret.addMahafunc(new InsertTeaser());
    ret.addMahafunc(new CodeEmbed());
    ret.addMahafunc(new AkBodyClassAdd());
    ret.addMahafunc(new FigureImage());
    ret.addMahafunc(new img2figureImage());
    ret.addMahafunc(new ImageRewriter());
    ret.addMahafunc(new ShowContent());
    ret.addMahafunc(new SelectElements());
    ret.addMahafunc(new AnchorCleanup());
    return ret;
};

function _doStylesheets(metadata, options) {
    var scripts;
    if (typeof metadata.headerStylesheetsAdd !== "undefined") {
        scripts = options.config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
    } else {
        scripts = options.config.scripts ? options.config.scripts.stylesheets : undefined;
    }
    // console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(options.config.scripts)} ${util.inspect(scripts)}`);

    if (!options) throw new Error('_doStylesheets no options');
    if (!options.config) throw new Error('_doStylesheets no options.config');

    var ret = '';
    if (typeof scripts !== 'undefined') {
        for (var style of scripts) {

            let stylehref = style.href;
            let pHref = url.parse(style.href, true, true);
            if (!pHref.protocol && !pHref.hostname && !pHref.slashes) {
                // This is a local URL
                if (path.isAbsolute(stylehref)) {
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
	if (!scripts) return ret;

    if (!options) throw new Error('_doJavaScripts no options');
    if (!options.config) throw new Error('_doJavaScripts no options.config');

    for (var script of scripts) {
		if (!script.href && !script.script) {
			throw new Error(`Must specify either href or script in ${util.inspect(script)}`);
		}
        if (!script.script) script.script = '';
        let $ = mahabhuta.parse('<script ></script>');
        if (script.lang) $('script').attr('type', script.lang);
        if (script.href) {
            let scripthref = script.href;
            let pHref = url.parse(script.href, true, true);
            if (!pHref.protocol && !pHref.hostname && !pHref.slashes) {
                // This is a local URL
                if (path.isAbsolute(scripthref)) {
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
	} else {
		scripts = options.config.scripts ? options.config.scripts.javaScriptTop : undefined;
	}
	// console.log(`_doHeaderJavaScript ${util.inspect(scripts)}`);
	// console.log(`_doHeaderJavaScript ${util.inspect(options.config.scripts)}`);
	return _doJavaScripts(metadata, scripts, options);
	// return render.partialSync(options.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

function _doFooterJavaScript(metadata, options) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
		scripts = options.config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
	} else {
		scripts = options.config.scripts ? options.config.scripts.javaScriptBottom : undefined;
	}
	return _doJavaScripts(metadata, scripts, options);
	// return render.partialSync(options.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

class StylesheetsElement extends mahabhuta.CustomElement {
	get elementName() { return "ak-stylesheets"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doStylesheets(metadata, this.array.options));
	}
}

class HeaderJavaScript extends mahabhuta.CustomElement {
	get elementName() { return "ak-headerJavaScript"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doHeaderJavaScript(metadata, this.array.options));
	}
}

class FooterJavaScript extends mahabhuta.CustomElement {
	get elementName() { return "ak-footerJavaScript"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doFooterJavaScript(metadata, this.array.options));
	}
}

class HeadLinkRelativizer extends mahabhuta.Munger {
    get selector() { return "html head link"; }
    async process($, $link, metadata, dirty) {
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
    async process($, $link, metadata, dirty) {
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

class InsertBodyContent extends mahabhuta.CustomElement {
	get elementName() { return "ak-insert-body-content"; }
	process($element, metadata, dirty) {
		dirty();
		return Promise.resolve(typeof metadata.content !== "undefined" ? metadata.content : "");
	}
}

class InsertTeaser extends mahabhuta.CustomElement {
	get elementName() { return "ak-teaser"; }
	process($element, metadata, dirty) {
		return render.partial(this.array.options.config, "ak_teaser.html.ejs", {
			teaser: typeof metadata["ak-teaser"] !== "undefined"
				? metadata["ak-teaser"] : metadata.teaser
		})
		.then(html => { return html; });
	}
}

class AkBodyClassAdd extends mahabhuta.PageProcessor {
	process($, metadata, dirty) {
		if (typeof metadata.akBodyClassAdd !== 'undefined'
		 && metadata.akBodyClassAdd != ''
		 && $('html body').get(0)) {
            return new Promise((resolve, reject) => {
				if (!$('html body').hasClass(metadata.akBodyClassAdd)) {
					$('html body').addClass(metadata.akBodyClassAdd);
				}
				resolve();
			});
		} else return Promise.resolve();
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
        } else {
            txtpath = path.join(path.dirname(metadata.document.renderTo), fn);
        }

        const document = await documents.readDocument(this.array.options.config, txtpath);

        if (!document) {
            throw new Error(`code-embed file-name ${fn} does not refer to usable file`);
        }

        const readFrom = path.join(document.basedir, document.docpath);

        const txt = await fs.readFile(readFrom, 'utf8');
        let $ = mahabhuta.parse(`<pre><code></code></pre>`);
        if (lang && lang !== '') {
            $('code').addClass(lang);
        }
        $('code').addClass('hljs');
        if (id && id !== '') {
            $('pre').attr('id', id);
        }
        if (lang && lang !== '') {
            $('code').append(hljs.highlight(lang, txt).value);
        } else {
            $('code').append(hljs.highlightAuto(txt).value);
        }
        return $.html();
    }
}

class FigureImage extends mahabhuta.CustomElement {
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
        return render.partial(this.array.options.config, template, {
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
        
        return render.partial(this.array.options.config, template, {
            id, clazz, style, width, href: src, dest, resizewidth, resizeto,
            caption: content
        });
    }
}

class ImageRewriter extends mahabhuta.Munger {
    get selector() { return "html body img"; }
    async process($, $link, metadata, dirty) {
        // console.log($element);

        // We only do rewrites for local images
        let src = $link.attr('src');
        const uSrc = url.parse(src, true, true);
        if (uSrc.protocol || uSrc.slashes) return "ok";
        
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
        if (!template) template = 'ak_show-content.html.njk';
        const href    = $element.attr('href');
        if (!href) return Promise.reject(new Error('show-content must receive an href'));
        const clazz   = $element.attr('class');
        const id      = $element.attr('id');
        const caption = $element.html();
        const width   = $element.attr('width');
        const style   = $element.attr('style');
        const dest    = $element.attr('dest');
        const contentImage = $element.attr('content-image');
        const doc     = await documents.readDocument(this.array.options.config, href);
        return render.partial(this.array.options.config, template, {
            href, clazz, id, caption, width, style, dest, contentImage,
            document: doc
        });
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

    async process($, $link, metadata, dirty) {
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

    }
}

class AnchorCleanup extends mahabhuta.Munger {
    get selector() { return "html body a"; }

    async process($, $link, metadata, dirty) {
        var href     = $link.attr('href');
        var linktext = $link.text();
        // console.log(`AnchorCleanup ${href} ${linktext}`);
        if (href && href !== '#') {
            var uHref = url.parse(href, true, true);
            if (uHref.protocol || uHref.slashes) return "ok";
            if (!uHref.pathname) return "ok";

            /* if (metadata.document.path === 'index.html.md') {
                console.log(`AnchorCleanup metadata.document.path ${metadata.document.path} href ${href} uHref.pathname ${uHref.pathname} this.array.options.config.root_url ${this.array.options.config.root_url}`);
                console.log($.html());
            } */

            // let startTime = new Date();

            // We have determined this is a local href.
            // For reference we need the absolute pathname of the href within
            // the project.  For example to retrieve the title when we're filling
            // in for an empty <a> we need the absolute pathname.

            let absolutePath;

            if (!path.isAbsolute(uHref.pathname)) {
                absolutePath = path.join(path.dirname(metadata.document.path), uHref.pathname);
                // console.log(`***** AnchorCleanup FIXED href to ${uHref.pathname}`);
            } else {
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
            if (path.isAbsolute(href)) {
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
            var foundAsset = await filez.findAsset(this.array.options.config.assetDirs, absolutePath);
            if (foundAsset && foundAsset.length > 0) {
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
                // console.log(`AnchorCleanup skipping ${absolutePath} w/ ${util.inspect(linktext)} children= ${$link.children}`);
                return "ok";
            }

            // Does it exist in documents dir?
            var found = await filez.findRendersTo(this.array.options.config, absolutePath);
            // console.log(`AnchorCleanup findRendersTo ${absolutePath} ${util.inspect(found)}`);
            if (!found) {
                throw new Error(`Did not find ${href} in ${util.inspect(this.array.options.config.documentDirs)} in ${metadata.document.path}`);
            }
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findRendersTo ${(new Date() - startTime) / 1000} seconds`);

            // If this is a directory, there might be /path/to/index.html so we try for that.
            // The problem is that this.array.options.config.findRendererPath would fail on just /path/to but succeed
            // on /path/to/index.html
            if (found.foundIsDirectory) {
                found = await filez.findRendersTo(this.array.options.config, path.join(absolutePath, "index.html"));
                if (!found) {
                    throw new Error(`Did not find ${href} in ${util.inspect(this.array.options.config.documentDirs)} in ${metadata.document.path}`);
                }
            }
            // Otherwise look into filling emptiness with title
            var renderer = this.array.options.config.findRendererPath(found.foundFullPath);
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findRendererPath ${(new Date() - startTime) / 1000} seconds`);
            if (renderer && renderer.metadata) {
                try {
                    var docmeta = await renderer.metadata(found.foundDir, found.foundPathWithinDir);
                } catch(err) {
                    throw new Error(`Could not retrieve document metadata for ${found.foundDir} ${found.foundPathWithinDir} because ${err}`);
                }
                // Automatically add a title= attribute
                if (!$link.attr('title') && docmeta.title) {
                    $link.attr('title', docmeta.title);
                }
                if (docmeta.title) {
                    $link.text(docmeta.title);
                }
                // console.log(`AnchorCleanup finished`);
                // console.log(`AnchorCleanup ${metadata.document.path} ${href} DONE ${(new Date() - startTime) / 1000} seconds`);
                return "ok";
            } else {
                throw new Error(`Could not fill in empty 'a' element in ${metadata.document.path} with href ${href}`);
            }
        } else {
            return "ok";
        }
    }
}
