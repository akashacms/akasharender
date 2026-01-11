UPDATE PARTIALS
SET 
    mime = $mime,
    mounted = $mounted,
    mountPoint = $mountPoint,
    pathInMounted = $pathInMounted,
    fspath = $fspath,
    dirname = $dirname,
    mtimeMs = $mtimeMs,
    info = $info,

    docBody = $docBody,
    rendererName = $rendererName
WHERE
    vpath = $vpath;