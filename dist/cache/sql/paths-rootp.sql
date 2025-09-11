SELECT
    vpath, mime, mounted, mountPoint,
    pathInMounted, mtimeMs,
    info, fspath, renderPath
FROM ?
WHERE
renderPath LIKE $rootP
ORDER BY mtimeMs ASC