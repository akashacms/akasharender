
CREATE TABLE IF NOT EXISTS "PARTIALS" (
  `vpath` TEXT PRIMARY KEY,
  `renderPath` TEXT  GENERATED ALWAYS
        AS (vpath) STORED,
  `mime` TEXT,
  `mounted` TEXT,
  `mountPoint` TEXT,
  `pathInMounted` TEXT,
  `fspath` TEXT,
  `dirname` TEXT,
  `mtimeMs` REAL,
  `docBody` TEXT,
  `rendererName` TEXT,
  `info` TEXT
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
