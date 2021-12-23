/**
 *
 * Copyright 2014-2019 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

 'use strict';

const fs         = require('fs-extra');
const util       = require('util');
const path       = require('path');

/* exports.createNewFile = async function(dir, fpath, text) {
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
}; */

exports.writeFile = async function(dir, fpath, text) {
    try {
        var renderToFile = path.join(dir, fpath);
        await fs.ensureDir(path.dirname(renderToFile));
        // console.log(`filez.writeFile ${dir} ${fpath} ==> ${renderToFile}`);
        await fs.writeFile(renderToFile, text, 'utf8');
    } catch (e) {
        throw new Error(`writeFile FAIL because ${e.stack}`);
    }
};
