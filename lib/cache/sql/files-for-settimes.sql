SELECT
    vpath, fspath,
    mtimeMs, publicationTime,
    json_extract(info, '$.docMetadata.publDate') as publDate,
    json_extract(info, '$.docMetadata.publicationDate') as publicationDate,
FROM DOCUMENTS;