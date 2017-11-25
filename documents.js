
/**
 * Dealing with HTMLRenderer document files.
 * @module documents
 */

'use strict';

const path  = require('path');
const util  = require('util');
const co    = require('co');
const filez = require('./filez');
const fs    = require('fs-extra');
const globfs = require('globfs');
const akasha = require('./index');

const log   = require('debug')('akasha:documents');
const error = require('debug')('akasha:error-documents');

const _document_basedir = Symbol('basedir');
const _document_mountedOn = Symbol('mountedOn');
const _document_mountedMeta = Symbol('mountedMetadata');
const _document_docpath = Symbol('docpath');
const _document_fullpath = Symbol('fullpath');
const _document_renderer = Symbol('renderer');
const _document_stat = Symbol('stat');
const _document_renderpath = Symbol('renderpath');
const _document_data = Symbol('data');
const _document_metadata = Symbol('metadata');
const _document_text = Symbol('text');

/**
 * Standardized object to describe document files which render using an HTMLRenderer.
 */
exports.Document = class Document {
    constructor(params) {
        this[_document_basedir]  = params ? params.basedir : undefined;
        this[_document_docpath]  = params ? params.docpath : undefined;
        this[_document_fullpath] = params ? params.fullpath : undefined;
        this[_document_renderer] = params ? params.renderer : undefined;
        this[_document_stat]     = params ? params.stat : undefined;
        // this.renderpath = params ? params.renderpath : undefined;
        this[_document_metadata] = params ? params.metadata : undefined;
        this[_document_data] = params ? params.data : undefined;
        this[_document_text] = params ? params.text : undefined;
    }

    /**
     * The directory structure within which this document was found.
     * @member {string} basedir
     */
    get basedir() { return this[_document_basedir]; }
    set basedir(dir) { this[_document_basedir] = dir; }

    /**
     * Metadata for the mounted directory.
     * @member {string} basedir
     */
    get mountedDirMetadata() { return this[_document_mountedMeta]; }
    set mountedDirMetadata(meta) { this[_document_mountedMeta] = meta; }

    /**
     * The directory structure mounted within basedir in which this document was found.
     * @member {string} basedir
     */
    get dirMountedOn() { return this[_document_mountedOn]; }
    set dirMountedOn(dir) { this[_document_mountedOn] = dir; }

    /**
     * The path for this document within basedir.
     * @member {string} docpath
     */
    get docpath() { return this[_document_docpath]; }
    set docpath(docpath) { this[_document_docpath] = docpath; }

    /**
     * The basename of docpath.
     */
    get docname() { return this.docpath ? path.basename(this.docpath) : undefined; }

    /**
     * Full pathname for the source file -- essentially path.join(basedir, docpath)
     */
    get fullpath() { return this[_document_fullpath]; }
    set fullpath(fullpath) { this[_document_fullpath] = fullpath; }

    /**
     * The renderer that is to be used to render this document
     */
    get renderer() { return this[_document_renderer]; }
    set renderer(renderer) { this[_document_renderer] = renderer; }

    /**
     * The Stats object returned from fs.stat
     */
    get stat() { return this[_document_stat]; }
    set stat(stat) { this[_document_stat] = stat; }

    /**
     * The path for rendering this document into RenderDestination
     */
    get renderpath() { 
        if (! this.renderer) {
            this.docpath;
        } else {
            return this.renderer.filePath(this.docpath); 
        }
    }

    /**
     * The basename of renderpath
     */
    get rendername() { return this.renderpath ? path.basename(this.renderpath) : undefined; }

    /**
     * Original data for document
     */
    get data() { return this[_document_data]; }
    set data(data) { this[_document_data] = data; }

    /**
     * Document metadata
     */
    get metadata() { return this[_document_metadata]; }
    set metadata(metadata) { this[_document_metadata] = metadata; }

    /**
     * Text portion of the document
     */
    get text() { return this[_document_text]; }
    set text(textbody) { this[_document_text] = textbody; }

    /**
     * Update the Document, and save the new contents to disk.
     * @param {*} content 
     */
    async updateSave(config, content) {
        var document = this;
        // console.log(`updateSave ${util.inspect(document)}`);
        let writeTo = path.join(document.basedir, document.docpath);
        // console.log(`writeFile writeTo ${writeTo}`);
        await fs.writeFile(writeTo, content, 'utf8');
        document.stat = await fs.stat(writeTo);
        return document.readDocumentContent(config);
    }

    async readDocumentContent(config) {
        var document = this;
        // console.log(`readDocumentContent ${document.basedir} ${document.dirMountedOn} docpath ${document.docpath} fullpath ${document.fullpath} renderer ${document.renderer} renderpath ${document.renderpath}`);
        const readFrom = path.join(
                            document.basedir,
                            // document.dirMountedOn,
                            document.docpath);
        // console.log(`readDocumentContent read from ${readFrom}`);
        document.stat = await fs.stat(readFrom);
        const content = await fs.readFile(readFrom, 'utf8');
        if (document.renderer && document.renderer.frontmatter) {
            const matter = document.renderer.parseFrontmatter(content);
            // console.log(`readDocumentContent got frontmatter ${util.inspect(matter)}`);
            document.data = matter.orig;
            document.metadata = await document.renderer.initMetadata(config, 
                document.basedir, document.docpath, document.dirMountedOn,
                document.mountedDirMetadatal, matter.data);
                document.text = matter.content;
            document.text = matter.content;
        } else {
            document.data = content;
        }
        return document;
        // .catch(err => { console.error('readDocumentContent '+ err.stack); throw err; });
    }

    async renderToFile(config) {
        var document = this;
        // console.log(`before render `);
        var docrendered = await document.renderer.render(
            document.text, document.metadata
        );
        // console.log(`before maharun `);
        if (document.renderer.doMahabhuta(document.fullpath)) {
            docrendered = await document.renderer.maharun(
                docrendered, document.metadata, config.mahafuncs
            );
        }
        // console.log(`before renderForLayout `);
        docrendered = await document.renderer.renderForLayout(
            docrendered, document.metadata, config
        );

        // console.log(`renderToFile ${path.join(config.renderTo, document.dirMountedOn)} ${document.renderpath}`)
        await filez.writeFile(
            path.join(config.renderTo, document.dirMountedOn),
            document.renderpath,
            docrendered
        );
    }
};

exports.HTMLDocument = class HTMLDocument extends module.exports.Document {
    constructor(params) { super(params); }
};

exports.ImageDocument = class ImageDocument extends module.exports.Document {
    constructor(params) { super(params); }
};

const _document_tree_type = Symbol('tree_type');
const _document_tree_entryname = Symbol('tree_entryname');
const _document_tree_dirpath = Symbol('tree_dirpath');
const _document_tree_children = Symbol('tree_children');
const _document_tree_teaser = Symbol('tree_teaser');
const _document_tree_title = Symbol('tree_title');

exports.DocumentTreeEntry = class DocumentTreeEntry extends module.exports.Document {

    constructor(params) {
        super(params);
        this[_document_tree_type] = params ? params.type : undefined;
        this[_document_tree_entryname] = params ? params.entryname : undefined;
        this[_document_tree_dirpath] = params ? params.dirpath : undefined;
        this[_document_tree_children] = params ? params.children : undefined;
        this[_document_tree_teaser] = params ? params.teaser : undefined;
        this[_document_tree_title] = params ? params.title : undefined;
    }

    get type() { return this[_document_tree_type]; }
    set type(t) { this[_document_tree_type] = t; }

    get entryname() { return this[_document_tree_entryname]; }
    set entryname(entryname) { this[_document_tree_entryname] = entryname; }

    get dirpath() { return this[_document_tree_dirpath]; }
    set dirpath(dirpath) { this[_document_tree_dirpath] = dirpath; }

    get children() { return this[_document_tree_children]; }
    set children(arry) { this[_document_tree_children] = arry; }

    get teaser() { return this[_document_tree_teaser]; }
    set teaser(teaser) { this[_document_tree_teaser] = teaser; }

    get title() { return this[_document_tree_title]; }
    set title(title) { this[_document_tree_title] = title; }

    addChild(child) {
        if (!(this[_document_tree_type] === "dir" || this[_document_tree_type] === "root")) throw new Error("Not a directory in adding "+ util.inspect(child));
        if (this[_document_tree_children]) this[_document_tree_children].push(child);
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
    const parsed = path.parse(filename);
	ret.push({ type: 'file', component: path.basename(filename) });
    for (filename = path.dirname(filename);
     filename !== '.' && filename !== parsed.root;
     filename = path.dirname(filename)) {
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

    var documentTreeRoot = new module.exports.DocumentTreeEntry();
    documentTreeRoot.type = "root";
    documentTreeRoot.children = [];

	var findComponentEntry = function(treeEntry, component) {
        if (!treeEntry) return undefined;
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

    for (let doc of documents) {

        // let doc = documents[docidx];
        // log(`makeBookTree ${util.inspect(doc)}`);

        // if (typeof doc.renderpath === 'undefined') {
        //    console.log(`documentTree strange document ${util.inspect(doc)}`);
        // }

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
                    let treeEntry = new module.exports.DocumentTreeEntry();
                    treeEntry.type = "file";
                    treeEntry.entryname = component.component;
                    treeEntry.basedir = doc.basedir;
                    treeEntry.docpath = doc.docpath;
                    treeEntry.fullpath = doc.fullpath;
                    treeEntry.renderer = doc.renderer;
                    treeEntry.stat = doc.stat;
                    treeEntry.metadata = doc.metadata;
                    treeEntry.teaser = doc.metadata.teaser;
                    treeEntry.title = doc.metadata.title;
                    curDirInTree.addChild(treeEntry);
                }
            } else if (component.type === 'dir') {
                let entry = findComponentEntry(curDirInTree, component);
                if (!entry) {
                    entry = new module.exports.DocumentTreeEntry();
                    entry.type = "dir";
                    entry.entryname = component.component;
                    entry.children = [];
                    entry.dirpath = curDirInTree && curDirInTree.dirpath
                            ? path.join(curDirInTree.dirpath, component.component)
                            : component.component;
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


exports.documentSearch = async function(config, options) {

    // console.log(`documentSearch ${util.inspect(config.documentDirs)} ${util.inspect(options)}`);

    // Find all the documents, under rootPath if specified
    // Build up a useful object for each

    var documents = await globfs.operateAsync(
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
    });

    // the object array we receive is suboptimally organized.
    // We first flatten it so it's more useful
    // console.log(`documentSearch before filtering ${util.inspect(documents)}`);
    documents = documents.map(doc => {
        let ret = new exports.Document();
        ret.basedir = doc.basedir;
        ret.docpath = doc.result.fpath;
        ret.fullpath = doc.fullpath;
        ret.stat = doc.result.stat;
        ret.renderer = doc.result.renderer;
        ret.metadata = doc.result.metadata;
        return ret;
    });

    // Then filter the list, potentially removing some items if they
    // do not validate against the filters specified in the options object.
    // These are separate .then calls even though it's not truly necessary.
    // This is for ease of implementation so each phase can be eliminated
    // or new phases added easily.
    // console.log(`documentSearch documents #1 ${util.inspect(documents)}`);

    if (options.pathmatch) {
        documents = documents.filter(doc => {
            var ret = doc.docpath.match(options.pathmatch) !== null;
            return ret;
        });
    }

    if (options.renderers) {
        documents = documents.filter(doc => {
            if (!options.renderers) return true;
            for (let renderer of options.renderers) {
                if (doc.renderer instanceof renderer) {
                    return true;
                }
            }
            return false;
        });
    }

    if (options.layouts) {
        documents = documents.filter(doc => {
            for (let layout of options.layouts) {
                // console.log(`options.layouts ${doc.metadata.layout} === ${layout}?`);
                if (doc.metadata.layout === layout) {
                    return true;
                }
            }
            return false;
        });
    }

    // console.log(`documentSearch documents #4 ${util.inspect(documents)}`);

    if (options.filterfunc) {
        documents = documents.filter(doc => {
            return options.filterfunc(config, options, doc);
        });
    }

    documents = documents.sort((a, b) => {
        if (a.renderpath < b.renderpath) return -1;
        else if (a.renderpath === b.renderpath) return 0;
        else return 1;
    });

    /* console.log(`documentSearch final ${util.inspect(documents.map(doc => {
        return {
            basedir: doc.basedir, 
            docpath: doc.docpath,
            stat: doc.stat
        }
    }))}`); */
    return documents;

};

/**
 * Find the Document by its path within one of the DocumentDirs, then construct a Document object.
 */
exports.readDocument = async function(config, documentPath) {
    var doc = new exports.Document();
    var found = await filez.findRendersTo(config.documentDirs, documentPath)
    // console.log('readDocument '+ documentPath +' '+ util.inspect(found));
    if (!found) {
        throw new Error(`Did not find document for ${util.inspect(documentPath)} in ${util.inspect(config.documentDirs)}`);
    }
    // console.log('readDocument #1 '+ util.inspect(doc));
    doc.basedir = found.foundDir;
    doc.dirMountedOn = found.foundMountedOn;
    doc.mountedDirMetadata = found.foundBaseMetadata;
    doc.docpath = found.foundPathWithinDir;
    doc.fullpath = found.foundFullPath;
    doc.renderer = akasha.findRendererPath(found.foundFullPath);
    // doc.renderpath = found.renderer ? found.renderer.filePath(found.foundPathWithinDir) : undefined;

    // console.log(`readDocument before readDocumentContent ${doc.basedir} docpath ${doc.docpath} fullpath ${doc.fullpath} renderer ${doc.renderer} renderpath ${doc.renderpath}`);
    await doc.readDocumentContent(config);

    /* doc.stat = await fs.stat(path.join(found.foundDir, found.foundPathWithinDir));

    // console.log(`readDocument #2 basedir ${doc.basedir} docpath ${doc.docpath} fullpath ${doc.fullpath} renderer ${doc.renderer} renderpath ${doc.renderpath}`);
    if (doc.renderer && doc.renderer.frontmatter) {
        // console.log(`readDocument getting frontmatter ${found.foundDir} / ${found.foundPathWithinDir}`);
        var matter = await doc.renderer.frontmatter(found.foundDir, found.foundPathWithinDir);
        // console.log(`readDocument frontmatter ${util.inspect(matter)}`);
        doc.data = matter.orig;
        doc.metadata = await doc.renderer.initMetadata(config,
                found.foundDir, found.foundPathWithinDir, found.foundMountedOn,
                found.foundBaseMetadata, matter.data);
        doc.text = matter.content;
    } */

    // console.log(`readDocument #3 data ${doc.data} metadata ${doc.metadata}`);
    return doc;
};
