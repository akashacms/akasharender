
/**
 * Dealing with HTMLRenderer document files.
 * @module documents
 */

'use strict';

const path  = require('path');
const util  = require('util');
const async = require('async');
const filez = require('./filez');
const fs    = require('fs-extra-promise');
const globfs = require('globfs');
const akasha = require('./index');

const log   = require('debug')('akasha:documents');
const error = require('debug')('akasha:error-documents');

/**
 * Standardized object to describe document files which render using an HTMLRenderer.
 */
exports.Document = class Document {
    constructor(params) {
        this._basedir = params.basedir;
        this._docpath = params.docpath;
        this._docname = params.docname;
        this._fullpath = params.fullpath;
        this._renderer = params.renderer;
        this._stat     = params.stat;
        this._renderpath = params.renderpath;
        this._rendername = params.rendername;
        this._metadata = params.metadata;
    }

    /**
     * The directory structure within which this document was found.
     * @member {string} basedir
     */
    get basedir() { return this._basedir; }
    set basedir(dir) { this._basedir = dir; }

    /**
     * The path for this document within basedir.
     * @member {string} docpath
     */
    get docpath() { return this._docpath; }
    set docpath(docpath) { this._docpath = docpath; }

    get docname() { return this._docname; }
    set docname(docname) { this._docname = docname; }

    get fullpath() { return this._fullpath; }
    set fullpath(fullpath) { this._fullpath = fullpath; }

    get renderer() { return this._renderer; }
    set renderer(renderer) { this._renderer = renderer; }

    get stat() { return this._stat; }
    set stat(stat) { this._stat = stat; }

    get renderpath() { return this._renderpath; }
    set renderpath(renderpath) { this._renderpath = renderpath; }

    get rendername() { return this._rendername; }
    set rendername(rendername) { this._rendername = rendername; }

    get metadata() { return this._metadata; }
    set metadata(metadata) { this._metadata = metadata; }
};

exports.HTMLDocument = class HTMLDocument extends module.exports.Document {
    constructor(params) { super(params); }
};

exports.ImageDocument = class ImageDocument extends module.exports.Document {
    constructor(params) { super(params); }
};

exports.DocumentTreeEntry = class DocumentTreeEntry extends module.exports.Document {

    constructor(params) {
        super(params);
        this._type = params.type;
        this._entryname = params.entryname;
        this._dirpath = params.dirpath;
        this._children = params.children;
        this._teaser = params.teaser;
        this._title = params.title;
    }

    get type() { return this._type; }

    get entryname() { return this._entryname; }
    set entryname(entryname) { this._entryname = entryname; }

    get dirpath() { return this._dirpath; }
    set dirpath(dirpath) { this._dirpath = dirpath; }

    get children() { return this._children; }

    get teaser() { return this._teaser; }
    set teaser(teaser) { this._teaser = teaser; }

    get title() { return this._title; }
    set title(title) { this._title = title; }

    addChild(child) {
        if (!(this._type === "dir" || this._type === "root")) throw new Error("Not a directory in adding "+ util.inspect(child));
        if (this._children) this._children.push(child);
    }
}

/**
 * Used by documentTree to convert a pathname to an array like this:
 *
 * [ { type: 'dir', component: 'foo', entries: [] },
 *   { type: 'dir', component: 'bar', entries: [] },
 *   { type: 'dir', component: 'bas', entries: [] },
 *   { type: 'dir', component: 'baz', entries: [] },
 *   { type: 'file', component: 'xyzzy.html' } ]
 *
 */
var componentizeFileName = module.exports.componentizeFileName = function(filename) {
	var ret = [];
	ret.push({ type: 'file', component: path.basename(filename) });
	for (filename = path.dirname(filename); filename != '.' && filename != '/'; filename = path.dirname(filename)) {
		ret.unshift({ type: 'dir', component: path.basename(filename), entries: [] });
	}
	return ret;
};

/**
 *
 *
 *
    {
        type: "root",
        title: "copied from index.html",
        teaser: "copied from index.html",
        name: undefined,
        entries: [
            // Made up of entries of one of these two types
            {
                type: "file",
                title: "copied from metadata",
                teaser: "copied from metadata",
                name: "file name .ext",
                document: see object created in findBookDocs,
            },
            {
                type: "dir",
                title: "copied from metadata of index.html",
                teaser: "copied from metadata of index.html",
                name: "directory name",
                entries: [
                    // repeat
                ]
            }
        ]
    }
 *
 */
exports.documentTree = function(config, documents) {

    var documentTreeRoot = new module.exports.DocumentTreeEntry({
        type: "root",
        children: []
    });

	var findComponentEntry = function(treeEntry, component) {
		for (var i = 0; i < treeEntry.children.length; i++) {
			var entry = treeEntry.children[i];
            // log('findComponentEntry '+ util.inspect(entry) +' === '+ component.component);
			if (entry && entry.type === "file" && entry.rendername === component.component) {
				return entry;
            }
			if (entry && entry.type === "dir" && entry.entryname === component.component) {
				return entry;
            }
        }
        // log('findComponentEntry found nothing for '+ util.inspect(component));
		return undefined;
	};

    for (let docidx in documents) {

        let doc = documents[docidx];
        // log(`makeBookTree ${util.inspect(doc)}`);

        let curDirInTree = documentTreeRoot;
        let components = componentizeFileName(doc.renderpath);
        // log(`makeBookTree components ${doc.path} ${util.inspect(components)}`);

        /*
         *
         * [ { type: 'dir', component: 'foo', entries: [] },
         *   { type: 'dir', component: 'bar', entries: [] },
         *   { type: 'dir', component: 'bas', entries: [] },
         *   { type: 'dir', component: 'baz', entries: [] },
         *   { type: 'file', component: 'xyzzy.html' } ]
         *
         */
        for (let i = 0; i <  components.length; i++) {
            let component = components[i];
            if (component.type === 'file') {
                let entry = findComponentEntry(curDirInTree, component);
                if (!entry) {
                    curDirInTree.addChild(new module.exports.DocumentTreeEntry({
                        type: "file",
                        entryname: component.component,
                        basedir: doc.basedir,
                        docpath: doc.docpath,
                        docname: doc.docname,
                        fullpath: doc.fullpath,
                        renderer: doc.renderer,
                        stat: doc.stat,
                        renderpath: doc.renderpath,
                        rendername: doc.rendername,
                        metadata: doc.metadata,
                        teaser: doc.metadata.teaser,
                        title: doc.metadata.title
                    }));
                }
            } else if (component.type === 'dir') {
                let entry = findComponentEntry(curDirInTree, component);
                if (!entry) {
                    entry = new module.exports.DocumentTreeEntry({
                        type: "dir",
                        entryname: component.component,
                        children: [],
                        dirpath: curDirInTree.dirpath
                                ? path.join(curDirInTree.dirpath, component.component)
                                : component.component
                    });
                    curDirInTree.addChild(entry);
                }
                curDirInTree = entry;
            } else {
                // ERROR
            }
        }
    }

    var fixTreeSegment = function(segment) {
        segment.children.sort((a,b) => {
            if (a.entryname < b.entryname) return -1;
            else if (a.entryname === b.entryname) return 0;
            else return 1;
        });
        if (segment.type === "root" || segment.type === "dir") {
            for (let entryidx in segment.children) {
                let entry = segment.children[entryidx];
                if (entry.rendername === "index.html") {
                    segment.dirpath = path.join((segment.dirpath ? segment.dirpath : ""), 'index.html');
                    segment.title = entry.metadata.title;
                    if (entry.metadata.teaser) {
                        segment.teaser = entry.metadata.teaser;
                    }
                }
            }
        }
        // log(`makeBookTree fixed segment ${util.inspect(segment)}`);
        for (let entryidx in segment.children) {
            let entry = segment.children[entryidx];
            if (entry.type === "dir") {
                fixTreeSegment(entry);
            }
        }
    };

    // Sort the entries in the whole tree by their file name
    fixTreeSegment(documentTreeRoot);

    return documentTreeRoot;
};


exports.documentSearch = function(config, options) {

    // log(`documentSearch ${util.inspect(options)}`);

    // Find all the documents, under rootPath if specified
    // Build up a useful object for each

    return new Promise((resolve, reject) => {
        globfs.operate(
        config.documentDirs.map(docdir => {
            // This handles complex documentDirs entries
            return typeof docdir === 'string' ? docdir : docdir.src;
        }),
        options.rootPath ? options.rootPath+"/**/*" : "**/*",
        (basedir, fpath, fini) => {
            fs.stat(path.join(basedir, fpath), (err, stat) => {
                if (err) return fini(err);
                // Skip recording directories
                if (stat.isDirectory()) return fini();
                var renderer = akasha.findRendererPath(fpath);
                let filepath = renderer ? renderer.filePath(fpath) : undefined;
                if (renderer && renderer.metadata) {
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
                    // console.log(`options.layouts ${doc.metadata.layout} === ${layout}?`);
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

exports.readDocument = function(config, documentPath) {
    return filez.findRendersTo(config.documentDirs, documentPath)
    .then(found => {
        // console.log('readDocument '+ documentPath +' '+ util.inspect(found));
        found.renderer = akasha.findRendererPath(found.foundFullPath);
        return found;
    })
    .then(found => {
        // console.log('readDocument #2 '+ documentPath +' '+ util.inspect(found));
        return new Promise((resolve, reject) => {
            fs.stat(path.join(found.foundDir, found.foundPathWithinDir), (err, stat) => {
                if (err) reject(err);
                else {
                    found.stat = stat;
                    resolve(found);
                }
            });
        });
    })
    .then(found => {
        return found.renderer.metadata(found.foundDir, found.foundPathWithinDir)
        .then(metadata => {
            return found.renderer.initMetadata(config, found.foundDir, found.foundFullPath, found.foundMountedOn, found.foundBaseMetadata, metadata);
        })
        .then(metadata => { found.metadata = metadata; return found; });
    })
    .then(found => {
        let filepath = found.renderer ? found.renderer.filePath(found.foundPath) : undefined;
        var doc = new exports.Document({
            basedir: found.foundDir,
            docpath: found.foundPath,
            docname: path.basename(found.foundPath),
            fullpath: found.foundFullPath,
            renderer: found.renderer,
            stat: found.stat,
            renderpath: filepath,
            rendername: path.basename(filepath),
            metadata: found.metadata
        });
        // console.log('readDocument #3 '+ util.inspect(doc));
        return doc;
    });
};
