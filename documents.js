
'use strict';

/*
 * 
This is meant to replace the Entry thingy in AkashaCMS

That object incorporated known data about each Document


Use documents.js to

* DONE host a Document class
* DONE that class has a metadata getter, among others
* cached lookup by docpath or renderpath
* sorting arrays of Document
* converting an Document array to a tree structure (for booknav)
* documentSearch lives there and produces Document array
* Document subclasses HTMLDocument ImageDocument etc

{
                basedir: doc.basedir,
                docpath: doc.path,
                docname: doc.result.fname,
                fullpath: doc.fullpath,
                renderer: doc.result.renderer,
                stat: doc.result.stat,
                renderpath: doc.result.filepath,
                rendername: doc.result.name,
                metadata: doc.result.metadata
            }

 */

/**
 * This might be a base class with several other classes depending on file extension.
 */
module.exports.Document = class Document {
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
    
    get basedir() { return this._basedir; }
    get docpath() { return this._docpath; }
    get docname() { return this._docname; }
    get fullpath() { return this._fullpath; }
    get renderer() { return this._renderer; }
    get stat() { return this._stat; }
    get renderpath() { return this._renderpath; }
    get rendername() { return this._rendername; }
    get metadata() { return this._metadata; }
};

module.exports.HTMLDocument = class HTMLDocument extends module.exports.Document {
    constructor(params) { super(params); }
};

module.exports.ImageDocument = class ImageDocument extends module.exports.Document {
    constructor(params) { super(params); }
};
