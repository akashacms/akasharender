INSERT INTO LAYOUTS
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

    rendersToHTML,
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

    $rendersToHTML,
    $docBody,
    $rendererName
);