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
const async = require('async');
const akasha   = require('./index');
const mahabhuta = require('mahabhuta');

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

function _doStylesheets(metadata) {
	var scripts;
	if (typeof metadata.headerStylesheetsAdd !== "undefined") {
		scripts = metadata.config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
	} else {
		scripts = metadata.config.scripts ? metadata.config.scripts.stylesheets : undefined;
	}
	// console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(metadata.config.scripts)} ${util.inspect(scripts)}`);
	return akasha.partialSync(metadata.config, "ak_stylesheets.html.ejs", {
		stylesheets: scripts
	});
}

function _doHeaderJavaScript(metadata) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddTop !== "undefined") {
		scripts = metadata.config.scripts.javaScriptTop.concat(metadata.headerJavaScriptAddTop);
	} else {
		scripts = metadata.config.scripts ? metadata.config.scripts.javaScriptTop : undefined;
	}
	return akasha.partialSync(metadata.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

function _doFooterJavaScript(metadata) {
	var scripts;
	if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
		scripts = metadata.config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
	} else {
		scripts = metadata.config.scripts ? metadata.config.scripts.javaScriptBottom : undefined;
	}
	return akasha.partialSync(metadata.config, "ak_javaScript.html.ejs", { javaScripts: scripts });
}

class StylesheetsElement extends mahabhuta.CustomElement {
	get elementName() { return "ak-stylesheets"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doStylesheets(metadata));
	}
}

class HeaderJavaScript extends mahabhuta.CustomElement {
	get elementName() { return "ak-headerJavaScript"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doHeaderJavaScript(metadata));
	}
}

class FooterJavaScript extends mahabhuta.CustomElement {
	get elementName() { return "ak-footerJavaScript"; }
	process($element, metadata, dirty) {
		return Promise.resolve(_doFooterJavaScript(metadata));
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
		return akasha.partial(metadata.config, "ak_teaser.html.ejs", {
			teaser: typeof metadata["ak-teaser"] !== "undefined"
				? metadata["ak-teaser"] : metadata.teaser
		})
		.then(html => { dirty(); return html; });
	}
}

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

class AnchorCleanup extends mahabhuta.Munger {
	get selector() { return "html body a"; }

	process($, $link, metadata, dirty, done) {


		var href     = $link.attr('href');
		var linktext = $link.text();
		// console.log(`AnchorCleanup ${href} ${linktext}`);
		if (href && href !== '#'
		 && (!linktext || linktext.length <= 0 || linktext === href)
		 && $link.children() <= 0) {
			var uHref = url.parse(href, true, true);
			if (uHref.protocol || uHref.slashes) return Promise.resolve("");

			if (! href.match(/^\//)) {
				var hreforig = href;
				// var pRenderedUrl = url.parse(metadata.rendered_url);
				// var docpath = pRenderedUrl.pathname;
				var docdir = path.dirname(metadata.document.path);
				href = path.normalize(path.join(docdir, href));
				// util.log('***** FIXED href '+ hreforig +' to '+ href);
			}

			return akasha.findRendersTo(metadata.config.documentDirs, href)
			.then(found => {
				if (!found) {
					throw new Error(`Did not find ${href} in ${util.inspect(metadata.config.documentDirs)}`);
				}
				var renderer = akasha.findRendererPath(found.foundFullPath);
				if (renderer && renderer.metadata) {
					return renderer.metadata(found.foundDir, found.foundFullPath)
					.then(docmeta => {
						// log(`${entry.foundDir} ${entry.foundPath} ${util.inspect(metadata)}`)
						// Automatically add a title= attribute
						if (!$link.attr('title') && docmeta.title) {
							$link.attr('title', docmeta.title);
						}
						if (docmeta.title) {
							$link.text(docmeta.title);
						}
						return "ok";
					});
				} else return "ok";
			});
		} else return Promise.resolve("");
	}
}

module.exports.mahabhuta = [
	new StylesheetsElement(),
	new HeaderJavaScript(),
	new FooterJavaScript(),
	new InsertBodyContent(),
	new InsertTeaser(),
	new Partial(),
	new AnchorCleanup()
];
