CREATE TABLE IF NOT EXISTS "ASSETS" (
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
  `info` TEXT
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