'use strict';

const fs         = require('fs-extra');
const globfs     = require('globfs');
const util       = require('util');
const path       = require('path');
const async      = require('async');
const yfm        = require('yfm');
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
    for (var i = 0; i < dirs; i++) {
        var dir = dirs[i];
        stat = fs.existsSync(path.join(dir, fileName))
            ? fs.statSync(path.join(dir, fileName))
            : undefined;
        if (stat) {
            log(`filez.findSync ${util.inspect(dirs)} found ${dir}/${fileName}`);
            return path.join(dir, fileName);
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
            if (!found) 
                fs.stat(path.join(dir, fileName), (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') return next();
                        else return next(err);
                    }
                    if (stats && stats.isFile()) {
                        found = true;
                        foundDir = dir;
                        // log(`filez.find ${util.inspect(dirs)} ${fileName} found ${foundDir}`);
                    }
                    next();
                });
            else next();
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
    return new Promise((resolve, reject) => {
        // for each dir .. check path.join(dir, layoutName)
        // first match resolve's
        
        // log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo}`);
        
        
        var cached = cache.get("filez-findRendersTo", rendersTo);
        if (cached) {
            return resolve(cached);
        }
        
        var found = false;
        var foundDir;
        var foundPath;
        var foundFullPath;
        
        var renderToDir = path.dirname(rendersTo);
        
        async.eachSeries(dirs,
        (dir, next) => {
            // log(`${dir} ${rendersTo} ${found}`);
            if (!found) {
                var dirToRead = path.join(dir, renderToDir);
                // log(`dirToStat ${dirToRead}`);
                fs.stat(dirToRead, (err, stats) => {
                    if (err) {
                        if (err.code === 'ENOENT') return next();
                        else return next(err);
                    }
                    if (!stats.isDirectory()) return next();
                    // log(`dirToRead ${dirToRead}`);
                    fs.readdir(dirToRead, (err, files) => {
                        if (err) {
                            error(util.inspect(err));
                            return next(err);
                        }
                        // log(util.inspect(files));
                        for (var i = 0; i < files.length; i++) {
                            var fname = files[i];
                            // log(`${dir} ${fname} === ${path.basename(rendersTo)}`);
                            if (path.basename(rendersTo) === fname) {
                                found = true;
                                foundDir = dir;
                                foundPath = rendersTo;
                                foundFullPath = foundPath;
                                let renderer = render.findRendererPath(foundPath);
                                if (renderer) {
                                    foundPath = renderer.filePath(foundPath);
                                }
                                // log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo} found #1 ${foundDir} ${foundPath}`);
                            }
                            var fname2find = path.join(renderToDir, fname);
                            // log(`${dir} ${fname} ${fname2find}`);
                            let renderer = render.findRendererPath(fname2find);
                            if (renderer) {
                                var renderToFname = path.basename(renderer.filePath(fname2find));
                                // log(`${renderer.name} ${dir} ${fname} === ${renderToFname}`);
                                if (renderToFname === path.basename(rendersTo)) {
                                    found = true;
                                    foundDir = dir;
                                    foundPath = renderer.filePath(fname2find);
                                    foundFullPath = fname2find;
                                    // log(`filez.findRendersTo ${util.inspect(dirs)} ${rendersTo} found #2 ${foundDir} ${foundPath} ${fname2find}`);
                                }
                            }
                        }
                        next();
                    });
                });
            } else next();
        },
        err => {
            if (err) { error(err); reject(err); }
            else if (found) {
                /* log(`filez.findRendersTo FOUND ${foundDir} ${rendersTo}`); */
                var ret = { foundDir, foundPath, foundFullPath };
                cache.get("filez-findRendersTo", foundPath, ret);
                resolve(ret);
            } else {
                // log(`filez.findRendersTo FAIL ${util.inspect(dirs)} ${rendersTo}`);
                resolve(undefined);
            }
        });
    });
};

exports.readFile = function(dir, fpath) {
    return new Promise((resolve, reject) => {
        var readFpath = path.join(dir, fpath);
        // log(`filez.readFile ${readFpath}`);
        fs.readFile(readFpath, 'utf8', (err, text) => {
            if (err) reject(err);
            else resolve(text);
        });
    });
};

exports.writeFile = function(dir, fpath, text) {
    return new Promise((resolve, reject) => {
        fs.ensureDir(dir, err => {
            if (err) reject(err);
            else resolve();
        });
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            var renderToFile = path.join(dir, fpath);
            log(`filez.writeFile ${dir} ${fpath} ==> ${renderToFile}`);
            fs.writeFile(renderToFile, text, 'utf8', err => {
                 if (err) { error(`filez.writeFile ${renderToFile} ${err.stack}`); reject(err); }
                else resolve();
            });
        });
    });
};
