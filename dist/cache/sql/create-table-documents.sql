CREATE TABLE IF NOT EXISTS "DOCUMENTS" (
  `vpath` TEXT PRIMARY KEY,
  `mime` TEXT,
  `mounted` TEXT,
  `mountPoint` TEXT,
  `pathInMounted` TEXT,
  `fspath` TEXT,
  `dirname` TEXT,
  `mtimeMs` REAL,
  `renderPath` TEXT,
  `rendersToHTML` INTEGER,
  `parentDir` TEXT,
  `publicationTime` INTEGER GENERATED ALWAYS
        AS (json_extract(info, '$.publicationTime')) STORED,
  `baseMetadata` TEXT GENERATED ALWAYS
        AS (json_extract(info, '$.baseMetadata')) STORED,
  `docMetadata` TEXT,
  `docContent` TEXT,
  `docBody` TEXT,
  `metadata` TEXT GENERATED ALWAYS
        AS (json_extract(info, '$.metadata')) STORED,
  `tags` TEXT GENERATED ALWAYS
        AS (json_extract(info, '$.metadata.tags')) STORED,
  `layout` TEXT GENERATED ALWAYS
        AS (json_extract(metadata, '$.layout')) STORED,
  `blogtag` TEXT GENERATED ALWAYS
        AS (json_extract(metadata, '$.blogtag')) STORED,
  `rendererName` TEXT,
  `info` TEXT
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