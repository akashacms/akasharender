
CREATE TABLE IF NOT EXISTS "LAYOUTS" (
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
  `rendersToHTML` INTEGER,
  `docBody` TEXT,
  `rendererName` TEXT,
  `info` TEXT
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
