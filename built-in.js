/**
 *
 * Copyright 2014-2015 David Herron
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
}

module.exports.mahabhuta = [
		function($, metadata, dirty, done) {
            var elements = [];
            $('ak-stylesheets').each(function(i, elem) { elements.push(elem); });
            if (elements.length <= 0) return done();
        	log('ak-stylesheets');
            async.eachSeries(elements,
            (element, next) => {
                var scripts;
			    if (typeof metadata.headerStylesheetsAdd !== "undefined") {
			        scripts = metadata.config.scripts.stylesheets.concat(metadata.headerStylesheetsAdd);
			    } else {
			        scripts = metadata.config.scripts ? metadata.config.scripts.stylesheets : undefined;
			    }
				// console.log(`ak-stylesheets ${metadata.document.path} ${util.inspect(metadata.headerStylesheetsAdd)} ${util.inspect(metadata.config.scripts)} ${util.inspect(scripts)}`);
				akasha.partial(metadata.config, "ak_stylesheets.html.ejs", {
					stylesheets: scripts
				})
                .then(style => {
					// console.log(`ak-stylesheets ${metadata.document.path} ${style}`);
                    $(element).replaceWith(style);
                    next();
				})
                .catch(err => { error(err); next(err); });
            },
            err => {
				// log(`after ak-stylesheets ${metadata.document.path} ${$.html()}`);
				if (err) {
					error('ak-stylesheets Errored with '+ util.inspect(err));
					done(err);
				} else done();
            });
        },

		function($, metadata, dirty, done) {
            var elements = [];
            $('ak-headerJavaScript').each(function(i, elem) { elements.push(elem); });
            if (elements.length <= 0) return done();
        	log('ak-headerJavaScript');
            async.eachSeries(elements,
            (element, next) => {
                var scripts;
			    if (typeof metadata.headerJavaScriptAddTop !== "undefined") {
			        scripts = metadata.config.scripts.javaScriptTop.concat(metadata.headerJavaScriptAddTop);
			    } else {
			        scripts = metadata.config.scripts ? metadata.config.scripts.javaScriptTop : undefined;
			    }
			    akasha.partial(metadata.config, "ak_javaScript.html.ejs", { javaScripts: scripts })
				.then(html => {
                    $(element).replaceWith(html);
                    next();
                })
                .catch(err => { error(err); next(err); });
            },
            err => {
				if (err) {
					error('ak-headerJavaScript Errored with '+ util.inspect(err));
					done(err);
				} else done();
            });
        },

		function($, metadata, dirty, done) {
            var elements = [];
            $('ak-footerJavaScript').each(function(i, elem) { elements.push(elem); });
            if (elements.length <= 0) return done();
        	log('ak-footerJavaScript');
            async.eachSeries(elements,
            (element, next) => {
                var scripts;
			    if (typeof metadata.headerJavaScriptAddBottom !== "undefined") {
			        scripts = metadata.config.scripts.javaScriptBottom.concat(metadata.headerJavaScriptAddBottom);
			    } else {
			        scripts = metadata.config.scripts ? metadata.config.scripts.javaScriptBottom : undefined;
			    }
			    akasha.partial(metadata.config, "ak_javaScript.html.ejs", { javaScripts: scripts })
				.then(html => {
                    $(element).replaceWith(html);
                    next();
                })
                .catch(err => { error(err); next(err); });
            },
            err => {
				if (err) {
					error('ak-footerJavaScript Errored with '+ util.inspect(err));
					done(err);
				} else done();
            });
        },

		function($, metadata, dirty, done) {
            var elements = [];
            $('ak-insert-body-content').each(function(i, elem) { elements.push(elem); });
            if (elements.length <= 0) return done();
        	log('ak-insert-body-content');
            async.eachSeries(elements,
            function(element, next) {

				if (typeof metadata.content !== "undefined")
					$(element).replaceWith(metadata.content);
				else
					$(element).remove();

				next();
            },
            function(err) {
				if (err) {
					error('ak-insert-body-content Errored with '+ util.inspect(err));
					done(err);
				} else done();
            });
        },

		function($, metadata, dirty, done) {
            var elements = [];
            $('ak-teaser').each(function(i, elem) { elements.push(elem); });
            if (elements.length <= 0) return done();
        	log('ak-teaser');
            async.eachSeries(elements,
            function(element, next) {
				if (typeof metadata.teaser !== "undefined" || typeof metadata["ak-teaser"] !== "undefined") {
                    akasha.partial(metadata.config, "ak_teaser.html.ejs", {
                        teaser: typeof metadata["ak-teaser"] !== "undefined"
                            ? metadata["ak-teaser"] : metadata.teaser
                    })
                    .then(html => {
                        $(element).replaceWith(html);
                        next();
                    })
                    .catch(err => { error(err); next(err); });
				} else {
					$(element).remove();
					next();
				}
            },
            function(err) {
				if (err) {
					error('ak-teaser Errored with '+ util.inspect(err));
					done(err);
				} else done();
            });
        },

		function($, metadata, dirty, done) {
            // <partial file-name="file-name.html.whatever" data-attr-1=val data-attr-2=val/>
            var partials = [];
            $('partial').each(function(i, elem) { partials.push(elem); });
            if (partials.length <= 0) return done();
        	// log('partial');
            async.eachSeries(partials,
            function(partial, next) {
				// We default to making partial set the dirty flag.  But a user
				// of the partial tag can choose to tell us it isn't dirty.
				// For example, if the partial only substitutes values into normal tags
				// there's no need to do the dirty thing.
				var dothedirtything = $(partial).attr('dirty');
				if (!dothedirtything || dothedirtything.match(/true/i)) {
				    dirty();
				}
                var fname = $(partial).attr("file-name");
                var txt   = $(partial).html();
                var d = {};
                for (var mprop in metadata) { d[mprop] = metadata[mprop]; }
                var data = $(partial).data();
                for (var dprop in data) { d[dprop] = data[dprop]; }
                d["partialBody"] = txt;
                log('partial tag fname='+ fname +' attrs '+ util.inspect(data));
                akasha.partial(metadata.config, fname, d)
                .then(html => {
                    $(partial).replaceWith(html);
                    next();
                })
                .catch(err => {
					error(new Error("FAIL partial file-name="+ fname +" because "+ err));
					next(new Error("FAIL partial file-name="+ fname +" because "+ err));
				});
            },
            function(err) {
              if (err) {
                error('partial Errored with '+ util.inspect(err));
                done(err);
              } else done();
            });
        },

		function($, metadata, dirty, done) {

			var links = [];
			$('html body a').each((i, elem) => { links.push(elem); });
			if (links.length <= 0) return done();
			log('substitute page title for links to local documents');
			async.eachSeries(links, (link, next) => {

				var href     = $(link).attr('href');
				var linktext = $(link).text();
				if (href && href !== '#'
				 && (!linktext || linktext.length <= 0 || linktext === href)
				 && $(link).children() <= 0) {
					var uHref = url.parse(href, true, true);
					if (uHref.protocol || uHref.slashes) return next();

					if (! href.match(/^\//)) {
						var hreforig = href;
						// var pRenderedUrl = url.parse(metadata.rendered_url);
						// var docpath = pRenderedUrl.pathname;
						var docdir = path.dirname(metadata.document.path);
						href = path.normalize(path.join(docdir, href));
						// util.log('***** FIXED href '+ hreforig +' to '+ href);
					}

					akasha.findRendersTo(metadata.config.documentDirs, href)
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
								if (!$(link).attr('title') && docmeta.title) {
									$(link).attr('title', docmeta.title);
								}
								if (docmeta.title) {
									$(link).text(docmeta.title);
								}
								next();
							});
						}
						next();
					})
					.catch(err => { next(err); });

					/*
					if (! href.match(/^\//)) {
						var hreforig = href;
						var pRenderedUrl = url.parse(metadata.rendered_url);
						var docpath = pRenderedUrl.pathname;
						var docdir = path.dirname(docpath);
						href = path.join(docdir, href);
						// util.log('***** FIXED href '+ hreforig +' to '+ href);
					}
					/* TODO
					var docEntry = akasha.findDocumentForUrlpath(href);
					if (docEntry) {
						// Automatically add a title= attribute
						if (!$(link).attr('title') && docEntry.frontmatter.yaml.title) {
							$(link).attr('title', docEntry.frontmatter.yaml.title);
						}
						// For local links that don't have text or interior nodes,
						// supply text from the title of the target of the link.
						var linktext = $(link).text();
						if ((!linktext || linktext.length <= 0 || linktext === href)
						 && $(link).children() <= 0
						 && docEntry.frontmatter.yaml.title) {
							$(link).text(docEntry.frontmatter.yaml.title);
						}
					} */
				} else next();
			},
            err => {
				if (err) done(err);
				else done();
        	});
        }
];
