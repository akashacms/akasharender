'use strict';

const fs         = require('fs-extra');
const globfs     = require('globfs');
const util       = require('util');
const path       = require('path');
const async      = require('async');
const yfm        = require('yfm');

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
            return path.join(dir, fileName);
        }
    }
    return undefined;
};

exports.find = function(dirs, fileName) {
    return new Promise((resolve, reject) => {
        // for each dir .. check path.join(dir, layoutName)
        // first match resolve's
        
        log(`filez.find ${util.inspect(dirs)} ${fileName}`);
        
        var found = false;
        var foundDir;
        
        async.eachSeries(dirs,
        (dir, next) => {
            fs.stat(path.join(dir, fileName), (err, stats) => {
                if (err) return next(err);
                if (stats && stats.isFile()) {
                    found = true;
                    foundDir = dir;
                    log(`filez.find ${util.inspect(dirs)} ${fileName} found ${foundDir}`);
                }
                next();
            });
        },
        err => {
            if (err) { error(err); reject(err); }
            else if (found) resolve(foundDir);
            else { log(`filez.find FAIL ${util.inspect(dirs)} ${fileName}`); resolve(undefined); }
        });
    });
};

exports.readFile = function(dir, fpath) {
    return new Promise((resolve, reject) => {
        var readFpath = path.join(dir, fpath);
        log(`filez.readFile ${readFpath}`);
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
            log(`filez.writeFile ${renderToFile}`);
            fs.writeFile(renderToFile, text, 'utf8', err => {
                 if (err) reject(err);
                else resolve();
            });
        });
    });
};
