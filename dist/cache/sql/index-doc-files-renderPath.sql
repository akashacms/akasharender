SELECT *
FROM DOCUMENTS
WHERE
    ( rendersToHTML = true )
AND (
    ( renderPath LIKE '%/index.html' )
    OR ( renderPath = 'index.html' )
)
AND ( renderPath LIKE $rootP )