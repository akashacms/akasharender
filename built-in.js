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

const url   = require('url');
const path  = require('path');
const util  = require('util');
const sharp = require('sharp');
const documents = require('./documents');
const filez = require('./filez');
const render = require('./render');
const Plugin = require('./Plugin');
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
        // config.addPartialsDir(path.join(__dirname, 'partials'));
        config.addMahabhuta(module.exports.mahabhutaArray(options));
        config.addMahabhuta(mahaMetadata.mahabhutaArray({

        }));
        config.addMahabhuta(mahaPartial.mahabhutaArray({
            renderPartial: options.renderPartial
        }));

        if (!config.builtin) config.builtin = {};
        if (!config.builtin.suppress) config.builtin.suppress = {};
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

    addImageToResize(src, resizewidth, resizeto) {
        this[_plugin_resizequeue].push({ src, resizewidth, resizeto });
    }

    async onSiteRendered(config) {

        for (let toresize of this.resizequeue) {
            // console.log(`resizing `, toresize);

            let img = await sharp(path.join(
                config.renderDestination, toresize.src));
            let resized = await img.resize(Number.parseInt(toresize.resizewidth));
            await resized
                .toFile(path.join(
                    config.renderDestination,
                    toresize.resizeto ? toresize.resizeto : toresize.src));
        }
    }

}

module.exports.mahabhutaArray = function(options) {
    let ret = new mahabhuta.MahafuncArray(pluginName, options);
    ret.addMahafunc(new StylesheetsElement());
    ret.addMahafunc(new HeaderJavaScript());
    ret.addMahafunc(new FooterJavaScript());
    ret.addMahafunc(new InsertBodyContent());
    ret.addMahafunc(new InsertTeaser());
    ret.addMahafunc(new AkBodyClassAdd());
    ret.addMahafunc(new FigureImage());
    ret.addMahafunc(new img2figureImage());
    ret.addMahafunc(new ImageResize());
    ret.addMahafunc(new ShowContent());
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

    var ret = '';
    if (typeof scripts !== 'undefined') {
        for (var style of scripts) {
            /* var keys = Object.keys(scripts);
            for (var i = 0; i < keys.length; i++) {
            var style = scripts[keys[i]]; */
            if (style.media) {
                ret += `<link rel="stylesheet" type="text/css" href="${style.href}" media="${style.media}"/>`;
            } else {
                ret += `<link rel="stylesheet" type="text/css" href="${style.href}"/>`;
            }
        }
        // console.log(`_doStylesheets ${ret}`);
    }
    return ret;
}

function _doJavaScripts(scripts, options) {
	var ret = '';
	if (!scripts) return ret;

    for (var script of scripts) {
        let lang = undefined;
        let href = undefined;
    	/* var keys = Object.keys(scripts);
    	for (var i = 0; i < keys.length; i++) {
    	    var script = scripts[keys[i]]; */
	    if (script.lang) { lang = `type="${script.lang}"`; }
		if (script.href) { href = `src="${script.href}"`; }
		if (!script.href && !script.script) {
			throw new Error(`Must specify either href or script in ${util.inspect(script)}`);
		}
		if (!script.script) script.script = '';
		ret += `<script ${lang ? lang : ""} ${href ? href : ""}>${script.script}</script>`;
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
	return _doJavaScripts(scripts);
	// return render.partialSync(options.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

function _doFooterJavaScript(metadata, options) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
		scripts = options.config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
	} else {
		scripts = options.config.scripts ? options.config.scripts.javaScriptBottom : undefined;
	}
	return _doJavaScripts(scripts);
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

class FigureImage extends mahabhuta.CustomElement {
    get elementName() { return "fig-img"; }
    async process($element, metadata, dirty) {
        var template = $element.attr('template');
        if (!template) template = 'ak_figimg.html.ejs';
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
                :  "ak_figimg.html.ejs";
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

class ImageResize extends mahabhuta.Munger {
    get selector() { return "html body img[resize-width]"; }
    async process($, $link, metadata, dirty) {
        // console.log($element);
        const resizewidth = $link.attr('resize-width');
        const resizeto = $link.attr('resize-to');
        const src = $link.attr('src');
        
        // Add to a queue that is run at the end 
        this.array.options.config.plugin(pluginName).addImageToResize(src, resizewidth, resizeto);

        if (resizeto) $link.attr('src', resizeto);

        // These are no longer needed
        $link.removeAttr('resize-width');
        $link.removeAttr('resize-to');

        return "ok";
    }
}




class ShowContent extends mahabhuta.CustomElement {
    get elementName() { return "show-content"; }
    async process($element, metadata, dirty) {
        var template = $element.attr('template');
        if (!template) template = 'ak_show-content.html.ejs';
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

            // let startTime = new Date();

            if (!path.isAbsolute(uHref.pathname)) {
                uHref.pathname = path.join(path.dirname(metadata.document.path), uHref.pathname);
                // console.log(`***** AnchorCleanup FIXED href to ${uHref.pathname}`);
            }

            // Look to see if it's an asset file
            var foundAsset = await filez.findAsset(this.array.options.config.assetDirs, uHref.pathname);
            if (foundAsset && foundAsset.length > 0) {
                return "ok";
            }

            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findAsset ${(new Date() - startTime) / 1000} seconds`);

            // Ask plugins if the href is okay
            if (this.array.options.config.askPluginsLegitLocalHref(uHref.pathname)) {
                return "ok";
            }
            // If this link has a body, then don't modify it
            if ((linktext && linktext.length > 0 && linktext !== uHref.pathname)
                || ($link.children().length > 0)) {
                // console.log(`AnchorCleanup skipping ${uHref.pathname} w/ ${util.inspect(linktext)} children= ${$link.children}`);
                return "ok";
            }

            // Does it exist in documents dir?
            var found = await filez.findRendersTo(this.array.options.config, uHref.pathname);
            // console.log(`AnchorCleanup findRendersTo ${uHref.pathname} ${util.inspect(found)}`);
            if (!found) {
                throw new Error(`Did not find ${href} in ${util.inspect(this.array.options.config.documentDirs)} in ${metadata.document.path}`);
            }
            // console.log(`AnchorCleanup ${metadata.document.path} ${href} findRendersTo ${(new Date() - startTime) / 1000} seconds`);

            // If this is a directory, there might be /path/to/index.html so we try for that.
            // The problem is that this.array.options.config.findRendererPath would fail on just /path/to but succeed
            // on /path/to/index.html
            if (found.foundIsDirectory) {
                found = await filez.findRendersTo(this.array.options.config, path.join(uHref.pathname, "index.html"));
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
