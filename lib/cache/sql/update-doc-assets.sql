UPDATE ASSETS
SET 
    mime = $mime,
    mounted = $mounted,
    mountPoint = $mountPoint,
    pathInMounted = $pathInMounted,
    fspath = $fspath,
    dirname = $dirname,
    mtimeMs = $mtimeMs,
    info = $info
WHERE
    vpath = $vpath