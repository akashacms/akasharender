
/**
 * AkashaRender
 * @module akasharender
 */

'use strict';

const filez  = require('./filez');
const render = require('./render');
const util   = require('util');
const fs     = require('fs-extra');
const path   = require('path');
const oembetter = require('oembetter')();
const RSS    = require('rss');
const globfs = require('globfs');
const mahabhuta = require('mahabhuta');
exports.mahabhuta = mahabhuta;
const documents = require('./documents');

exports.cache = require('./caching');

/**
 * The AkashaRender project configuration object.  One instantiates a Configuration
 * object, then fills it with settings and plugins.
 * @see module:Configuration
 */
exports.Configuration = require('./Configuration');

exports.Plugin = require('./Plugin');

exports.Renderer = render.Renderer; //  require('./Renderer');

exports.HTMLRenderer = render.HTMLRenderer; //  require('./HTMLRenderer');

exports.render = render.newrender;
exports.renderDocument = render.renderDocument;
exports.findRendererName = render.findRendererName;
exports.findRendererPath = render.findRendererPath;
exports.registerRenderer = render.registerRenderer;

/**
 * Finds the source document matching the filename for a rendered file.  That is, for
 * a rendered file path like {movies/wallachia/vlad-tepes/son-of-dracul.html} it will search
 * for the {.html.md} file generating that rendered file.
 *
 * The returned object has at least these fields:
 *
 * * {foundDir} - The basedir within which the file was found
 * * {foundPath} - The path under basedir to that file
 * * {foundFullPath} - The path, including the full file extension, to that file
 * * {foundMountedOn} - For complex directories, the path  this directory is mounted on .. e.g. dir.dest
 * * {foundPathWithinDir} - For complex directories, the path within that directory.
 * * {foundBaseMetadata} - For complex directories, the metadata associated with that directory
 *
 * @params {Array} dirs The documentDirs directory
 * @params {string} rendersTo The full path of the rendered file
 * @return {Object} Description of the source file
 */
exports.findRendersTo = filez.findRendersTo;

/**
 *
 *
 * @param dir
 * @param fpath
 */
exports.readFile = filez.readFile;
exports.createNewFile = filez.createNewFile;

exports.Document = documents.Document;
exports.HTMLDocument = documents.HTMLDocument;
exports.documentTree = documents.documentTree;
exports.documentSearch = documents.documentSearch;
exports.readDocument   = documents.readDocument;

exports.partial = render.partial;

/* async function(config, fname, metadata) {

    var partialFound = await globfs.findAsync(config.partialsDirs, fname);
    if (!partialFound) throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);
    // Pick the first partial found
    partialFound = partialFound[0];
    // console.log(`partial ${util.inspect(partialFound)}`);
    if (!partialFound) throw new Error(`No partial found for ${fname} in ${util.inspect(config.partialsDirs)}`);

    var partialFname = path.join(partialFound.basedir, partialFound.path);
    // console.log(`partial ${util.inspect(partialFname)}`);
    var stats = await fs.stat(partialFname);
    if (!stats.isFile()) {
        throw new Error(`renderPartial non-file found for ${fname} - ${partialFname}`);
    }

    var renderer = render.findRendererPath(partialFname);
    if (renderer) {
        // console.log(`partial about to render ${util.inspect(partialFname)}`);
        var partialText = await fs.readFile(partialFname, 'utf8');
        return renderer.render(partialText, metadata);
    } else if (partialFname.endsWith('.html') || partialFname.endsWith('.xhtml')) {
        // console.log(`partial reading file ${partialFname}`);
        return fs.readFile(partialFname, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${partialFname}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialAsync(partial, attrs);
}; */

exports.partialSync = render.partialSync; 

/* function(config, fname, metadata) {

    var partialFound = globfs.findSync(config.partialsDirs, fname);
    if (!partialFound) throw new Error(`No partial directory found for ${fname}`);
    // Pick the first partial found
    partialFound = partialFound[0];

    var partialFname = path.join(partialFound.basedir, partialFound.path);
    // console.log(`doPartialSync before reading ${partialFname}`);
    var stats = fs.statSync(partialFname);
    if (!stats.isFile()) {
        throw new Error(`doPartialSync non-file found for ${fname} - ${partialFname}`);
    }
    var partialText = fs.readFileSync(partialFname, 'utf8');

    var renderer = render.findRendererPath(partialFname);
    if (renderer) {
        return renderer.renderSync(partialText, metadata);
    } else if (partialFname.endsWith('.html') || partialFname.endsWith('.xhtml')) {
        return fs.readFileSync(partialFname, 'utf8');
    } else {
        throw new Error(`renderPartial no Renderer found for ${fname} - ${partialFname}`);
    }
    // This has been moved into Mahabhuta
    // return mahaPartial.doPartialSync(fname, metadata);
}; */

exports.indexChain = async function(config, fname) {

    var ret = [];
    const parsed = path.parse(fname);

    var findParents = function(config, fileName) {
        // var newFileName;
        var parentDir;
        // console.log(`findParents ${fileName}`);
        if (path.dirname(fileName) === '.'
         || path.dirname(fileName) === parsed.root) {
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
                // console.log(util.inspect(found));
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

    var found = await filez.findRendersTo(config.documentDirs, fname);
    if (typeof found === 'undefined') {
        throw new Error(`Did not find directory for ${fname}`);
    }
    ret.push({ foundDir: found.foundDir, foundPath: found.foundPath, filename: fname });
    await findParents(config, fname);

    // console.log(`indexChain FINI ${util.inspect(ret.reverse)}`);
    return ret.reverse();
};

/**
 * Manipulate the rel= attributes on a link returned from Mahabhuta.
 *
 * @params {$link} The link to manipulate
 * @params {attr} The attribute name
 * @params {doattr} Boolean flag whether to set (true) or remove (false) the attribute
 *
 */
exports.linkRelSetAttr = function($link, attr, doattr) {
    let linkrel = $link.attr('rel');
    let rels = linkrel ? linkrel.split(' ') : [];
    let hasattr = rels.indexOf(attr) >= 0;
    if (!hasattr && doattr) {
        rels.unshift(attr);
        $link.attr('rel', rels.join(' '));
    } else if (hasattr && !doattr) {
        rels.splice(rels.indexOf(attr));
        $link.attr('rel', rels.join(' '));
    }
};

///////////////// RSS Feed Generation

exports.generateRSS = async function(config, configrss, feedData, items, renderTo) {

    // Supposedly it's required to use hasOwnProperty
    // http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object#728694
    //
    // But, in our case that resulted in an empty object

    // console.log('configrss '+ util.inspect(configrss));

    // Construct initial rss object
    var rss = {};
    for (let key in configrss.rss) {
        //if (configrss.hasOwnProperty(key)) {
            rss[key] = configrss.rss[key];
        //}
    }

    // console.log('rss '+ util.inspect(rss));

    // console.log('feedData '+ util.inspect(feedData));

    // Then fill in from feedData
    for (let key in feedData) {
        //if (feedData.hasOwnProperty(key)) {
            rss[key] = feedData[key];
        //}
    }

    // console.log('rss '+ util.inspect(rss));

    var rssfeed = new RSS(rss);

    items.forEach(function(item) { rssfeed.item(item); });

    var xml = rssfeed.xml();
    var renderOut = path.join(config.renderDestination, renderTo);

    await fs.mkdirs(path.dirname(renderOut))
    await fs.writeFile(renderOut, xml, { encoding: 'utf8' });

};

// Consider making an external plugin
// https://www.npmjs.com/package/oembed-all
// https://www.npmjs.com/package/embedable
// https://www.npmjs.com/package/media-parser
// https://www.npmjs.com/package/oembetter
module.exports.oEmbedData = function(url) {
    return new Promise((resolve, reject) => {
        oembetter.fetch(url,
        (err, result) => {
            if (err) return reject(err);
            else resolve(result);
        }
        );
    });
};
