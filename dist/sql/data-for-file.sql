SELECT * FROM "TRACES"
WHERE 
    basedir = $basedir AND fpath = $fpath
ORDER BY fullpath;