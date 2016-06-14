
/**
 * AkashaRender
 * @module akasharender
 */

'use strict';

const log   = require('debug')('akasha:index');
const error = require('debug')('akasha:error-index');

const filez  = require('./filez');
const render = require('./render');
const util   = require('util');
const fs     = require('fs-extra-promise');
const path   = require('path');
const oembed = require('oembed');
const RSS    = require('rss');
const globfs = require('globfs');
const documents = require('./documents');

exports.cache = require('./caching');

/**
 * The AkashaRender project configuration object.  One instantiates a Configuration
 * object, then fills it with settings and plugins.
 * @see module:Configuration
 */
exports.Configuration = require('./Configuration');

exports.Plugin = require('./Plugin');

exports.Renderer = require('./Renderer');

exports.HTMLRenderer = require('./HTMLRenderer');

exports.render = function(config) { return render.render(config); };
exports.renderDocument = render.renderDocument;
exports.findRendererName = function(name) { return render.findRendererName(name); };
exports.findRendererPath = function(_path) { return render.findRendererPath(_path); };

/**
 *
 *
 * @params dirs
 * @params rendersTo
 */
exports.findRendersTo = filez.findRendersTo;

/**
 *
 *
 * @param dir
 * @param fpath
 */
exports.readFile = filez.readFile;

exports.Document = documents.Document;
exports.HTMLDocument = documents.HTMLDocument;
exports.documentTree = documents.documentTree;
exports.documentSearch = documents.documentSearch;
exports.readDocument   = documents.readDocument;

exports.partial = function(config, partial, attrs) {
    // find the partial
    // based on the partial format - render, using attrs
    // if okay - resolve(rendered) - else reject(err)

    var partialFname;
    var partialText;
    var renderer;

    if (!partial) return Promise.reject(new Error("No partial file name supplied"));

    return filez.find(config.partialDirs, partial)
    .then(partialDir => {
        if (!partialDir) throw new Error(`No partial directory found for ${partial}`);

        partialFname = path.join(partialDir, partial);

        renderer = render.findRendererPath(partialFname);

        // For .html partials, we won't find a Renderer and can
        // short-circuit the process by just reading the file.
        if (!renderer && partialFname.match(/\.html$/) !== null) {
            return filez.readFile(partialDir, partial);
        }

        if (!renderer) throw new Error(`No renderer found for ${partialFname}`);
        if (!(renderer instanceof exports.HTMLRenderer)) {
            throw new Error(`Renderer for ${partial} must be HTMLRenderer`);
        }

        return filez.readFile(partialDir, partial);
    })
    .then(text => {
        partialText = text;
        return renderer ? renderer.render(partialText, attrs) : partialText;
    });
};

exports.partialSync = function(config, fname, metadata) {

    var fnamePartial;
    const renderer = render.findRendererPath(fname);
    if (!renderer && fname.match(/\.html$/) !== null) {
        fnamePartial = filez.findSync(config.partialDirs, fname);
        return fs.readFileSync(fnamePartial, 'utf8');
    }

    if (!renderer) {
        throw new Error(`No renderer for ${fname}`);
    }
    if (!(renderer instanceof exports.HTMLRenderer)) {
        throw new Error(`Renderer for ${fname} must be HTMLRenderer`);
    }

    fnamePartial = filez.findSync(config.partialDirs, fname);

    // log(`partialSync fname=${fname} fnamePartial=${fnamePartial}`);
    if (fnamePartial === undefined) {
        throw new Error('NO FILE FOUND FOR PARTIAL ' + util.inspect(fname));
    }

    var text = fs.readFileSync(fnamePartial, 'utf8');

    return renderer.renderSync(text, metadata);
};

exports.indexChain = function(config, fname) {

    var ret = [];

    var findParents = function(config, fileName) {
        // var newFileName;
        var parentDir;
        // log(`findParents ${fileName}`);
        if (path.dirname(fileName) === '.') {
            return Promise.resolve();
        } else {
            if (path.basename(fileName) === "index.html") {
                parentDir = path.dirname(path.dirname(fileName));
            } else {
                parentDir = path.dirname(fileName);
            }
            var lookFor = path.join(parentDir, "index.html");
            return filez.findRendersTo(config.documentDirs, lookFor)
            .then(found => {
                // log(util.inspect(foundDir));
                if (typeof found !== 'undefined') {
                    ret.push({ foundDir: found.foundDir, foundPath: found.foundPath, filename: lookFor });
                }
                return findParents(config, lookFor);
            });
        }
    };

    let renderer = exports.findRendererPath(fname);
    if (renderer) {
        fname = renderer.filePath(fname);
    }

    return filez.findRendersTo(config.documentDirs, fname)
    .then(found => {
        if (typeof found === 'undefined') {
            throw new Error(`Did not find directory for ${fname}`);
        }
        ret.push({ foundDir: found.foundDir, foundPath: found.foundPath, filename: fname });
        return findParents(config, fname);
    })
    .then(() => { return ret.reverse(); })
    .catch(err => { error(err.stack); throw err; });
};

///////////////// RSS Feed Generation

exports.generateRSS = function(config, configrss, feedData, items, renderTo) {

    return new Promise((resolve, reject) => {

        // Construct initial rss object
        var rss = {};
        for (let key in configrss.rss) {
            if (configrss.hasOwnProperty(key)) {
                rss[key] = configrss[key];
            }
        }

        // Then fill in from feedData
        for (let key in feedData) {
            if (feedData.hasOwnProperty(key)) {
                rss[key] = feedData[key];
            }
        }

        var rssfeed = new RSS(rss);

        items.forEach(function(item) { rssfeed.item(item); });

        var xml = rssfeed.xml();
        var renderOut = path.join(config.renderDestination, renderTo);

        fs.mkdirsAsync(path.dirname(renderOut))
        .then(() => {
            return fs.writeFileAsync(renderOut, xml, { encoding: 'utf8' });
        })
        .catch(err => {
            error(err);
            throw err;
        });
    });

}

// Consider making an external plugin
// https://www.npmjs.com/package/oembed-all
// https://www.npmjs.com/package/embedable
// https://www.npmjs.com/package/media-parser
// https://www.npmjs.com/package/oembetter
module.exports.oEmbedData = function(url) {
    return new Promise((resolve, reject) => {
        oembed.fetch(url, { maxwidth: 6000 },
        (err, result) => {
            if (err) return reject(err);
            else resolve(result);
        }
        );
    });
};
