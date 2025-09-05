import { dirToWatch, VPathData } from '@akashacms/stacked-dirs';
import { Configuration, dirToMount, indexChainItem } from '../index.js';
import EventEmitter from 'events';
import { PathsReturnType } from './schema.js';
import { AsyncDatabase } from 'promised-sqlite3';
import { BaseCacheEntry, Asset, Partial, Layout, Document } from './schema.js';
export declare class BaseCache<T extends BaseCacheEntry> extends EventEmitter {
    #private;
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param name string giving the name for this watcher name
     * @param db The PROMISED SQLITE3 AsyncDatabase instance to use
     * @param dbname The database name to use
     */
    constructor(config: Configuration, name: string, dirs: dirToMount[], db: AsyncDatabase, dbname: string);
    get config(): Configuration;
    get name(): string;
    get dirs(): dirToMount[];
    get db(): AsyncDatabase;
    get dbname(): string;
    get quotedDBName(): any;
    close(): Promise<void>;
    /**
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    setup(): Promise<void>;
    /**
     * Validate an item, which is expected to be
     * a row from database query results, using
     * one of the validator functions in schema.ts.
     *
     * This function must be subclassed to
     * function correctly.
     *
     * @param row
     */
    protected validateRow(row: any): T;
    /**
     * Validate an array, which is expected to be
     * database query results, using one of the
     * validator functions in schema.ts.
     *
     * This function must be subclassed to
     * function correctly.
     *
     * @param row
     */
    protected validateRows(rows: any[]): T[];
    /**
     * Convert fields from the database
     * representation to the form required
     * for execution.
     *
     * The database cannot stores JSON fields
     * as an object structure, but as a serialied
     * JSON string.  Inside AkashaCMS code that
     * object must be an object rather than
     * a string.
     *
     * The object passed as "row" should already
     * have been validated using validateRow.
     *
     * @param row
     */
    protected cvtRowToObj(row: any): T;
    /**
     * Find an info object based on vpath and mounted.
     *
     * @param vpath
     * @param mounted
     * @returns
     */
    protected findPathMounted(vpath: string, mounted: string): Promise<Array<{
        vpath: string;
        mounted: string;
    }>>;
    protected findByPathCache: any;
    /**
     * Find an info object by the vpath.
     *
     * @param vpath
     * @returns
     */
    protected findByPath(vpath: string): Promise<any>;
    gatherInfoData(info: T): void;
    protected handleChanged(name: any, info: any): Promise<void>;
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
    protected handleAdded(name: any, info: any): Promise<void>;
    protected insertDocToDB(info: T): Promise<void>;
    protected updateDocInDB(info: T): Promise<void>;
    protected handleUnlinked(name: any, info: any): Promise<void>;
    protected handleReady(name: any): Promise<void>;
    /**
     * Allow a caller to wait until the <em>ready</em> event has
     * been sent from the DirsWatcher instance.  This event means the
     * initial indexing has happened.
     */
    isReady(): Promise<boolean>;
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
    protected pathsCache: any;
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
    paths(rootPath?: string): Promise<Array<PathsReturnType>>;
    /**
     * Find the file within the cache.
     *
     * @param _fpath The vpath or renderPath to look for
     * @returns boolean true if found, false otherwise
     */
    find(_fpath: any): Promise<T | undefined>;
    /**
     * Fulfills the "find" operation not by
     * looking in the database, but by scanning
     * the filesystem using synchronous calls.
     *
     * NOTE: This is used in partialSync
     *
     * @param _fpath
     * @returns
     */
    findSync(_fpath: any): VPathData | undefined;
}
export declare class AssetsCache extends BaseCache<Asset> {
    protected validateRow(row: any): Asset;
    protected validateRows(rows: any[]): Asset[];
    protected cvtRowToObj(row: any): Asset;
    gatherInfoData(info: Asset): void;
    protected insertDocToDB(info: Asset): Promise<void>;
    protected updateDocInDB(info: Asset): Promise<void>;
}
export declare class PartialsCache extends BaseCache<Partial> {
    protected validateRow(row: any): Partial;
    protected validateRows(rows: any[]): Partial[];
    protected cvtRowToObj(row: any): Partial;
    gatherInfoData(info: Partial): void;
    protected insertDocToDB(info: Partial): Promise<void>;
    protected updateDocInDB(info: Partial): Promise<void>;
}
export declare class LayoutsCache extends BaseCache<Layout> {
    protected validateRow(row: any): Layout;
    protected validateRows(rows: any[]): Layout[];
    protected cvtRowToObj(row: any): Layout;
    gatherInfoData(info: Layout): void;
    protected insertDocToDB(info: Layout): Promise<void>;
    protected updateDocInDB(info: Layout): Promise<void>;
}
export declare class DocumentsCache extends BaseCache<Document> {
    protected validateRow(row: any): Document;
    protected validateRows(rows: any[]): Document[];
    protected cvtRowToObj(row: any): Document;
    gatherInfoData(info: Document): void;
    protected insertDocToDB(info: Document): Promise<void>;
    protected updateDocInDB(info: Document): Promise<void>;
    protected deleteDocTagGlue(vpath: any): Promise<void>;
    protected addDocTagGlue(vpath: string, tags: string | string[]): Promise<void>;
    addTagDescription(tag: string, description: string): Promise<void>;
    getTagDescription(tag: string): Promise<string | undefined>;
    protected handleUnlinked(name: any, info: any): Promise<void>;
    protected indexChainCache: any;
    indexChain(_fpath: any): Promise<indexChainItem[]>;
    protected siblingsCache: any;
    /**
     * Finds all the documents in the same directory
     * as the named file.
     *
     * This doesn't appear to be used anywhere.
     *
     * @param _fpath
     * @returns
     */
    siblings(_fpath: any): Promise<any>;
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
        items: Document[];
        childFolders: any[];
    }>;
    /**
     * Find the index files (renders to index.html)
     * within the named subtree.
     *
     * It appears this was written for booknav.
     * But, it appears that booknav does not
     * use this function.
     *
     * @param rootPath
     * @returns
     */
    indexFiles(rootPath?: string): Promise<Document[]>;
    /**
     * For every file in the documents cache,
     * set the access and modifications.
     *
     * This is used from cli.ts docs-set-dates
     *
     * ????? Why would this be useful?
     * I can see doing this for the rendered
     * files in the output directory.  But this is
     * for the files in the documents directories. ????
     */
    setTimes(): Promise<void>;
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
export declare var assetsCache: AssetsCache;
export declare var partialsCache: PartialsCache;
export declare var layoutsCache: LayoutsCache;
export declare var documentsCache: DocumentsCache;
export declare function setup(config: Configuration, db: AsyncDatabase): Promise<void>;
export declare function closeFileCaches(): Promise<void>;
//# sourceMappingURL=cache-sqlite.d.ts.map