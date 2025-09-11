SELECT * FROM DOCUMENTS
WHERE
dirname = $dirname AND
vpath <> $vpath AND
renderPath <> $vpath AND
rendersToHtml = true