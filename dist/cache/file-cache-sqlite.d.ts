/**
 *
 * Copyright 2014-2025 David Herron
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
import { dirToWatch, VPathData } from '@akashacms/stacked-dirs';
import EventEmitter from 'events';
import { BaseDAO } from 'sqlite3orm';
import { Configuration, dirToMount } from '../index.js';
export declare class Asset {
    vpath: string;
    mime: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    fspath: string;
    renderPath: string;
    mtimeMs: string;
    info: any;
}
type TassetsDAO = BaseDAO<Asset>;
export declare const assetsDAO: TassetsDAO;
export declare class Partial {
    vpath: string;
    mime: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    fspath: string;
    renderPath: string;
    mtimeMs: string;
    docMetadata: any;
    docContent: any;
    docBody: any;
    metadata: any;
    info: any;
}
export declare const partialsDAO: BaseDAO<Partial>;
export declare class Layout {
    vpath: string;
    mime: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    fspath: string;
    renderPath: string;
    mtimeMs: string;
    docMetadata: any;
    docContent: any;
    docBody: any;
    metadata: any;
    info: any;
}
export declare const layoutsDAO: BaseDAO<Layout>;
export declare class Document {
    vpath: string;
    mime: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    fspath: string;
    renderPath: string;
    rendersToHTML: boolean;
    dirname: string;
    parentDir: string;
    mtimeMs: string;
    docMetadata: any;
    docContent: string;
    docBody: string;
    metadata: any;
    tags: any;
    layout: string;
    blogtag: string;
    info: any;
}
type TdocumentssDAO = BaseDAO<Document>;
export declare const documentsDAO: BaseDAO<Document>;
declare class TagGlue {
    docvpath: string;
    tagName: string;
}
export declare const tagGlueDAO: BaseDAO<TagGlue>;
/**
 * Type for return from paths method.  The fields here
 * are whats in the Asset/Layout/Partial classes above
 * plus a couple fields that older code expected
 * from the paths method.
 */
export type PathsReturnType = {
    vpath: string;
    mime: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    mtimeMs: string;
    info: any;
    fspath: string;
    renderPath: string;
};
export declare class BaseFileCache<T extends Asset | Layout | Partial | Document, Tdao extends BaseDAO<T>> extends EventEmitter {
    #private;
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param dao The SQLITE3ORM DAO instance to use
     */
    constructor(config: Configuration, name: string, dirs: dirToMount[], dao: Tdao);
    get config(): Configuration;
    get name(): string;
    get dirs(): dirToMount[];
    set cacheContent(doit: any);
    get gacheContent(): boolean;
    set mapRenderPath(doit: boolean);
    get mapRenderPath(): boolean;
    get dao(): Tdao;
    close(): Promise<void>;
    /**
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    setup(): Promise<void>;
    gatherInfoData(info: T): void;
    handleChanged(name: any, info: any): Promise<void>;
    protected updateDocInDB(info: any): Promise<void>;
    /**
     * We receive this:
     *
     * {
     *    fspath: fspath,
     *    vpath: vpath,
     *    mime: mime.getType(fspath),
     *    mounted: dir.mounted,
     *    mountPoint: dir.mountPoint,
     *    pathInMounted: computed relative path
     *    stack: [ array of these instances ]
     * }
     *
     * Need to add:
     *    renderPath
     *    And for HTML render files, add the baseMetadata and docMetadata
     *
     * Should remove the stack, since it's likely not useful to us.
     */
    handleAdded(name: any, info: any): Promise<void>;
    protected insertDocToDB(info: any): Promise<void>;
    handleUnlinked(name: any, info: any): Promise<void>;
    handleReady(name: any): Promise<void>;
    /**
     * Find the directory mount corresponding to the file.
     *
     * @param {*} info
     * @returns
     */
    fileDirMount(info: any): dirToWatch;
    /**
     * Should this file be ignored, based on the `ignore` field
     * in the matching `dir` mount entry.
     *
     * @param {*} info
     * @returns
     */
    ignoreFile(info: any): boolean;
    /**
     * Allow a caller to wait until the <em>ready</em> event has
     * been sent from the DirsWatcher instance.  This event means the
     * initial indexing has happened.
     */
    isReady(): Promise<boolean>;
    paths(rootPath?: string): Promise<Array<PathsReturnType>>;
    /**
     * Find the file within the cache.
     *
     * @param _fpath The vpath or renderPath to look for
     * @returns boolean true if found, false otherwise
     */
    find(_fpath: any): Promise<T>;
    /**
     * Fulfills the "find" operation not by
     * looking in the database, but by scanning
     * the filesystem using synchronous calls.
     *
     * @param _fpath
     * @returns
     */
    findSync(_fpath: any): VPathData | undefined;
    findAll(): Promise<T[]>;
}
export declare class TemplatesFileCache<T extends Layout | Partial, Tdao extends BaseDAO<T>> extends BaseFileCache<T, Tdao> {
    constructor(config: Configuration, name: string, dirs: dirToMount[], dao: Tdao);
    /**
     * Gather the additional data suitable
     * for Partial and Layout templates.  The
     * full data set required for Documents is
     * not suitable for the templates.
     *
     * @param info
     */
    gatherInfoData(info: any): void;
    protected updateDocInDB(info: any): Promise<void>;
    protected insertDocToDB(info: any): Promise<void>;
}
export declare class DocumentsFileCache extends BaseFileCache<Document, TdocumentssDAO> {
    constructor(config: Configuration, name: string, dirs: dirToMount[]);
    gatherInfoData(info: any): void;
    protected deleteDocTagGlue(vpath: any): Promise<void>;
    protected addDocTagGlue(vpath: any, tags: any): Promise<void>;
    protected updateDocInDB(info: any): Promise<void>;
    protected insertDocToDB(info: any): Promise<void>;
    handleUnlinked(name: any, info: any): Promise<void>;
    indexChain(_fpath: any): Promise<any[]>;
    /**
     * Finds all the documents in the same directory
     * as the named file.
     *
     * This doesn't appear to be used anywhere.
     *
     * @param _fpath
     * @returns
     */
    siblings(_fpath: any): Promise<Document[]>;
    /**
     * Returns a tree of items starting from the document
     * named in _rootItem.  The parameter should be an
     * actual document in the tree, such as `path/to/index.html`.
     * The return is a tree-shaped set of objects like the following;
     *
  tree:
    rootItem: folder/folder/index.html
    dirname: folder/folder
    items:
        - vpath: folder/folder/index.html.md
          renderPath: folder/folder/index.html
    childFolders:
        - dirname: folder/folder/folder
          children:
              rootItem: folder/folder/folder/index.html
              dirname: folder/folder/folder
              items:
                - vpath: folder/folder/folder/index.html.md
                  renderPath: folder/folder/folder/index.html
                - vpath: folder/folder/folder/page1.html.md
                  renderPath: folder/folder/folder/page1.html
                - vpath: folder/folder/folder/page2.html.md
                  renderPath: folder/folder/folder/page2.html
              childFolders: []
        - dirname: folder/folder/folder2
          children:
              rootItem: folder/folder/folder2/index.html
              dirname: folder/folder/folder2
              items:
                - vpath: folder/folder/folder2/index.html.md
                  renderPath: folder/folder/folder2/index.html
                - vpath: folder/folder/folder2/page1.html.md
                  renderPath: folder/folder/folder2/page1.html
                - vpath: folder/folder/folder2/page2.html.md
                  renderPath: folder/folder/folder2/page2.html
              childFolders: []
     *
     * The objects under `items` are actully the full Document object
     * from the cache, but for the interest of compactness most of
     * the fields have been deleted.
     *
     * @param _rootItem
     * @returns
     */
    childItemTree(_rootItem: string): Promise<{
        rootItem: Document;
        dirname: string;
        items: any[];
        childFolders: any[];
    }>;
    /**
     * Find the index files (renders to index.html)
     * within the named subtree.
     *
     * @param rootPath
     * @returns
     */
    indexFiles(rootPath?: string): Promise<any[]>;
    /**
     * For every file in the documents cache,
     * set the access and modifications.
     *
     * ????? Why would this be useful?
     * I can see doing this for the rendered
     * files in the output directory.  But this is
     * for the files in the documents directories. ????
     */
    setTimes(): Promise<void>;
    /**
     * Retrieve the documents which have tags.
     *
     * TODO - Is this function used anywhere?
     *   It is not referenced in akasharender, nor
     *   in any plugin that I can find.
     *
     * @returns
     */
    documentsWithTags(): Promise<Document[]>;
    documentsWithTag(tagnm: string | string[]): Promise<Array<string>>;
    /**
     * Get an array of tags used by all documents.
     * This uses the JSON extension to extract
     * the tags from the metadata object.
     *
     * @returns
     */
    tags(): Promise<string[]>;
    /**
     * Retrieve the data for an internal link
     * within the site documents.  Forming an
     * internal link is at a minimum the rendered
     * path for the document and its title.
     * The teaser, if available, can be used in
     * a tooltip. The thumbnail is an image that
     * could be displayed.
     *
     * @param vpath
     * @returns
     */
    docLinkData(vpath: string): Promise<{
        vpath: string;
        renderPath: string;
        title: string;
        teaser?: string;
        thumbnail?: string;
    }>;
    /**
     * Perform descriptive search operations
     * with many options.  They are converted
     * into a selectAll statement.
     *
     * @param options
     * @returns
     */
    search(options: any): Promise<Array<Document>>;
}
export declare var assetsCache: BaseFileCache<Asset, typeof assetsDAO>;
export declare var partialsCache: TemplatesFileCache<Partial, typeof partialsDAO>;
export declare var layoutsCache: TemplatesFileCache<Layout, typeof layoutsDAO>;
export declare var documentsCache: DocumentsFileCache;
export declare function setup(config: Configuration): Promise<void>;
export declare function closeFileCaches(): Promise<void>;
export {};
//# sourceMappingURL=file-cache-sqlite.d.ts.map