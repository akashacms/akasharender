'use strict';

const log   = require('debug')('akasha:index');
const error = require('debug')('akasha:error-index');

const filez  = require('./filez');
const render = require('./render');
const util   = require('util');
const fs     = require('fs-extra');
const path   = require('path');
const oembed = require('oembed');
const RSS    = require('rss');
const globfs = require('globfs');
const documents = require('./documents');

exports.cache = require('./caching');

exports.Configuration = require('./Configuration');

exports.Plugin = require('./Plugin');

exports.Renderer = require('./Renderer');

exports.HTMLRenderer = require('./HTMLRenderer');

exports.render = function(config) { return render.render(config); };
exports.findRendererName = function(name) { return render.findRendererName(name); };
exports.findRendererPath = function(_path) { return render.findRendererPath(_path); };

exports.findRendersTo = filez.findRendersTo;

exports.Document = documents.Document;
exports.HTMLDocument = documents.HTMLDocument;

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
    .then(() => { return ret; })
    .catch(err => { error(err.stack); throw err; });
};

exports.documentSearch = function(config, options) {
    
    
    // log(`documentSearch ${util.inspect(options)}`);
    
    // Find all the documents, under rootPath if specified
    // Build up a useful object for each
    return new Promise((resolve, reject) => {
        globfs.operate(
        config.documentDirs,
        options.rootPath ? options.rootPath+"/**/*" : "**/*",
        (basedir, fpath, fini) => {
            fs.stat(path.join(basedir, fpath), (err, stat) => {
                if (err) return fini(err);
                // Skip recording directories
                if (stat.isDirectory()) return fini();
                var renderer = exports.findRendererPath(fpath);
                let filepath = renderer ? renderer.filePath(fpath) : undefined;
                if (renderer) {
                    renderer.metadata(basedir, fpath)
                    .then(metadata => {
                        // log(util.inspect(metadata));
                        fini(undefined, {
                            renderer, basedir, stat,
                            fpath, fname: path.basename(fpath),
                            name: filepath ? path.basename(filepath) : path.basename(fpath),
                            filepath,
                            metadata
                        }); 
                    });
                } else {
                    fini(undefined, {
                        renderer, basedir, stat,
                        fpath, fname: path.basename(fpath),
                        name: filepath ? path.basename(filepath) : path.basename(fpath),
                        filepath,
                        metadata: undefined
                    }); 
                }
            });
        },
        (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    })
    .then(documents => {
        // the object array we receive is suboptimally organized.
        // We first flatten it so it's more useful
        // log(`documentSearch before filtering ${util.inspect(documents)}`);
        return documents.map(doc => {
            return new exports.Document({
                basedir: doc.basedir,
                docpath: doc.result.fpath,
                docname: doc.result.fname,
                fullpath: doc.fullpath,
                renderer: doc.result.renderer,
                stat: doc.result.stat,
                renderpath: doc.result.filepath,
                rendername: doc.result.name,
                metadata: doc.result.metadata
            });
        });
    })
    // Then filter the list, potentially removing some items if they
    // do not validate against the filters specified in the options object.
    // These are separate .then calls even though it's not truly necessary.
    // This is for ease of implementation so each phase can be eliminated
    // or new phases added easily.
    .then(documents => {
        
        // log(`documentSearch documents #1 ${util.inspect(documents)}`);
    
        if (options.pathmatch) {
            return documents.filter(doc => {
                var ret = doc.docpath.match(options.pathmatch) !== null;
                return ret;
            });
        } else return documents;
    })
    .then(documents => {
        if (options.renderers) {
            return documents.filter(doc => {
                if (!options.renderers) return true;
                for (let renderer of options.renderers) {
                    if (doc.renderer instanceof renderer) {
                        return true;
                    }
                }
                return false;
            });
        } else return documents;
    })
    .then(documents => {
        if (options.layouts) {
            return documents.filter(doc => {
                for (let layout of options.layouts) {
                    if (doc.metadata.layout === layout) {
                        return true;
                    }
                }
                return false;
            });
        } else return documents;
    })
    .then(documents => {
        // log(`documentSearch documents #4 ${util.inspect(documents)}`);
    
        if (options.filterfunc) {
            return documents.filter(doc => {
                return options.filterfunc(config, options, doc);
            });
        } else return documents;
    })
    .then(documents => {
        documents.sort((a, b) => {
            if (a.renderpath < b.renderpath) return -1;
            else if (a.renderpath === b.renderpath) return 0;
            else return 1;
        });
        return documents;
    })
    .then(documents => {
        // log(`documentSearch final ${util.inspect(documents)}`);
        return documents;
    })
    .catch(err => { error(err); throw err; });
    
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
        log(`generateRSS ${config.renderDestination} ${renderTo} ${util.inspect(configrss)}`);
        var renderOut = path.join(config.renderDestination, renderTo);
        log(renderOut +' ===> '+ xml);
        
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
    });
};

