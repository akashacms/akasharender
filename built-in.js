/**
 *
 * Copyright 2014-2016 David Herron
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
const filez = require('./filez');
const akasha   = require('./index');
const mahabhuta = require('mahabhuta');
const mahaMetadata = require('mahabhuta/maha/metadata');
const mahaPartial = require('mahabhuta/maha/partial');

const log   = require('debug')('akasha:builtin-plugin');
const error = require('debug')('akasha:error-builtin-plugin');

module.exports = class BuiltInPlugin extends akasha.Plugin {
	constructor() {
		super("akashacms-builtin");
	}

	configure(config) {
        this._config = config;
        config.addPartialsDir(path.join(__dirname, 'partials'));
        config.addMahabhuta(module.exports.mahabhuta);
        config.addMahabhuta(mahaMetadata.mahabhuta);
        config.addMahabhuta(mahaPartial.mahabhuta);

        if (!config.builtin) config.builtin = {};
        if (!config.builtin.suppress) config.builtin.suppress = {};
    }

    doStylesheets(metadata) {
    	return _doStylesheets(metadata, this._config);
    }

    doHeaderJavaScript(metadata) {
    	return _doHeaderJavaScript(metadata);
    }

    doFooterJavaScript(metadata) {
    	return _doFooterJavaScript(metadata);
    }
}

module.exports.mahabhuta = new mahabhuta.MahafuncArray("akasharender built-in", {});

function _doStylesheets(metadata) {
    var scripts;
    if (typeof metadata.headerStylesheetsAdd !== "undefined") {
        scripts = metadata.config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
    } else {
        scripts = metadata.config.scripts ? metadata.config.scripts.stylesheets : undefined;
    }
    // console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(metadata.config.scripts)} ${util.inspect(scripts)}`);

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

function _doJavaScripts(scripts) {
	var ret = '';
	if (!scripts) return ret;

    for (var script of scripts) {
    	/* var keys = Object.keys(scripts);
    	for (var i = 0; i < keys.length; i++) {
    	    var script = scripts[keys[i]]; */
	    if (script.lang) {
			var lang = `type="${script.lang}"`;
		} else {
			var lang = "";
		}
		if (script.href) { var href = `src="${script.href}"`; }
		if (!script.href && !script.script) {
			throw new Error("Must specify either href or script in ${util.inspect(script)}");
		}
		if (!script.script) script.script = '';
		ret += `<script ${lang} ${href}>${script.script}</script>`;
	}
	// console.log('_doJavaScripts '+ ret);
	return ret;
}

function _doHeaderJavaScript(metadata) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddTop !== "undefined") {
		scripts = metadata.config.scripts.javaScriptTop.concat(metadata.headerJavaScriptAddTop);
	} else {
		scripts = metadata.config.scripts ? metadata.config.scripts.javaScriptTop : undefined;
	}
	// console.log(`_doHeaderJavaScript ${util.inspect(scripts)}`);
	// console.log(`_doHeaderJavaScript ${util.inspect(metadata.config.scripts)}`);
	return _doJavaScripts(scripts);
	// return akasha.partialSync(metadata.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

function _doFooterJavaScript(metadata) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
		scripts = metadata.config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
	} else {
		scripts = metadata.config.scripts ? metadata.config.scripts.javaScriptBottom : undefined;
	}
	return _doJavaScripts(scripts);
	// return akasha.partialSync(metadata.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

class StylesheetsElement extends mahabhuta.CustomElement {
	get elementName() { return "ak-stylesheets"; }
	process($element, metadata, dirty) {
		dirty();
		return Promise.resolve(_doStylesheets(metadata));
	}
}
module.exports.mahabhuta.addMahafunc(new StylesheetsElement());

class HeaderJavaScript extends mahabhuta.CustomElement {
	get elementName() { return "ak-headerJavaScript"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doHeaderJavaScript(metadata));
	}
}
module.exports.mahabhuta.addMahafunc(new HeaderJavaScript());

class FooterJavaScript extends mahabhuta.CustomElement {
	get elementName() { return "ak-footerJavaScript"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doFooterJavaScript(metadata));
	}
}
module.exports.mahabhuta.addMahafunc(new FooterJavaScript());

class InsertBodyContent extends mahabhuta.CustomElement {
	get elementName() { return "ak-insert-body-content"; }
	process($element, metadata, dirty) {
		dirty();
		return Promise.resolve(typeof metadata.content !== "undefined" ? metadata.content : "");
	}
}
module.exports.mahabhuta.addMahafunc(new InsertBodyContent());

class InsertTeaser extends mahabhuta.CustomElement {
	get elementName() { return "ak-teaser"; }
	process($element, metadata, dirty) {
		return akasha.partial(metadata.config, "ak_teaser.html.ejs", {
			teaser: typeof metadata["ak-teaser"] !== "undefined"
				? metadata["ak-teaser"] : metadata.teaser
		})
		.then(html => { dirty(); return html; });
	}
}
module.exports.mahabhuta.addMahafunc(new InsertTeaser());

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
module.exports.mahabhuta.addMahafunc(new AkBodyClassAdd());

class FigureImage extends mahabhuta.CustomElement {
    get elementName() { return "fig-img"; }
    process($element, metadata, dirty) {
        var template = $element.attr('template');
        if (!template) template = 'ak_figimg.html.ejs';
        const href    = $element.attr('href');
        if (!href) return Promise.reject(new Error('fig-img must receive an href'));
        const clazz   = $element.attr('class');
        const id      = $element.attr('id');
        const caption = $element.html();
        const width   = $element.attr('width');
        const style   = $element.attr('style');
        const dest    = $element.attr('dest');
        return akasha.partial(metadata.config, template, {
            href, clazz, id, caption, width, style, dest
        })
        .then(html => { dirty(); return html; });
    }
}
module.exports.mahabhuta.addMahafunc(new FigureImage());

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
        const doc     = await akasha.readDocument(metadata.config, href);
        dirty();
        return akasha.partial(metadata.config, template, {
            href, clazz, id, caption, width, style, dest,
            document: doc
        });
    }
}
module.exports.mahabhuta.addMahafunc(new ShowContent());

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
		return akasha.partial(metadata.config, fname, d)
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

            if (!path.isAbsolute(uHref.pathname)) {
                uHref.pathname = path.join(path.dirname(metadata.document.path), uHref.pathname);
                // console.log(`***** AnchorCleanup FIXED href to ${uHref.pathname}`);
            }

            // Look to see if it's an asset file
            var foundAsset = await filez.findAsset(metadata.config.assetDirs, uHref.pathname);
            if (foundAsset && foundAsset.length > 0) {
                return "ok";
            }

            // Ask plugins if the href is okay
            if (metadata.config.askPluginsLegitLocalHref(uHref.pathname)) {
                return "ok";
            }

            // Does it exist in documents dir?
            var found = await filez.findRendersTo(metadata.config.documentDirs, uHref.pathname);
            // console.log(`AnchorCleanup findRendersTo ${uHref.pathname} ${util.inspect(found)}`);
            if (!found) {
                throw new Error(`Did not find ${href} in ${util.inspect(metadata.config.documentDirs)} in ${metadata.document.path}`);
            }
            // If this is a directory, there might be /path/to/index.html so we try for that.
            // The problem is that akasha.findRendererPath would fail on just /path/to but succeed
            // on /path/to/index.html
            if (found.foundIsDirectory) {
                found = await filez.findRendersTo(metadata.config.documentDirs, path.join(uHref.pathname, "index.html"));
                if (!found) {
                    throw new Error(`Did not find ${href} in ${util.inspect(metadata.config.documentDirs)} in ${metadata.document.path}`);
                }
            }
            // If this link has a body, then don't modify it
            if ((linktext && linktext.length > 0 && linktext !== uHref.pathname)
                || ($link.children().length > 0)) {
                // console.log(`AnchorCleanup skipping ${uHref.pathname} w/ ${util.inspect(linktext)} children= ${$link.children}`);
                return "ok";
            }
            // Otherwise look into filling emptiness with title
            var renderer = akasha.findRendererPath(found.foundFullPath);
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
                return "ok";
            } else {
                throw new Error(`Could not fill in empty 'a' element in ${metadata.document.path} with href ${href}`);
            }
        } else {
            return "ok";
        }
    }
}
module.exports.mahabhuta.addMahafunc(new AnchorCleanup());
