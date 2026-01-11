SELECT
    vpath, mime, mounted, mountPoint,
    pathInMounted, mtimeMs,
    info, fspath, renderPath
FROM ?
ORDER BY mtimeMs ASC
