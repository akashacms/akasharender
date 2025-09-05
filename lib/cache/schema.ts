import Joi from "joi";

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

export const createAssetsTable = `
CREATE TABLE IF NOT EXISTS "ASSETS" (
  \`vpath\` TEXT PRIMARY KEY,
  \`renderPath\` TEXT  GENERATED ALWAYS
        AS (vpath) STORED,
  \`mime\` TEXT,
  \`mounted\` TEXT,
  \`mountPoint\` TEXT,
  \`pathInMounted\` TEXT,
  \`fspath\` TEXT,
  \`dirname\` TEXT,
  \`mtimeMs\` REAL,
  \`info\` TEXT
) WITHOUT ROWID;
CREATE INDEX "asset_vpath"
        ON "ASSETS" ("vpath");
CREATE INDEX "asset_mounted"
        ON "ASSETS" ("mounted");
CREATE INDEX "asset_mountPoint"
        ON "ASSETS" ("mountPoint");
CREATE INDEX "asset_pathInMounted"
        ON "ASSETS" ("pathInMounted");
CREATE INDEX "asset_fspath"
        ON "ASSETS" ("fspath");
CREATE INDEX "asset_dirname"
        ON "ASSETS" ("dirname");
CREATE INDEX "asset_mtimeMs"
        ON "ASSETS" ("mtimeMs");
CREATE INDEX "asset_vpath_renderpath"
        ON "ASSETS" ("vpath", "renderPath");
`;

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

export const createPartialsTable = `
CREATE TABLE IF NOT EXISTS "PARTIALS" (
  \`vpath\` TEXT PRIMARY KEY,
  \`renderPath\` TEXT  GENERATED ALWAYS
        AS (vpath) STORED,
  \`mime\` TEXT,
  \`mounted\` TEXT,
  \`mountPoint\` TEXT,
  \`pathInMounted\` TEXT,
  \`fspath\` TEXT,
  \`dirname\` TEXT,
  \`mtimeMs\` REAL,
  \`docBody\` TEXT,
  \`rendererName\` TEXT,
  \`info\` TEXT
) WITHOUT ROWID;
CREATE INDEX "partial_vpath"
        ON "PARTIALS" ("vpath");
CREATE INDEX "partial_mounted"
        ON "PARTIALS" ("mounted");
CREATE INDEX "partial_mountPoint"
        ON "PARTIALS" ("mountPoint");
CREATE INDEX "partial_pathInMounted"
        ON "PARTIALS" ("pathInMounted");
CREATE INDEX "partial_fspath"
        ON "PARTIALS" ("fspath");
CREATE INDEX "partial_dirname"
        ON "PARTIALS" ("dirname");
CREATE INDEX "partial_mtimeMs"
        ON "PARTIALS" ("mtimeMs");
CREATE INDEX "partial_vpath_renderpath"
        ON "PARTIALS" ("vpath", "renderPath");
`;

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

export const createLayoutsTable = `
CREATE TABLE IF NOT EXISTS "LAYOUTS" (
  \`vpath\` TEXT PRIMARY KEY,
  \`renderPath\` TEXT  GENERATED ALWAYS
        AS (vpath) STORED,
  \`mime\` TEXT,
  \`mounted\` TEXT,
  \`mountPoint\` TEXT,
  \`pathInMounted\` TEXT,
  \`fspath\` TEXT,
  \`dirname\` TEXT,
  \`mtimeMs\` REAL,
  \`rendersToHTML\` INTEGER,
  \`docBody\` TEXT,
  \`rendererName\` TEXT,
  \`info\` TEXT
) WITHOUT ROWID;
CREATE INDEX "layout_vpath"
        ON "LAYOUTS" ("vpath");
CREATE INDEX "layout_mounted"
        ON "LAYOUTS" ("mounted");
CREATE INDEX "layout_mountPoint"
        ON "LAYOUTS" ("mountPoint");
CREATE INDEX "layout_pathInMounted"
        ON "LAYOUTS" ("pathInMounted");
CREATE INDEX "layout_fspath"
        ON "LAYOUTS" ("fspath");
CREATE INDEX "layout_dirname"
        ON "LAYOUTS" ("dirname");
CREATE INDEX "layout_mtimeMs"
        ON "LAYOUTS" ("mtimeMs");
CREATE INDEX "layout_vpath_renderpath"
        ON "LAYOUTS" ("vpath", "renderPath");
`;

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

export const createDocumentsTable = `
CREATE TABLE IF NOT EXISTS "DOCUMENTS" (
  \`vpath\` TEXT PRIMARY KEY,
  \`mime\` TEXT,
  \`mounted\` TEXT,
  \`mountPoint\` TEXT,
  \`pathInMounted\` TEXT,
  \`fspath\` TEXT,
  \`dirname\` TEXT,
  \`mtimeMs\` REAL,
  \`renderPath\` TEXT,
  \`rendersToHTML\` INTEGER,
  \`parentDir\` TEXT,
  \`publicationTime\` INTEGER GENERATED ALWAYS
        AS (json_extract(info, '$.publicationTime')) STORED,
  \`baseMetadata\` TEXT GENERATED ALWAYS
        AS (json_extract(info, '$.baseMetadata')) STORED,
  \`docMetadata\` TEXT,
  \`docContent\` TEXT,
  \`docBody\` TEXT,
  \`metadata\` TEXT GENERATED ALWAYS
        AS (json_extract(info, '$.metadata')) STORED,
  \`tags\` TEXT GENERATED ALWAYS
        AS (json_extract(info, '$.metadata.tags')) STORED,
  \`layout\` TEXT GENERATED ALWAYS
        AS (json_extract(metadata, '$.layout')) STORED,
  \`blogtag\` TEXT GENERATED ALWAYS
        AS (json_extract(metadata, '$.blogtag')) STORED,
  \`rendererName\` TEXT,
  \`info\` TEXT
) WITHOUT ROWID;
CREATE INDEX "document_vpath"
        ON "DOCUMENTS" ("vpath");
CREATE INDEX "document_mounted"
        ON "DOCUMENTS" ("mounted");
CREATE INDEX "document_mountPoint"
        ON "DOCUMENTS" ("mountPoint");
CREATE INDEX "document_pathInMounted"
        ON "DOCUMENTS" ("pathInMounted");
CREATE INDEX "document_fspath"
        ON "DOCUMENTS" ("fspath");
CREATE INDEX "document_dirname"
        ON "DOCUMENTS" ("dirname");
CREATE INDEX "document_renderPath"
        ON "DOCUMENTS" ("renderPath");
CREATE INDEX "document_rendersToHTML"
        ON "DOCUMENTS" ("rendersToHTML");
CREATE INDEX "document_parentDir"
        ON "DOCUMENTS" ("parentDir");
CREATE INDEX "document_mtimeMs"
        ON "DOCUMENTS" ("mtimeMs");
CREATE INDEX "document_publicationTime"
        ON "DOCUMENTS" ("publicationTime");
CREATE INDEX "document_tags"
        ON "DOCUMENTS" ("tags");
CREATE INDEX "document_layout"
        ON "DOCUMENTS" ("layout");
CREATE INDEX "document_blogtag"
        ON "DOCUMENTS" ("blogtag");
CREATE INDEX "document_vpath_renderpath"
        ON "DOCUMENTS" ("vpath", "renderPath");
`;
