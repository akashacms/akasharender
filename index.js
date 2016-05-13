'use strict';

const log   = require('debug')('akasha:index');
const error = require('debug')('akasha:error-index');

const filez  = require('./filez');
const render = require('./render');
const util   = require('util');
const fs     = require('fs');
const path   = require('path');
const oembed = require('oembed');
const RSS    = require('rss');

exports.cache = require('./caching');

exports.Configuration = require('./Configuration');

exports.Plugin = require('./Plugin');

exports.Renderer = require('./Renderer');

exports.HTMLRenderer = require('./HTMLRenderer');

exports.render = function(config) { return render.render(config); };
exports.findRendererName = function(name) { return render.findRendererName(name); };
exports.findRendererPath = function(_path) { return render.findRendererPath(_path); };

exports.findRendersTo = filez.findRendersTo;

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
        if (!renderer && partialFname.match(/\.html$/) != null) {
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

    const renderer = render.findRendererPath(fname);
    if (!renderer && partialFname.match(/\.html$/) != null) {
        var fnamePartial = filez.findSync(config.partialDirs, fname);
        return fs.readFileSync(fnamePartial, 'utf8');
    }
    
    if (!renderer) {
        throw new Error(`No renderer for ${fname}`);
    }
    if (!(renderer instanceof exports.HTMLRenderer)) {
        throw new Error(`Renderer for ${partial} must be HTMLRenderer`);
    }
    
    var fnamePartial = filez.findSync(config.partialDirs, fname);
    
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
        var newFileName;
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
    .then(() => { return ret; })
    .catch(err => { error(err.stack); throw err; });
};

exports.documentSearch = function(config, options) {
    
    // Find all the documents, under rootPath if specified
    // Build up a useful object for each
    return new Promise((resolve, reject) => {
        globfs.operate(
        config.documentDirs,
        options.rootPath ? options.rootPath+"/**/*" : "**/*",
        (basedir, fpath, fini) => {
            fs.stat(path.join(basedir, fpath), (err, stat) => {
                if (err) return fini(err);
                var renderer = exports.findRendererPath(fpath);
                let path = renderer.filePath(fpath);
                fini(undefined, {
                    renderer, basedir, stat,
                    fpath, fname: path.basename(fpath),
                    path, name: path.basename(path),
                    metadata: renderer.metadata(basedir, fpath)
                }); 
            });
        },
        (err, results) => {
            if (err) reject(err);
            else resolve(results)
        });
    })
    // Then filter the list, potentially removing some items if they
    // do not validate against the filters specified in the options object.
    // These are separate .then calls even though it's not truly necessary.
    // This is for ease of implementation so each phase can be eliminated
    // or new phases added easily.
    .then(documents => {
        if (options.pathmatch) {
            return documents.filter(doc => {
                return doc.fpath.match(options.pathmatch) != null;
            });
        } else return documents;
    })
    .then(documents => {
        if (options.renderers) {
            return documents.filter(doc => {
                var match = false;
                for (let renderer of options.renderers) {
                    if (doc.renderer instanceof renderer) {
                        match = true;
                    }
                }
                return match;
            });
        } else return documents;
    })
    .then(documents => {
        if (options.layouts) {
            return documents.filter(doc => {
                var match = false;
                for (let layout of options.layouts) {
                    if (doc.metadata.layout === layout) {
                        match = true;
                    }
                }
                return match;
            });
        } else return documents;
    })
    .then(documents => {
        if (options.func) {
            return documents.filter(doc => {
                return func(config, options, doc);
            });
        } else return documents;
    });
    
};


///////////////// RSS Feed Generation

exports.generateRSS = function(config, configrss, feedData, items, renderTo) {

    return new Promise((resolve, reject) => {
        
        // Construct initial rss object
        var rss = {};
        for (var key in configrss) {
            if (configrss.hasOwnProperty(key)) {
                rss[key] = configrss[key];
            }
        }
        
        // Then fill in from feedData
        for (var key in feedData) {
            if (feedData.hasOwnProperty(key)) {
                rss[key] = feedData[key];
            }
        }
        
        var rssfeed = new RSS(rss);
        
        items.forEach(function(item) { rssfeed.item(item); });
        
        var xml = rssfeed.xml();
        var renderOut = path.join(config.root_out, renderTo);
        // logger.trace(renderOut +' ===> '+ xml);
        
        fs.mkdirs(path.dirname(renderOut), err => {
            if (err) { error(err); return reject(err); }
            fs.writeFile(renderOut, xml, { encoding: 'utf8' },
                err2 => {
                    if (err2) { error(err2); reject(err2); }
                    else resolve();
                });
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
    })
};

