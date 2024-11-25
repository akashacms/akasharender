/**
 *
 * Copyright 2014-2022 David Herron
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
import EventEmitter from 'events';
export declare function setup(config: any): Promise<void>;
export declare function close(): Promise<void>;
export declare function getCollection(coll_name: any): any;
export declare var documents: any;
export declare var assets: any;
export declare var layouts: any;
export declare var partials: any;
export declare function setupDocuments(config: any): Promise<void>;
export declare function setupAssets(config: any): Promise<void>;
export declare function setupLayouts(config: any): Promise<void>;
export declare function setupPartials(config: any): Promise<void>;
export declare function closeFileCaches(): Promise<void>;
export declare class FileCache extends EventEmitter {
    /**
     * @param config AkashaRender Configuration object
     * @param dirs array of directories and mount points to watch
     * @param collection string giving the name for this watcher collection
     * @param persistPath string giving the location to persist this collection
     */
    constructor(config: any, dirs: any, collection: any);
    get config(): any;
    get dirs(): any;
    get collection(): any;
    set cacheContent(doit: any);
    get gacheContent(): any;
    set mapRenderPath(doit: any);
    get mapRenderPath(): any;
    /**
     * Add a LokiJS dynamic view to the collection for this FileCache.
     * It is up to the caller of this function to configure the
     * dynamic view.  This function first calls <code>getDynamicView</code>
     * to see if there is an existing view, and if not it calls
     * <code>addDynmicView</code> to add it.  If adding a view, the
     * <code>options</code> parameter is passed in to configure the
     * behavior of the view.
     *
     * See: http://techfort.github.io/LokiJS/DynamicView.html
     *
     * @param {*} vname
     * @param {*} options
     * @returns
     */
    getDynamicView(vname: any, options: any): any;
    /**
     * Set up receiving events from DirsWatcher, and dispatching to
     * the handler methods.
     */
    setup(): Promise<void>;
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
    close(): Promise<void>;
    getCollection(collection?: string): any;
    gatherInfoData(info: any): Promise<void>;
    handleChanged(collection: any, info: any): Promise<void>;
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
    handleAdded(collection: any, info: any): Promise<void>;
    handleUnlinked(collection: any, info: any): Promise<void>;
    handleReady(collection: any): Promise<void>;
    find(_fpath: any): any;
    indexChain(_fpath: any): Promise<any>;
    siblings(_fpath: any): any;
    indexFiles(_dirname: any): any;
    setTimes(): void;
    paths(): any;
    documentsWithTags(): any;
    tags(): any[];
    search(options: any): any;
    readDocument(info: any): Promise<void>;
}
//# sourceMappingURL=file-cache-lokijs.d.ts.map