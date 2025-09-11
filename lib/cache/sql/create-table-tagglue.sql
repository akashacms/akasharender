CREATE TABLE IF NOT EXISTS
TAGGLUE (
    docvpath STRING,
    tagName STRING
);
CREATE INDEX IF NOT EXISTS 
    tagglue_vpath on TAGGLUE (docvpath);
CREATE INDEX IF NOT EXISTS
    tagglue_name  on TAGGLUE (tagName);
CREATE UNIQUE INDEX IF NOT EXISTS
    tagglue_tuple ON TAGGLUE (docvpath, tagName);