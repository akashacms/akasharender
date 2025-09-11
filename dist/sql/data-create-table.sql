CREATE TABLE IF NOT EXISTS "TRACES" (
    `basedir`  TEXT,
    `fpath`    TEXT,
    `fullpath` TEXT,
    `renderTo` TEXT,
    `stage`    TEXT,
    `start`    TEXT
            DEFAULT(datetime('now') || 'Z'),
    `now`      TEXT
            DEFAULT(datetime('now') || 'Z')
);
CREATE INDEX "traces_basedir"
        ON "TRACES" ("basedir");
CREATE INDEX "traces_fpath"
        ON "TRACES" ("fpath");
CREATE INDEX "traces_fullpath"
        ON "TRACES" ("fullpath");
