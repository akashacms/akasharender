'use strict';

const fs         = require('fs-extra');
const globfs     = require('globfs');
const util       = require('util');
const path       = require('path');
const render     = require('./render');
const cache      = require('./caching');

const log   = require('debug')('akasha:filez');
const error = require('debug')('akasha:error-filez');

exports.copyAssets = function(assetdirs, renderTo) {
    return globfs.copyAsync(assetdirs, '**/*', renderTo);
};

exports.findAsset = async function(assetdirs, filename) {
    var cached = cache.get("filez-findAsset", filename);
    if (cached) {
        return Promise.resolve(cached);
    }
    var results = [];
    for (let assetdir of assetdirs) {
        let theAssetdir;
        if (typeof assetdir === 'object') {
            theAssetdir = assetdir.src;
        } else if (typeof assetdir === 'string') {
            theAssetdir = assetdir;
        } else {
            throw new Error(`findAsset unknown assetdir ${util.inspect(assetdir)}`);
        }
        var fn2find = path.join(theAssetdir, filename);
        try {
            if (await !fs.exists(fn2find)) continue;
            var stats = await fs.stat(fn2find);
            if (!stats) continue;
        } catch (e) {
            // if (e.code !== 'ENOENT') continue;
            // throw e;
            // We don't want to FAIL if we get ENOENT, we simply
            // want to skip this directory.  We expect to get ENOENT
            // for many/most of these stat calls.
            // It's unclear what to do with other error codes.
            // Maybe just skip all those as well is the best?
            continue;
        }
        results.push({
            basedir: theAssetdir,
            path: filename,
            fullpath: fn2find
        });
    }
    // console.log(`findAsset found ${util.inspect(results)} for ${util.inspect(assetdirs)} ${filename}`);
    cache.set("filez-findAsset", filename, results);
    return results;
};

exports.findSync = function(dirs, fileName) {
    throw new Error('findSync deprecated - use globfs.findSync');
    // for (var i = 0; i < dirs.length; i++) {
    //     var dir = dirs[i];
    //     var fileToFind = path.join(dir, fileName);
    //     // log(fileToFind);
    //     var stat = fs.existsSync(fileToFind) ? fs.statSync(fileToFind) : undefined;
    //     if (stat) {
    //         log(`filez.findSync ${util.inspect(dirs)} found ${dir}/${fileName}`);
    //         return fileToFind;
    //     }
    // }
    // log(`filez.findSync FAIL ${util.inspect(dirs)} ${fileName}`);
    // return undefined;
};

exports.find = async function(dirs, fileName) {
    throw new Error('find deprecated - use globfs.findAsync');
    // if (!dirs) throw new Error("Must supply directories to search");
    // if (!fileName) throw new Error("Must supply a fileName");
    //     // log(`filez.find ${util.inspect(dirs)} ${fileName}`);

    // var found = false;
    // var foundDir;

    // for (var dir of dirs) {
    //     var stats = undefined;
    //     try {
    //         stats = await fs.stat(path.join(dir, fileName));
    //     } catch (e) {
    //         if (e.code !== 'ENOENT') throw e;
    //         stats = undefined;
    //     }

    //     if (stats && stats.isFile()) {
    //         found = true;
    //         foundDir = dir;
    //         // log(`filez.find ${util.inspect(dirs)} ${fileName} found ${foundDir}`);
    //         break;
    //     }
    // }
    // if (found) return foundDir;
    // else {
    //     log(`filez.find FAIL ${util.inspect(dirs)} ${fileName}`);
    //     return undefined;
    // }
};

exports.findRendersToForce = function(dirs, rendersTo) {
    cache.del("filez-findRendersTo", rendersTo);
    return exports.findRendersTo(dirs, rendersTo);
};

exports.findRendersTo = async function(dirs, rendersTo) {

    var cached = cache.get("filez-findRendersTo", rendersTo);
    if (cached) {
        return cached;
    }

    // console.log(`findRendersTo ${util.inspect(dirs)} ${rendersTo}`);

    var found = false;
    var foundDir;
    var foundPath;
    var foundFullPath;
    var foundMountedOn;
    var foundPathWithinDir;
    var foundBaseMetadata;
    var foundStats;
    var foundIsDirectory = false;

    var rendersToNoSlash = rendersTo.startsWith("/") ? rendersTo.substring(1) : rendersTo;
    var renderToDir = path.dirname(rendersTo);

    for (let dir of dirs) {

        // console.log(`filez.findRendersTo ${dir} ${rendersTo} ${found}`);
        if (!found) {
            // For cases of complex directory descriptions
            let pathMountedOn = "/";
            let renderBaseDir = "";
            let dirToRead;
            let rendersToWithinDir = rendersTo;
            if (typeof dir === 'string') {
                // If the dir is a simple pathname
                // In Configure, it is forced to be an absolute pathname
                renderBaseDir = dir;
                if (rendersTo.startsWith('/')) {
                    // If this is a full pathname rooted within the given dir ...
                    if (rendersTo.substring(0, dir.length) === dir
                     && rendersTo.substring(dir.length).startsWith('/')) {
                        rendersToNoSlash = rendersTo.substring(dir.length+1);
                        renderToDir = path.dirname(rendersToNoSlash);
                        rendersToWithinDir = rendersToNoSlash;
                    } else {
                        // Otherwise this is to be taken as a pathname rooted within docroot
                        rendersToNoSlash = rendersTo.startsWith("/") ? rendersTo.substring(1) : rendersTo;
                        renderToDir = path.dirname(rendersTo);
                        rendersToWithinDir = rendersTo;
                    }
                } else {
                    // Otherwise it is a relative pathname within docroot
                    rendersToNoSlash = rendersTo;
                    renderToDir = path.dirname(rendersTo);
                    rendersToWithinDir = rendersTo;
                }
                dirToRead = path.join(renderBaseDir, renderToDir);
            } else {
                // Otherwise this is a directory mounted on a subtree in the site.
                // The dir object will include these fields:
                //     src: absolute pathname for the root
                //          In Configure, dir.src is forced to be an absolute pathname
                //     dest: slug within docroot to prepend to every pathname
                renderBaseDir = dir.src;
                // console.log(`filez.findRendersTo  Checking ${util.inspect(dir)} for ${rendersToNoSlash}`);
                if (rendersTo.startsWith('/')) {
                    if (rendersTo.substring(0, dir.src.length) === dir.src
                     && rendersTo.substring(dir.src.length).startsWith('/')) {
                        // If this is an absolute pathname matching the source directory
                        rendersToWithinDir = rendersTo.substring(dir.src.length+1);
                        rendersToNoSlash = path.join(dir.dest, rendersToWithinDir);
                        renderToDir = path.dirname(rendersToNoSlash);
                        dirToRead = path.join(dir.src, path.dirname(rendersToWithinDir));
                    } else {
                        // Otherwise it is a relative pathname within the docroot 
                        // that might happen to be for this subdirectory
                        if (rendersTo.substring(1, dir.dest.length) === dir.dest
                         && rendersTo.substring(1).substring(dir.dest.length).startsWith('/')) {
                            rendersToWithinDir = rendersTo.substring(1).substring(dir.dest.length+1);
                            rendersToNoSlash = path.join(dir.dest, rendersToWithinDir);
                            renderToDir = path.dirname(rendersToNoSlash);
                            dirToRead = path.join(dir.src, path.dirname(rendersToWithinDir));
                        } else {
                            // Such a condition won't match the file name .. hence .. skip
                            // console.log(`SKIPPING src ${dir.src} dest ${dir.dest} because ${rendersTo} will not match`);
                            continue;
                        }
                    }
                } else {
                    if (rendersTo.substring(0, dir.dest.length) === dir.dest
                    && rendersTo.substring(dir.dest.length).startsWith('/')) {
                        // These two are true if the path prefix of rendersTo is dir.dest
                        rendersToWithinDir = rendersToNoSlash.substring(dir.dest.length).substring(1);
                        rendersToNoSlash = path.join(dir.dest, rendersToWithinDir);
                        renderToDir = path.dirname(rendersToNoSlash);
                        dirToRead = path.join(dir.src, path.dirname(rendersToWithinDir));
                        // console.log(`dirToRead ${dirToRead} rendersToWithinDir ${rendersToWithinDir}`);
                    } else {
                        // Such a condition won't match the file name .. hence .. skip
                        // console.log(`SKIPPING src ${dir.src} dest ${dir.dest} because ${rendersTo} will not match`);
                        continue;
                    }
                }
                pathMountedOn = dir.dest;
            }


            // Check that dirToRead exists
            let stats;
            try {

                // var dirToRead = renderBaseDir; // path.join(renderBaseDir, renderToDir);
                // console.log(`dirToStat ${dirToRead} mounted on ${pathMountedOn} looking for ${rendersTo}`);
                stats = await fs.stat(dirToRead);
            } catch (err) {
                if (err.code === 'ENOENT') { 
                    /* console.log(`fs.stat ${dirToRead} says ENOENT`); */ 
                    continue;
                } else { 
                    console.error(`fs.stat ${dirToRead} errored ${err.stack}`); 
                    throw err;
                }
            }
            if (!stats.isDirectory()) continue;

            // Get the list of files in dirToRead
            let files;
            try {
                files = await fs.readdir(dirToRead);
            } catch (err2) {
                console.error(util.inspect(err));
                throw err;
            }

            // Look through the files to see if there is a match
            // console.log(util.inspect(files));
            for (var i = 0; i < files.length; i++) {
                var fname = files[i];
                // console.log(`${dirToRead} ${pathMountedOn} ${fname} === ${path.basename(rendersTo)}`);
                // If the file name directly matches what we're looking for - count this as a match
                if (path.basename(rendersTo) === fname) {
                    found = true;
                    foundDir = typeof dir === 'string' ? dir : dir.src;
                    foundPath = rendersTo;
                    foundFullPath = foundPath;
                    foundMountedOn = pathMountedOn;
                    foundPathWithinDir = rendersToWithinDir;
                    foundBaseMetadata = typeof dir === 'string' ? {} : dir.baseMetadata;
                    let renderer = render.findRendererPath(foundPath);
                    if (renderer) {
                        foundPath = renderer.filePath(foundPath);
                    }
                    // console.log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo} found #1 ${foundDir} ${foundPath} ${foundMountedOn} ${foundPathWithinDir}`);
                }
                var fname2find = path.join(renderToDir, fname);
                // console.log(`${renderToDir} ${fname} ${fname2find}`);
                let renderer = render.findRendererPath(fname2find);
                if (renderer) {
                    var renderToFname = path.basename(renderer.filePath(fname2find));
                    // console.log(`${renderer.name} ${util.inspect(dir)} ${fname} === ${renderToFname}`);
                    if (renderToFname === path.basename(rendersTo)) {
                        found = true;
                        foundDir = typeof dir === 'string' ? dir : dir.src;
                        foundPath = renderer.filePath(fname2find);
                        foundFullPath = fname2find;
                        foundMountedOn = pathMountedOn;
                        foundPathWithinDir = path.join(path.dirname(rendersToWithinDir), fname);
                        foundBaseMetadata = typeof dir === 'string' ? {} : dir.baseMetadata;
                        // console.log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo} found #2 ${foundDir} ${foundPath} ${fname2find} ${foundMountedOn} ${foundPathWithinDir} rendersToWithinDir ${rendersToWithinDir}`);
                    }
                }

                // Record some further data if it was found
                if (found) {
                    let fullpath = path.join(foundDir, foundPathWithinDir);
                    try {
                        foundStats = await fs.stat(fullpath);
                    } catch (err) {
                        console.log(`filez.findRendersTo could not fs.stat ${fullpath} foundDir ${foundDir} foundPath ${foundPath} foundFullPath ${foundFullPath} foundMountedOn ${foundMountedOn} foundPathWithinDir ${foundPathWithinDir} because ${err.stack}`);
                        foundStats = undefined;
                    }
                    if (foundStats && foundStats.isDirectory()) {
                        foundIsDirectory = true;
                    }
                }
            }
        }
    }

    if (found) {
        // console.log(`filez.findRendersTo FOUND ${foundDir} ${rendersTo}`);
        var ret = {
            foundDir, foundPath, foundFullPath,
            foundMountedOn, foundPathWithinDir,
            foundBaseMetadata: (foundBaseMetadata ? foundBaseMetadata : {} ),
            foundStats,
            foundIsDirectory
        };
        // console.log(`filez.findRendersTo FOUND ${util.inspect(ret)}`);
        cache.set("filez-findRendersTo", foundPath, ret);
        return ret;
    } else {
        // console.log(`filez.findRendersTo FAIL ${util.inspect(dirs)} ${rendersTo}`);
        return undefined;
    }
};

exports.createNewFile = async function(dir, fpath, text) {
    try {
        // await fs.ensureDir(dir);
        var renderToFile = path.join(dir, fpath);
        await fs.ensureDir(path.dirname(renderToFile));
        var fd = await fs.open(renderToFile, 'wx');
        await fs.write(fd, text, 0, 'utf8');
        await fs.close(fd);
    } catch (e) {
        throw new Error(`createNewFile FAIL because ${e.stack}`)
    }
};

exports.readFile = function(dir, fpath) {
    return Promise.reject(new Error("readFile deprecated - use fs.readFileAsync instead"));
    var readFpath = path.join(dir, fpath);
    return fs.readFile(readFpath, 'utf8');
};

exports.writeFile = async function(dir, fpath, text) {
    try {
        var renderToFile = path.join(dir, fpath);
        await fs.ensureDir(path.dirname(renderToFile));
        log(`filez.writeFile ${dir} ${fpath} ==> ${renderToFile}`);
        await fs.writeFile(renderToFile, text, 'utf8');
    } catch (e) {
        throw new Error(`writeFile FAIL because ${e.stack}`);
    }
};
