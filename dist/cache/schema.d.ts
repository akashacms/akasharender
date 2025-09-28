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
import Joi from "joi";
import { AsyncDatabase } from 'promised-sqlite3';
/**
 * Every cache entry has these fields.  For
 * most cache types, there will be additional
 * fields.
 */
export interface BaseCacheEntry {
    /**
     * Virtual path
     */
    vpath: string;
    /**
     * MIME type
     */
    mime?: string;
    /**
     * The file-system path which is mounted
     * into the virtual file space.
     */
    mounted: string;
    /**
     * The virtual directory of the mount
     * entry in the directory stack.
     */
    mountPoint: string;
    /**
     * The relative path underneath the mountPoint.
     */
    pathInMounted: string;
    /**
     * Absolute path name in the physical
     * filesystem.
     */
    fspath: string;
    /**
     * dirname for fspath
     */
    dirname: string;
    /**
     * The modification time, in miliseconds.
     */
    mtimeMs: number;
    /**
     * Info object provided by StackedDirs and
     * annotated with gatherInfoData
     */
    info: any;
}
/**
 * Type for return from paths method.  The fields here
 * are whats in the Asset/Layout/Partial classes above
 * plus a couple fields that older code expected
 * from the paths method.
 */
export type PathsReturnType = {
    vpath: string;
    mime?: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    mtimeMs: number;
    info: any;
    fspath: string;
    renderPath: string;
};
export declare function validatePathsReturnType(obj: any): {
    error: any;
    value: PathsReturnType;
};
export interface AssetFields {
}
/**
 * Describes an entry in an Asset directory, meaning
 * the files which are simply copied to the output
 * directory with no rendering process.
 */
export type Asset = BaseCacheEntry & AssetFields;
export declare const joiAsset: Joi.ObjectSchema<any>;
export declare function validateAsset(obj: any): {
    error: any;
    value: Asset;
};
export declare const createAssetsTable: string;
export declare function doCreateAssetsTable(db: AsyncDatabase): Promise<void>;
export interface PartialFields {
    /**
     * The content for the template.
     */
    docBody: string;
    /**
     * The name of the Renderer class.
     *
     * ??? TODO IS THIS NEEDED
     */
    rendererName: string;
}
export type Partial = BaseCacheEntry & PartialFields;
export declare const joiPartial: Joi.ObjectSchema<any>;
export declare function validatePartial(obj: any): {
    error: any;
    value: Partial;
};
export declare const createPartialsTable: string;
export declare function doCreatePartialsTable(db: AsyncDatabase): Promise<void>;
export interface LayoutFields {
    /**
     * Whether this template produces
     * HTML.
     *
     * ??? IS THIS NEEDED?
     */
    rendersToHTML: boolean;
    /**
     * The content for the template.
     */
    docBody: string;
    /**
     * The name of the Renderer class.
     *
     * ??? TODO IS THIS NEEDED
     */
    rendererName: string;
}
export type Layout = BaseCacheEntry & LayoutFields;
export declare const joiLayout: Joi.ObjectSchema<any>;
export declare function validateLayout(obj: any): {
    error: any;
    value: Layout;
};
export declare const createLayoutsTable: string;
export declare function doCreateLayoutsTable(db: AsyncDatabase): Promise<void>;
export interface DocumentFields {
    /**
     * The virtual pathname to which this
     * document renders in the output directory.
     */
    renderPath: string;
    /**
     * Whether this template produces
     * HTML.
     *
     * ??? IS THIS NEEDED?
     */
    rendersToHTML: boolean;
    /**
     * The virtual pathname that is the
     * directory name of the renderPath.
     */
    /**
     * The virtual pathname that is the
     * parent directory name of dirname.
     *
     * ????? IS THIS NEEDED
     */
    parentDir: string;
    /**
     * The "time" (seconds since Jan 1 1970)
     * corresponding to the publicationDate
     * field in the document metadata.
     *
     * INTEGER GENERATED ALWAYS
     *  AS (json_extract(info, '$.publicationTime')) STORED
     */
    publicationTime: number;
    /**
     * The value for the baseMetadata of
     * the mounted virtual directory in
     * which this file is stored.  This
     * metadata is used in computing the
     * final metadata.
     *
     * TEXT GENERATED ALWAYS
     *  AS (json_extract(info, '$.baseMetadata')) STORED
     */
    baseMetadata: any;
    /**
     * The value for the header metadata of
     * the document.  This metadata is used,
     * along with docMetadata, in computing the
     * final metadata.
     */
    docMetadata: any;
    /**
     * The content for the document.
     */
    docContent: string;
    /**
     * The body portion of the document.
     */
    docBody: string;
    /**
     * The final metadata for the document,
     * which is computed from baseMetadata
     * and docMetadata.
     *
     * TEXT GENERATED ALWAYS
     *  AS (json_extract(info, '$.metadata')) STORED
     */
    metadata: any;
    /**
     * The article title (if any)
     */
    title?: string;
    /**
     * The array of tag strings derived from
     * the tags field of the document metadata.
     *
     * TEXT GENERATED ALWAYS
     *  AS (json_extract(info, '$.metadata.tags')) STORED
     */
    tags: any;
    /**
     * The content of the layout field
     * of the document metadata.
     *
     * TEXT GENERATED ALWAYS
     *  AS (json_extract(metadata, '$.layout')) STORED
     */
    layout: string;
    /**
     * The content of the blogtag field
     * of the document metadata.
     *
     * TEXT GENERATED ALWAYS
     *  AS (json_extract(metadata, '$.blogtag')) STORED
     */
    blogtag: string;
    /**
     * The name of the Renderer class.
     *
     * ??? TODO IS THIS NEEDED
     */
    rendererName: string;
}
export type Document = BaseCacheEntry & DocumentFields;
export declare const joiDocument: Joi.ObjectSchema<any>;
export declare function validateDocument(obj: any): {
    error: any;
    value: Document;
};
export declare const createDocumentsTable: string;
export declare function doCreateDocumentsTable(db: AsyncDatabase): Promise<void>;
export declare const createVecDocumentsTable: string;
export declare function doCreateVecDocumentsTable(db: AsyncDatabase): Promise<void>;
//# sourceMappingURL=schema.d.ts.map