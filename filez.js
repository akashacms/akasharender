'use strict';

const fs         = require('fs-extra-promise');
const globfs     = require('globfs');
const util       = require('util');
const path       = require('path');
const async      = require('async');
const render     = require('./render');
const cache      = require('./caching');

const log   = require('debug')('akasha:filez');
const error = require('debug')('akasha:error-filez');

exports.copyAssets = function(assetdirs, renderTo) {
    return new Promise((resolve, reject) => {
        globfs.copy(assetdirs, '**/*', renderTo, err => {
            if (err) reject(err);
            else resolve();
        });
    });
};

exports.findSync = function(dirs, fileName) {
    for (var i = 0; i < dirs.length; i++) {
        var dir = dirs[i];
        var fileToFind = path.join(dir, fileName);
        // log(fileToFind);
        var stat = fs.existsSync(fileToFind) ? fs.statSync(fileToFind) : undefined;
        if (stat) {
            log(`filez.findSync ${util.inspect(dirs)} found ${dir}/${fileName}`);
            return fileToFind;
        }
    }
    log(`filez.findSync FAIL ${util.inspect(dirs)} ${fileName}`);
    return undefined;
};

exports.find = function(dirs, fileName) {
    if (!dirs) throw new Error("Must supply directories to search");
    if (!fileName) throw new Error("Must supply a fileName");
    return new Promise((resolve, reject) => {
        // for each dir .. check path.join(dir, layoutName)
        // first match resolve's

        if (!dirs) return reject(new Error("Must supply directories to search"));
        if (!fileName) return reject(new Error("Must supply a fileName"));

        // log(`filez.find ${util.inspect(dirs)} ${fileName}`);

        var found = false;
        var foundDir;

        async.eachSeries(dirs,
        (dir, next) => {
            if (!found) {
                fs.statAsync(path.join(dir, fileName))
                .then(stats => {
                    if (stats && stats.isFile()) {
                        found = true;
                        foundDir = dir;
                        // log(`filez.find ${util.inspect(dirs)} ${fileName} found ${foundDir}`);
                    }
                    next();
                })
                .catch(err => {
                    if (err.code === 'ENOENT') next();
                    else next(err);
                });
            } else next();
        },
        err => {
            if (err) { error(err); reject(err); }
            else if (found) resolve(foundDir);
            else {
                log(`filez.find FAIL ${util.inspect(dirs)} ${fileName}`);
                resolve(undefined);
            }
        });
    });
};

exports.findRendersTo = function(dirs, rendersTo) {

    var cached = cache.get("filez-findRendersTo", rendersTo);
    if (cached) {
        return Promise.resolve(cached);
    }

    // console.log(`findRendersTo ${util.inspect(dirs)} ${rendersTo}`);

    return new Promise((resolve, reject) => {
        // for each dir .. check path.join(dir, layoutName)
        // first match resolve's

        // log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo}`);



        var found = false;
        var foundDir;
        var foundPath;
        var foundFullPath;
        var foundMountedOn;
        var foundPathWithinDir;
        var foundBaseMetadata;

        var rendersToNoSlash = rendersTo.startsWith("/") ? rendersTo.substring(1) : rendersTo;
        var renderToDir = path.dirname(rendersTo);

        async.eachSeries(dirs,
        (dir, next) => {
            // log(`${dir} ${rendersTo} ${found}`);
            if (!found) {
                // For cases of complex directory descriptions
                let pathMountedOn = "/";
                let renderBaseDir = "";
                var dirToRead;
                var rendersToWithinDir = rendersTo;
                if (typeof dir === 'string') {
                    renderBaseDir = dir;
                    dirToRead = path.join(renderBaseDir, renderToDir);;
                } else {
                    renderBaseDir = dir.src;
                    // console.log(`Checking ${util.inspect(dir)} for ${rendersToNoSlash}`);
                    if (rendersToNoSlash.substring(0, dir.dest.length) === dir.dest
                     && rendersToNoSlash.substring(dir.dest.length).startsWith('/')) {
                        // These two are true if the path prefix of rendersTo is dir.dest
                        rendersToWithinDir = rendersToNoSlash.substring(dir.dest.length).substring(1);
                        dirToRead = path.join(dir.src, path.dirname(rendersToWithinDir));
                        // console.log(`dirToRead ${dirToRead} rendersToWithinDir ${rendersToWithinDir}`);
                    } else {
                        // Such a condition won't match the file name .. hence .. skip
                        / console.log(`SKIPPING src ${dir.src} dest ${dir.dest} because ${rendersTo} will not match`);
                        return next();
                    }
                    pathMountedOn = dir.dest;
                }
                // var dirToRead = renderBaseDir; // path.join(renderBaseDir, renderToDir);
                // console.log(`dirToStat ${dirToRead} mounted on ${pathMountedOn} looking for ${rendersTo}`);
                fs.stat(dirToRead, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') { console.log(`fs.stat ${dirToRead} says ENOENT`); return next(); }
                        else { console.error(`fs.stat ${dirToRead} errored ${err.stack}`); return next(err); }
                    }
                    if (!stats.isDirectory()) return next();
                    // console.log(`dirToRead ${dirToRead}`);
                    fs.readdir(dirToRead, (err, files) => {
                        if (err) {
                            error(util.inspect(err));
                            return next(err);
                        }
                        // console.log(util.inspect(files));
                        for (var i = 0; i < files.length; i++) {
                            var fname = files[i];
                            // console.log(`${dirToRead} ${pathMountedOn} ${fname} === ${path.basename(rendersTo)}`);
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
                                    console.log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo} found #2 ${foundDir} ${foundPath} ${fname2find} ${foundMountedOn} ${foundPathWithinDir} rendersToWithinDir ${rendersToWithinDir}`);
                                }
                            }
                        }
                        next();
                    });
                });
            } else next();
        },
        err => {
            if (err) { console.error(err); reject(err); }
            else if (found) {
                // console.log(`filez.findRendersTo FOUND ${foundDir} ${rendersTo}`);
                var ret = {
                    foundDir, foundPath, foundFullPath, foundFullPath,
                    foundMountedOn, foundPathWithinDir,
                    foundBaseMetadata: (foundBaseMetadata ? foundBaseMetadata : {} )
                };
                cache.set("filez-findRendersTo", foundPath, ret);
                resolve(ret);
            } else {
                console.log(`filez.findRendersTo FAIL ${util.inspect(dirs)} ${rendersTo}`);
                resolve(undefined);
            }
        });
    });
};

exports.readFile = function(dir, fpath) {
    var readFpath = path.join(dir, fpath);
    return fs.readFileAsync(readFpath, 'utf8');
};

exports.writeFile = function(dir, fpath, text) {
    return fs.ensureDirAsync(dir)
    .then(() => {
        var renderToFile = path.join(dir, fpath);
        log(`filez.writeFile ${dir} ${fpath} ==> ${renderToFile}`);
        return fs.writeFileAsync(renderToFile, text, 'utf8')
        .catch(err => {
            error(`filez.writeFile ${renderToFile} ${err.stack}`);
            throw err;
        });
    });
};
