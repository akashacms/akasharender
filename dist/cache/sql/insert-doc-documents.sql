INSERT INTO DOCUMENTS
(
    vpath,
    mime,
    mounted,
    mountPoint,
    pathInMounted,
    fspath,
    dirname,
    mtimeMs,
    info,


    renderPath,
    rendersToHTML,
    parentDir,
    docMetadata,
    docContent,
    docBody,
    rendererName
)
VALUES
(
    $vpath,
    $mime,
    $mounted,
    $mountPoint,
    $pathInMounted,
    $fspath,
    $dirname,
    $mtimeMs,
    $info,


    $renderPath,
    $rendersToHTML,
    $parentDir,
    $docMetadata,
    $docContent,
    $docBody,
    $rendererName
);