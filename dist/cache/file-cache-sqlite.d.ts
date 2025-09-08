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
import { VPathData } from '@akashacms/stacked-dirs';
import EventEmitter from 'events';
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
export declare class BaseFileCache<T, // extends Asset | Layout | Partial | Document,
Tdao> extends EventEmitter {
    #private;
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param dao The SQLITE3ORM DAO instance to use
     */
    constructor(name: string, dao: Tdao);
    get name(): string;
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
    protected cvtRowToObj(obj: any): void;
    protected cvtRowToObjBASE(obj: any, dest: any): void;
    /**
     * Find an info object based on vpath and mounted.
     *
     * @param vpath
     * @param mounted
     * @returns
     */
    protected findPathMounted(vpath: string, mounted: string): Promise<void>;
    /**
     * Find an info object by the vpath.
     *
     * @param vpath
     * @returns
     */
    protected findByPath(vpath: string): Promise<void>;
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
    /**
     * Find the directory mount corresponding to the file.
     *
     * @param {*} info
     * @returns
     */
    fileDirMount(info: any): any;
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
    /**
     * Return simple information about each
     * path in the collection.  The return
     * type is an array of PathsReturnType.
     *
     * I found two uses for this function.
     * In copyAssets, the vpath and other
     * simple data is used for copying items
     * to the output directory.
     * In render.ts, the simple fields are
     * used to then call find to retrieve
     * the full information.
     *
     * @param rootPath
     * @returns
     */
    paths(rootPath?: string): Promise<void>;
    /**
     * Find the file within the cache.
     *
     * @param _fpath The vpath or renderPath to look for
     * @returns boolean true if found, false otherwise
     */
    find(_fpath: any): Promise<void>;
    /**
     * Fulfills the "find" operation not by
     * looking in the database, but by scanning
     * the filesystem using synchronous calls.
     *
     * @param _fpath
     * @returns
     */
    findSync(_fpath: any): VPathData | undefined;
}
export declare class AssetsFileCache<T, // extends Asset,
Tdao> extends BaseFileCache<T, Tdao> {
    constructor(name: string, dao: Tdao);
}
export declare class TemplatesFileCache<T, // extends Layout | Partial,
Tdao extends BaseFileCache<T, Tdao>> {
    #private;
    constructor(name: string, dao: Tdao, type: "layout" | "partial");
    get isLayout(): boolean;
    get isPartial(): boolean;
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
export declare class DocumentsFileCache {
    protected cvtRowToObj(obj: any): Document;
    gatherInfoData(info: any): void;
    protected deleteDocTagGlue(vpath: any): Promise<void>;
    protected addDocTagGlue(vpath: string, tags: string | string[]): Promise<void>;
    addTagDescription(tag: string, description: string): Promise<void>;
    getTagDescription(tag: string): Promise<void>;
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
    siblings(_fpath: any): Promise<void>;
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
    childItemTree(_rootItem: string): Promise<void>;
    /**
     * Find the index files (renders to index.html)
     * within the named subtree.
     *
     * @param rootPath
     * @returns
     */
    indexFiles(rootPath?: string): Promise<void>;
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
    documentsWithTag(tagnm: string | string[]): Promise<void>;
    /**
     * Get an array of tags used by all documents.
     * This uses the JSON extension to extract
     * the tags from the metadata object.
     *
     * @returns
     */
    tags(): Promise<void>;
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
    docLinkData(vpath: string): Promise<void>;
    private searchCache;
    /**
     * Perform descriptive search operations using direct SQL queries
     * for better performance and scalability.
     *
     * @param options Search options object
     * @returns Promise<Array<Document>>
     */
    search(options: any): Promise<Array<Document>>;
    /**
     * Build SQL query and parameters for search options
     */
    private buildSearchQuery;
}
export declare function setup(): Promise<void>;
export declare function closeFileCaches(): Promise<void>;
//# sourceMappingURL=file-cache-sqlite.d.ts.map