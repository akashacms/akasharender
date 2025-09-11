UPDATE DOCUMENTS
SET 
    mime = $mime,
    mounted = $mounted,
    mountPoint = $mountPoint,
    pathInMounted = $pathInMounted,
    fspath = $fspath,
    dirname = $dirname,
    mtimeMs = $mtimeMs,
    info = $info,

    renderPath = $renderPath,
    rendersToHTML = $rendersToHTML,
    parentDir = $parentDir,
    docMetadata = $docMetadata,
    docContent = $docContent,
    docBody = $docBody,
    rendererName = $rendererName
WHERE
    vpath = $vpath;