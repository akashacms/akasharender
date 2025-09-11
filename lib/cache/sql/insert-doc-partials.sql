INSERT INTO PARTIALS
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

    $docBody,
    $rendererName
);