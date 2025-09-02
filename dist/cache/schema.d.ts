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
export declare const createAssetsTable = "\nCREATE TABLE IF NOT EXISTS \"ASSETS\" (\n  `vpath` TEXT PRIMARY KEY,\n  `renderPath` TEXT  GENERATED ALWAYS\n        AS (vpath) STORED,\n  `mime` TEXT,\n  `mounted` TEXT,\n  `mountPoint` TEXT,\n  `pathInMounted` TEXT,\n  `fspath` TEXT,\n  `dirname` TEXT,\n  `mtimeMs` REAL,\n  `info` TEXT\n) WITHOUT ROWID;\nCREATE INDEX \"asset_vpath\"\n        ON \"ASSETS\" (\"vpath\");\nCREATE INDEX \"asset_mounted\"\n        ON \"ASSETS\" (\"mounted\");\nCREATE INDEX \"asset_mountPoint\"\n        ON \"ASSETS\" (\"mountPoint\");\nCREATE INDEX \"asset_pathInMounted\"\n        ON \"ASSETS\" (\"pathInMounted\");\nCREATE INDEX \"asset_fspath\"\n        ON \"ASSETS\" (\"fspath\");\nCREATE INDEX \"asset_dirname\"\n        ON \"ASSETS\" (\"dirname\");\nCREATE INDEX \"asset_mtimeMs\"\n        ON \"ASSETS\" (\"mtimeMs\");\n";
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
export declare const createPartialsTable = "\nCREATE TABLE IF NOT EXISTS \"PARTIALS\" (\n  `vpath` TEXT PRIMARY KEY,\n  `renderPath` TEXT  GENERATED ALWAYS\n        AS (vpath) STORED,\n  `mime` TEXT,\n  `mounted` TEXT,\n  `mountPoint` TEXT,\n  `pathInMounted` TEXT,\n  `fspath` TEXT,\n  `dirname` TEXT,\n  `mtimeMs` REAL,\n  `docBody` TEXT,\n  `rendererName` TEXT,\n  `info` TEXT\n) WITHOUT ROWID;\nCREATE INDEX \"partial_vpath\"\n        ON \"PARTIALS\" (\"vpath\");\nCREATE INDEX \"partial_mounted\"\n        ON \"PARTIALS\" (\"mounted\");\nCREATE INDEX \"partial_mountPoint\"\n        ON \"PARTIALS\" (\"mountPoint\");\nCREATE INDEX \"partial_pathInMounted\"\n        ON \"PARTIALS\" (\"pathInMounted\");\nCREATE INDEX \"partial_fspath\"\n        ON \"PARTIALS\" (\"fspath\");\nCREATE INDEX \"partial_dirname\"\n        ON \"PARTIALS\" (\"dirname\");\nCREATE INDEX \"partial_mtimeMs\"\n        ON \"PARTIALS\" (\"mtimeMs\");\n";
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
export declare const createLayoutsTable = "\nCREATE TABLE IF NOT EXISTS \"LAYOUTS\" (\n  `vpath` TEXT PRIMARY KEY,\n  `renderPath` TEXT  GENERATED ALWAYS\n        AS (vpath) STORED,\n  `mime` TEXT,\n  `mounted` TEXT,\n  `mountPoint` TEXT,\n  `pathInMounted` TEXT,\n  `fspath` TEXT,\n  `dirname` TEXT,\n  `mtimeMs` REAL,\n  `rendersToHTML` INTEGER,\n  `docBody` TEXT,\n  `rendererName` TEXT,\n  `info` TEXT\n) WITHOUT ROWID;\nCREATE INDEX \"layout_vpath\"\n        ON \"LAYOUTS\" (\"vpath\");\nCREATE INDEX \"layout_mounted\"\n        ON \"LAYOUTS\" (\"mounted\");\nCREATE INDEX \"layout_mountPoint\"\n        ON \"LAYOUTS\" (\"mountPoint\");\nCREATE INDEX \"layout_pathInMounted\"\n        ON \"LAYOUTS\" (\"pathInMounted\");\nCREATE INDEX \"layout_fspath\"\n        ON \"LAYOUTS\" (\"fspath\");\nCREATE INDEX \"layout_dirname\"\n        ON \"LAYOUTS\" (\"dirname\");\nCREATE INDEX \"layout_mtimeMs\"\n        ON \"LAYOUTS\" (\"mtimeMs\");\n";
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
export declare const createDocumentsTable = "\nCREATE TABLE IF NOT EXISTS \"DOCUMENTS\" (\n  `vpath` TEXT PRIMARY KEY,\n  `mime` TEXT,\n  `mounted` TEXT,\n  `mountPoint` TEXT,\n  `pathInMounted` TEXT,\n  `fspath` TEXT,\n  `dirname` TEXT,\n  `mtimeMs` REAL,\n  `renderPath` TEXT,\n  `rendersToHTML` INTEGER,\n  `parentDir` TEXT,\n  `publicationTime` INTEGER GENERATED ALWAYS\n        AS (json_extract(info, '$.publicationTime')) STORED,\n  `baseMetadata` TEXT GENERATED ALWAYS\n        AS (json_extract(info, '$.baseMetadata')) STORED,\n  `docMetadata` TEXT,\n  `docContent` TEXT,\n  `docBody` TEXT,\n  `metadata` TEXT GENERATED ALWAYS\n        AS (json_extract(info, '$.metadata')) STORED,\n  `tags` TEXT GENERATED ALWAYS\n        AS (json_extract(info, '$.metadata.tags')) STORED,\n  `layout` TEXT GENERATED ALWAYS\n        AS (json_extract(metadata, '$.layout')) STORED,\n  `blogtag` TEXT GENERATED ALWAYS\n        AS (json_extract(metadata, '$.blogtag')) STORED,\n  `rendererName` TEXT,\n  `info` TEXT\n) WITHOUT ROWID;\nCREATE INDEX \"document_vpath\"\n        ON \"DOCUMENTS\" (\"vpath\");\nCREATE INDEX \"document_mounted\"\n        ON \"DOCUMENTS\" (\"mounted\");\nCREATE INDEX \"document_mountPoint\"\n        ON \"DOCUMENTS\" (\"mountPoint\");\nCREATE INDEX \"document_pathInMounted\"\n        ON \"DOCUMENTS\" (\"pathInMounted\");\nCREATE INDEX \"document_fspath\"\n        ON \"DOCUMENTS\" (\"fspath\");\nCREATE INDEX \"document_dirname\"\n        ON \"DOCUMENTS\" (\"dirname\");\nCREATE INDEX \"document_renderPath\"\n        ON \"DOCUMENTS\" (\"renderPath\");\nCREATE INDEX \"document_rendersToHTML\"\n        ON \"DOCUMENTS\" (\"rendersToHTML\");\nCREATE INDEX \"document_parentDir\"\n        ON \"DOCUMENTS\" (\"parentDir\");\nCREATE INDEX \"document_mtimeMs\"\n        ON \"DOCUMENTS\" (\"mtimeMs\");\nCREATE INDEX \"document_publicationTime\"\n        ON \"DOCUMENTS\" (\"publicationTime\");\nCREATE INDEX \"document_tags\"\n        ON \"DOCUMENTS\" (\"tags\");\nCREATE INDEX \"document_layout\"\n        ON \"DOCUMENTS\" (\"layout\");\nCREATE INDEX \"document_blogtag\"\n        ON \"DOCUMENTS\" (\"blogtag\");\n";
//# sourceMappingURL=schema.d.ts.map