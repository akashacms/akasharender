UPDATE LAYOUTS
SET 
    mime = $mime,
    mounted = $mounted,
    mountPoint = $mountPoint,
    pathInMounted = $pathInMounted,
    fspath = $fspath,
    dirname = $dirname,
    mtimeMs = $mtimeMs,
    info = $info,

    rendersToHTML = $rendersToHTML,
    docBody = $docBody,
    rendererName = $rendererName
WHERE
    vpath = $vpath;