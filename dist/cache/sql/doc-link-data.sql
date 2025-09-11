SELECT
    vpath, renderPath,
    json_extract(info, '$.metadata.title') as title,
    json_extract(info, '$.metadata.teaser') as teaser,
FROM DOCUMENTS
WHERE 
vpath = $vpath OR renderPath = $vpath