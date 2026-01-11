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

import path from 'node:path';
import { promises as fsp } from 'node:fs';
import Joi from "joi";
import { AsyncDatabase } from 'promised-sqlite3';
import { lembedModelName } from '../sqdb.js';

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
};

/**
 * Type for return from paths method.  The fields here
 * are whats in the Asset/Layout/Partial classes above
 * plus a couple fields that older code expected
 * from the paths method.
 */
export type PathsReturnType = {
    vpath: string,
    mime?: string,
    mounted: string,
    mountPoint: string,
    pathInMounted: string,
    mtimeMs: number,
    info: any,
    // These will be computed in BaseFileCache
    // They were returned in previous versions.
    fspath: string,
    renderPath: string
};

const joiIsPathsReturnType = Joi.object({
    vpath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    mountPoint: Joi.string(),
    pathInMounted: Joi.string(),
    mtimeMs: Joi.number(), // .integer(),
    info: Joi.any(),
    fspath: Joi.string(),
    renderPath: Joi.string()
});

export function validatePathsReturnType(obj: any): {
    error: any,
    value: PathsReturnType
} {
    return joiIsPathsReturnType.validate(obj);
}

//////////////////// Asset

export interface AssetFields {

};

/**
 * Describes an entry in an Asset directory, meaning
 * the files which are simply copied to the output
 * directory with no rendering process.
 */
export type Asset = BaseCacheEntry & AssetFields;

export const joiAsset = Joi.object({
    vpath: Joi.string(),
    renderPath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    mountPoint: Joi.string(),
    pathInMounted: Joi.string(),
    fspath: Joi.string(),
    dirname: Joi.string(),
    mtimeMs: Joi.number(), // .integer(),
    info: Joi.any()
});

export function validateAsset(obj: any): {
    error: any,
    value: Asset
} {
    return joiAsset.validate(obj);
}

export const createAssetsTable = await fsp.readFile(
        path.join(import.meta.dirname,
            'sql', 'create-table-assets.sql'),
        'utf-8'
);

// This function and its siblings exist to avoid
// potential for conflict in initializing the
// variable holding the SQL and invoking
// the SQL to create the table.  By placing both
// in the same source file we ensure no conflict.
export async function doCreateAssetsTable(
    db: AsyncDatabase
) {
    await db.run(await createAssetsTable);
}

//////////////////// Partial

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
};

export type Partial = BaseCacheEntry & PartialFields;

export const joiPartial = Joi.object({
    vpath: Joi.string(),
    renderPath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    mountPoint: Joi.string(),
    pathInMounted: Joi.string(),
    fspath: Joi.string(),
    dirname: Joi.string(),
    mtimeMs: Joi.number(), // .integer(),
    info: Joi.any(),

    // Added fields
    docBody: Joi.string().optional().allow(null),
    rendererName: Joi.string().optional().allow(null)

});

export function validatePartial(obj: any): {
    error: any,
    value: Partial
} {
    return joiPartial.validate(obj);
}

export const createPartialsTable = await fsp.readFile(
        path.join(import.meta.dirname,
            'sql', 'create-table-partials.sql'),
        'utf-8'
);


export async function doCreatePartialsTable(
    db: AsyncDatabase
) {
    await db.run(await createPartialsTable);
}

//////////////////// Layout

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
};

export type Layout = BaseCacheEntry & LayoutFields;

export const joiLayout = Joi.object({

    vpath: Joi.string(),
    renderPath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    mountPoint: Joi.string(),
    pathInMounted: Joi.string(),
    fspath: Joi.string(),
    dirname: Joi.string(),
    mtimeMs: Joi.number(), // .integer(),
    info: Joi.any(),

    // Added fields
    rendersToHTML: Joi.alternatives()
        .try(
            Joi.boolean(),
            Joi.number().integer().min(0).max(1)
        ),
    docBody: Joi.string().optional().allow(null),
    rendererName: Joi.string().min(0).optional().allow(null)

});

export function validateLayout(obj: any): {
    error: any,
    value: Layout
} {
    return joiLayout.validate(obj);
}

export const createLayoutsTable = await fsp.readFile(
        path.join(import.meta.dirname,
            'sql', 'create-table-layouts.sql'),
        'utf-8'
);

export async function doCreateLayoutsTable(
    db: AsyncDatabase
) {
    await db.run(await createLayoutsTable);
}

//////////////////// Document

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
    // IN BASE CACHE dirname: string;

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
};

export type Document = BaseCacheEntry
                     & DocumentFields;

export const joiDocument = Joi.object({

    vpath: Joi.string(),
    mime: Joi.string().optional().allow(null),
    mounted: Joi.string(),
    mountPoint: Joi.string(),
    pathInMounted: Joi.string(),
    fspath: Joi.string(),
    dirname: Joi.string(),
    mtimeMs: Joi.number(), // .integer(),
    info: Joi.any(),

    // Added fields
    renderPath: Joi.string(),
    rendersToHTML: Joi.alternatives()
        .try(
            Joi.boolean(),
            Joi.number().integer().min(0).max(1)
        ),
    parentDir: Joi.string(),
    publicationTime: Joi.number().optional().allow(null),
    baseMetadata: Joi.any(),
    docMetadata: Joi.any(),
    docContent: Joi.string().min(0).optional().allow(null),
    docBody: Joi.string().min(0).optional().allow(null),
    metadata: Joi.any(),
    title: Joi.string().optional().allow(null),
    tags: Joi.any(),
    layout: Joi.alternatives()
        .try(
            Joi.string(),
            Joi.allow(null)
        ),
    blogtag: Joi.alternatives()
        .try(
            Joi.string(),
            Joi.allow(null)
        ),
    rendererName: Joi.string().min(0).optional().allow(null)

});

export function validateDocument(obj: any): {
    error: any,
    value: Document
} {
    return joiDocument.validate(obj);
}

export const createDocumentsTable = await fsp.readFile(
        path.join(import.meta.dirname,
            'sql', 'create-table-documents.sql'),
        'utf-8'
);

export async function doCreateDocumentsTable(
    db: AsyncDatabase
) {
    await db.run(await createDocumentsTable);
}

export const createVecDocumentsTable  = await fsp.readFile(
        path.join(import.meta.dirname,
            'sql', 'create-table-vec-documents.sql'),
        'utf-8'
);

export async function doCreateVecDocumentsTable(
    db: AsyncDatabase
) {
    if (typeof lembedModelName === 'string') {
        await db.run(await createVecDocumentsTable);
    }
}
