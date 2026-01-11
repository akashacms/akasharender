/**
 *
 * Copyright 2014-2025 David Herron
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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _VFStack_instances, _VFStack_name, _VFStack_dirs, _VFStack_vpathMap, _VFStack_normalizeMount, _VFStack_scanDirectory, _VFStack_walkDirectory;
import path from 'node:path';
import { promises as fsp, statSync } from 'node:fs';
// @ts-ignore - no type definitions available
import micromatch from 'micromatch';
// @ts-ignore - no type definitions available
import { Mime } from 'mime/lite';
// @ts-ignore - no type definitions available
import standardTypes from 'mime/types/standard.js';
const mime = new Mime(standardTypes);
export function mimedefine(defs) {
    mime.define(defs);
}
/**
 * Type guard to determine whether {@code dir} is a {@code dirToMount}.
 * @param dir The object to check
 * @returns true if it is a dirToMount, false otherwise
 */
export const isDirToMount = (dir) => {
    if (typeof dir === 'undefined')
        return false;
    if (typeof dir !== 'object')
        return false;
    if ('src' in dir && typeof dir.src !== 'string')
        return false;
    if ('dest' in dir && typeof dir.dest !== 'string')
        return false;
    if ('ignore' in dir && typeof dir.ignore !== 'undefined') {
        if (!Array.isArray(dir.ignore)) {
            return false;
        }
        for (const pattern of dir.ignore) {
            if (typeof pattern !== 'string') {
                return false;
            }
        }
    }
    if ('baseMetadata' in dir && typeof dir.baseMetadata !== 'undefined') {
        if (typeof dir.baseMetadata !== 'object') {
            return false;
        }
    }
    if (!('src' in dir
        && typeof dir.src === 'string'
        && 'dest' in dir
        && typeof dir.dest === 'string')) {
        return false;
    }
    return true;
};
/**
 * Computes the union of files in a directory stack.
 */
export class VFStack {
    /**
     * Constructs an VFStack instance
     *
     * @param name
     * @param dirs
     */
    constructor(name, dirs) {
        _VFStack_instances.add(this);
        _VFStack_name.set(this, void 0);
        _VFStack_dirs.set(this, void 0);
        _VFStack_vpathMap.set(this, void 0);
        __classPrivateFieldSet(this, _VFStack_name, name, "f");
        __classPrivateFieldSet(this, _VFStack_dirs, dirs.map(d => __classPrivateFieldGet(this, _VFStack_instances, "m", _VFStack_normalizeMount).call(this, d)), "f");
        __classPrivateFieldSet(this, _VFStack_vpathMap, new Map(), "f");
    }
    /**
     * Returns the name of this instance
     */
    get name() {
        return __classPrivateFieldGet(this, _VFStack_name, "f");
    }
    /**
     * Returns the directories in this directory stack
     */
    get dirs() {
        return __classPrivateFieldGet(this, _VFStack_dirs, "f");
    }
    /**
     * Determines whether to ignore a file.  Each dirToMount
     * may have an array of file globs of files to ignore.
     * This method is used during scanning the directory stack
     * to determine which subdirectories or files to ignore.
     *
     * @param fspath
     * @returns
     */
    toIgnore(fspath) {
        for (const dir of __classPrivateFieldGet(this, _VFStack_dirs, "f")) {
            const m = dir.src.startsWith('/')
                ? dir.src.substring(1)
                : dir.src;
            const m2 = m.endsWith('/') ? m : (m + '/');
            if (!fspath.startsWith(m2)) {
                continue;
            }
            if (dir.ignore) {
                for (const pattern of dir.ignore) {
                    if (micromatch.isMatch(fspath, pattern)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * Computes the vpath for a fully specified file path,
     * so long as the file is within one of the directories
     * in the stack.
     *
     * @param fspath
     * @param statsMtime
     * @returns
     */
    vpathForFSPath(fspath, statsMtime) {
        for (const dir of __classPrivateFieldGet(this, _VFStack_dirs, "f")) {
            if (dir.ignore) {
                let ignore = false;
                for (const pattern of dir.ignore) {
                    if (micromatch.isMatch(fspath, pattern)) {
                        ignore = true;
                        break;
                    }
                }
                if (ignore)
                    continue;
            }
            const dirsrc = dir.src.endsWith('/')
                ? dir.src
                : (dir.src + '/');
            if (fspath.indexOf(dirsrc) === 0) {
                const pathInMounted = fspath.substring(dir.src.length).substring(1);
                const vpath = dir.dest === '/'
                    ? pathInMounted
                    : path.join(dir.dest, pathInMounted);
                let mtime = statsMtime;
                if (mtime === undefined) {
                    try {
                        const stats = statSync(fspath);
                        mtime = stats.mtimeMs;
                    }
                    catch (err) {
                        mtime = undefined;
                    }
                }
                return {
                    fspath,
                    vpath,
                    mime: mime.getType(fspath),
                    mounted: dir.src,
                    mountPoint: dir.dest,
                    pathInMounted,
                    statsMtime: mtime
                };
            }
        }
        return undefined;
    }
    /**
     * Scans the directory stack to compute the files
     * in this stack.
     */
    async scan() {
        __classPrivateFieldGet(this, _VFStack_vpathMap, "f").clear();
        for (const dir of __classPrivateFieldGet(this, _VFStack_dirs, "f")) {
            try {
                await __classPrivateFieldGet(this, _VFStack_instances, "m", _VFStack_scanDirectory).call(this, dir);
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    console.warn(`VFStack: Directory does not exist: ${dir.src}`);
                    continue;
                }
                throw err;
            }
        }
    }
    /**
     * Find a fie within the directory stack.
     * @param vpath
     * @returns
     */
    find(vpath) {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").get(normalizedVpath);
    }
    /**
     * Return all paths in the directory stack
     * @returns
     */
    findAll() {
        return Array.from(__classPrivateFieldGet(this, _VFStack_vpathMap, "f").values());
    }
    /**
     * Tests whether the vpath is within a directory stack.
     * @param vpath
     * @returns
     */
    has(vpath) {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").has(normalizedVpath);
    }
    /**
     * Tells us how big the stack is.
     */
    get size() {
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").size;
    }
    // Iterator protocol methods
    [(_VFStack_name = new WeakMap(), _VFStack_dirs = new WeakMap(), _VFStack_vpathMap = new WeakMap(), _VFStack_instances = new WeakSet(), _VFStack_normalizeMount = function _VFStack_normalizeMount(dir) {
        if (typeof dir === 'string') {
            return {
                src: dir,
                dest: '/'
            };
        }
        if (!isDirToMount(dir)) {
            throw new Error(`Invalid dirToMount object: ${JSON.stringify(dir)}`);
        }
        return dir;
    }, _VFStack_scanDirectory = async function _VFStack_scanDirectory(dir) {
        const files = await __classPrivateFieldGet(this, _VFStack_instances, "m", _VFStack_walkDirectory).call(this, dir.src);
        for (const fspath of files) {
            const vpathData = this.vpathForFSPath(fspath);
            if (!vpathData) {
                continue;
            }
            if (!__classPrivateFieldGet(this, _VFStack_vpathMap, "f").has(vpathData.vpath)) {
                __classPrivateFieldGet(this, _VFStack_vpathMap, "f").set(vpathData.vpath, vpathData);
            }
        }
    }, _VFStack_walkDirectory = async function _VFStack_walkDirectory(dirPath) {
        const results = [];
        try {
            const entries = await fsp.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                if (this.toIgnore(fullPath)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    const subFiles = await __classPrivateFieldGet(this, _VFStack_instances, "m", _VFStack_walkDirectory).call(this, fullPath);
                    results.push(...subFiles);
                }
                else if (entry.isFile()) {
                    results.push(fullPath);
                }
            }
        }
        catch (err) {
            throw err;
        }
        return results;
    }, Symbol.iterator)]() {
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").values();
    }
    entries() {
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").entries();
    }
    keys() {
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").keys();
    }
    values() {
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").values();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNqQyw2Q0FBNkM7QUFDN0MsT0FBTyxhQUFhLE1BQU0sd0JBQXdCLENBQUM7QUFFbkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFckMsTUFBTSxVQUFVLFVBQVUsQ0FBQyxJQUE4QjtJQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUErQkQ7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQVEsRUFBcUIsRUFBRTtJQUN4RCxJQUFJLE9BQU8sR0FBRyxLQUFLLFdBQVc7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUM3QyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUUxQyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUM5RCxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUVoRSxJQUFJLFFBQVEsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsTUFB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LENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7Z0JBQzlCLENBQUM7cUJBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztvQkFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztZQUNMLENBQUM7UUFDTCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNYLE1BQU0sR0FBRyxDQUFDO1FBQ2QsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ25CLENBQUMsRUEyQ0EsTUFBTSxDQUFDLFFBQVEsRUFBQztRQUNiLE9BQU8sdUJBQUEsSUFBSSx5QkFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ25DLENBQUM7SUFFRCxPQUFPO1FBQ0gsT0FBTyx1QkFBQSxJQUFJLHlCQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEMsQ0FBQztJQUVELElBQUk7UUFDQSxPQUFPLHVCQUFBLElBQUkseUJBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQsTUFBTTtRQUNGLE9BQU8sdUJBQUEsSUFBSSx5QkFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ25DLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwLCBzdGF0U3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuLy8gQHRzLWlnbm9yZSAtIG5vIHR5cGUgZGVmaW5pdGlvbnMgYXZhaWxhYmxlXG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbi8vIEB0cy1pZ25vcmUgLSBubyB0eXBlIGRlZmluaXRpb25zIGF2YWlsYWJsZVxuaW1wb3J0IHsgTWltZSB9IGZyb20gJ21pbWUvbGl0ZSc7XG4vLyBAdHMtaWdub3JlIC0gbm8gdHlwZSBkZWZpbml0aW9ucyBhdmFpbGFibGVcbmltcG9ydCBzdGFuZGFyZFR5cGVzIGZyb20gJ21pbWUvdHlwZXMvc3RhbmRhcmQuanMnO1xuXG5jb25zdCBtaW1lID0gbmV3IE1pbWUoc3RhbmRhcmRUeXBlcyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaW1lZGVmaW5lKGRlZnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPikge1xuICAgIG1pbWUuZGVmaW5lKGRlZnMpO1xufVxuXG4vKipcbiAqIERlc2NyaWJlcyBvbmUgZGlyZWN0b3J5IHRvIG1vdW50IGluIGEgZGlyZWN0b3J5IHN0YWNrLlxuICovXG5leHBvcnQgdHlwZSBkaXJUb01vdW50ID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBmc3BhdGggdG8gbW91bnRcbiAgICAgKi9cbiAgICBzcmM6IHN0cmluZyxcblxuICAgIC8qKlxuICAgICAqIFRoZSB2aXJ0dWFsIGZpbGVzcGFjZVxuICAgICAqIGxvY2F0aW9uXG4gICAgICovXG4gICAgZGVzdDogc3RyaW5nLFxuXG4gICAgLyoqXG4gICAgICogQXJyYXkgb2YgR0xPQiBwYXR0ZXJuc1xuICAgICAqIG9mIGZpbGVzIHRvIGlnbm9yZVxuICAgICAqL1xuICAgIGlnbm9yZT86IHN0cmluZ1tdLFxuXG4gICAgLyoqXG4gICAgICogQW4gb2JqZWN0IGNvbnRhaW5pbmdcbiAgICAgKiBtZXRhZGF0YSB0aGF0J3MgdG9cbiAgICAgKiBhcHBseSB0byBldmVyeSBmaWxlXG4gICAgICovXG4gICAgYmFzZU1ldGFkYXRhPzogYW55XG59O1xuXG4vKipcbiAqIFR5cGUgZ3VhcmQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIge0Bjb2RlIGRpcn0gaXMgYSB7QGNvZGUgZGlyVG9Nb3VudH0uXG4gKiBAcGFyYW0gZGlyIFRoZSBvYmplY3QgdG8gY2hlY2tcbiAqIEByZXR1cm5zIHRydWUgaWYgaXQgaXMgYSBkaXJUb01vdW50LCBmYWxzZSBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGlzRGlyVG9Nb3VudCA9IChkaXI6IGFueSk6IGRpciBpcyBkaXJUb01vdW50ID0+IHtcbiAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGRpciAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcblxuICAgIGlmICgnc3JjJyBpbiBkaXIgJiYgdHlwZW9mIGRpci5zcmMgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCdkZXN0JyBpbiBkaXIgJiYgdHlwZW9mIGRpci5kZXN0ICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIFxuICAgIGlmICgnaWdub3JlJyBpbiBkaXIgJiYgdHlwZW9mIGRpci5pZ25vcmUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShkaXIuaWdub3JlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBkaXIuaWdub3JlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhdHRlcm4gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCdiYXNlTWV0YWRhdGEnIGluIGRpciAmJiB0eXBlb2YgZGlyLmJhc2VNZXRhZGF0YSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIuYmFzZU1ldGFkYXRhICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCEoXG4gICAgICAgICdzcmMnIGluIGRpclxuICAgICAmJiB0eXBlb2YgZGlyLnNyYyA9PT0gJ3N0cmluZydcbiAgICAgJiYgJ2Rlc3QnIGluIGRpclxuICAgICAmJiB0eXBlb2YgZGlyLmRlc3QgPT09ICdzdHJpbmcnXG4gICAgKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIERlc2NyaWJlcyBvbmUgZmlsZSBpbiB0aGUgcGh5c2ljYWwgZmlsZXN5c3RlbSwgYW5kXG4gKiBob3cgaXQgYXBwZWFycyB3aXRoaW4gdGhlIHZpcnR1YWwgc3RhY2tlZCBmaWxlc3lzdGVtLlxuICovXG5leHBvcnQgdHlwZSBWUGF0aERhdGEgPSB7XG4gICAgLyoqXG4gICAgICogVGhlIGZ1bGwgZmlsZS1zeXN0ZW0gcGF0aCBmb3IgdGhlIGZpbGUuXG4gICAgICogZS5nLiAvaG9tZS9wYXRoL3RvL2FydGljbGUtbmFtZS5odG1sLm1kXG4gICAgICovXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmlydHVhbCBwYXRoLCByb290ZWQgYXQgdGhlIHRvcFxuICAgICAqIGRpcmVjdG9yeSBvZiB0aGUgZmlsZXN5c3RlbSwgd2l0aCBub1xuICAgICAqIGxlYWRpbmcgc2xhc2guXG4gICAgICovXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBtaW1lIHR5cGUgb2YgdGhlIGZpbGUuIFRoZSBtaW1lIHR5cGVzXG4gICAgICogYXJlIGRldGVybWluZWQgZnJvbSB0aGUgZmlsZSBleHRlbnNpb25cbiAgICAgKiB1c2luZyB0aGUgJ21pbWUnIHBhY2thZ2UuXG4gICAgICovXG4gICAgbWltZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBmaWxlLXN5c3RlbSBwYXRoIHdoaWNoIGlzIG1vdW50ZWRcbiAgICAgKiBpbnRvIHRoZSB2aXJ0dWFsIGZpbGUgc3BhY2UuXG4gICAgICovXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHZpcnR1YWwgZGlyZWN0b3J5IG9mIHRoZSBtb3VudFxuICAgICAqIGVudHJ5IGluIHRoZSBkaXJlY3Rvcnkgc3RhY2suXG4gICAgICovXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHJlbGF0aXZlIHBhdGggdW5kZXJuZWF0aCB0aGUgbW91bnRQb2ludC5cbiAgICAgKi9cbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbVRpbWUgdmFsdWUgZnJvbSBTdGF0c1xuICAgICAqL1xuICAgIHN0YXRzTXRpbWU6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFRoZSBmaWxlLXN5c3RlbSBzdGFjayByZWxhdGVkIHRvIHRoZSBmaWxlLlxuICAgICAqL1xuICAgIHN0YWNrPzogVlBhdGhEYXRhW107XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSB1bmlvbiBvZiBmaWxlcyBpbiBhIGRpcmVjdG9yeSBzdGFjay5cbiAqL1xuZXhwb3J0IGNsYXNzIFZGU3RhY2sge1xuICAgICNuYW1lOiBzdHJpbmc7XG4gICAgI2RpcnM6IGRpclRvTW91bnRbXTtcbiAgICAjdnBhdGhNYXA6IE1hcDxzdHJpbmcsIFZQYXRoRGF0YT47XG5cbiAgICAvKipcbiAgICAgKiBDb25zdHJ1Y3RzIGFuIFZGU3RhY2sgaW5zdGFuY2VcbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gbmFtZSBcbiAgICAgKiBAcGFyYW0gZGlycyBcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGRpcnM6IChzdHJpbmcgfCBkaXJUb01vdW50KVtdKSB7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycy5tYXAoZCA9PiB0aGlzLiNub3JtYWxpemVNb3VudChkKSk7XG4gICAgICAgIHRoaXMuI3ZwYXRoTWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZXMgYSBkaXJUb01vdW50IG9yIHN0cmluZyBpbnRvIGRpclRvTW91bnQuXG4gICAgICogVmFsaWRhdGVzIHRoYXQgb2JqZWN0IGZvcm0gaXMgYSB2YWxpZCBkaXJUb01vdW50LlxuICAgICAqIEBwYXJhbSBkaXIgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgI25vcm1hbGl6ZU1vdW50KGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCk6IGRpclRvTW91bnQge1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNEaXJUb01vdW50KGRpcikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBkaXJUb01vdW50IG9iamVjdDogJHtKU09OLnN0cmluZ2lmeShkaXIpfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbmFtZSBvZiB0aGlzIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI25hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZGlyZWN0b3JpZXMgaW4gdGhpcyBkaXJlY3Rvcnkgc3RhY2tcbiAgICAgKi9cbiAgICBnZXQgZGlycygpOiBkaXJUb01vdW50W10ge1xuICAgICAgICByZXR1cm4gdGhpcy4jZGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gaWdub3JlIGEgZmlsZS4gIEVhY2ggZGlyVG9Nb3VudFxuICAgICAqIG1heSBoYXZlIGFuIGFycmF5IG9mIGZpbGUgZ2xvYnMgb2YgZmlsZXMgdG8gaWdub3JlLlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZHVyaW5nIHNjYW5uaW5nIHRoZSBkaXJlY3Rvcnkgc3RhY2tcbiAgICAgKiB0byBkZXRlcm1pbmUgd2hpY2ggc3ViZGlyZWN0b3JpZXMgb3IgZmlsZXMgdG8gaWdub3JlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmc3BhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgdG9JZ25vcmUoZnNwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgY29uc3QgbSA9IGRpci5zcmMuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIuc3JjLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgIDogZGlyLnNyYztcbiAgICAgICAgICAgIGNvbnN0IG0yID0gbS5lbmRzV2l0aCgnLycpID8gbSA6IChtICsgJy8nKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFmc3BhdGguc3RhcnRzV2l0aChtMikpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgdnBhdGggZm9yIGEgZnVsbHkgc3BlY2lmaWVkIGZpbGUgcGF0aCxcbiAgICAgKiBzbyBsb25nIGFzIHRoZSBmaWxlIGlzIHdpdGhpbiBvbmUgb2YgdGhlIGRpcmVjdG9yaWVzXG4gICAgICogaW4gdGhlIHN0YWNrLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmc3BhdGggXG4gICAgICogQHBhcmFtIHN0YXRzTXRpbWUgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgdnBhdGhGb3JGU1BhdGgoZnNwYXRoOiBzdHJpbmcsIHN0YXRzTXRpbWU/OiBudW1iZXIpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICBpZiAoZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaWdub3JlKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGlyc3JjID0gZGlyLnNyYy5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIuc3JjXG4gICAgICAgICAgICAgICAgOiAoZGlyLnNyYyArICcvJyk7XG5cbiAgICAgICAgICAgIGlmIChmc3BhdGguaW5kZXhPZihkaXJzcmMpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aEluTW91bnRlZCA9IGZzcGF0aC5zdWJzdHJpbmcoZGlyLnNyYy5sZW5ndGgpLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2cGF0aCA9IGRpci5kZXN0ID09PSAnLydcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgICAgIDogcGF0aC5qb2luKGRpci5kZXN0LCBwYXRoSW5Nb3VudGVkKTtcblxuICAgICAgICAgICAgICAgIGxldCBtdGltZSA9IHN0YXRzTXRpbWU7XG4gICAgICAgICAgICAgICAgaWYgKG10aW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG10aW1lID0gc3RhdHMubXRpbWVNcztcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdGltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIuZGVzdCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogbXRpbWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2NhbnMgdGhlIGRpcmVjdG9yeSBzdGFjayB0byBjb21wdXRlIHRoZSBmaWxlc1xuICAgICAqIGluIHRoaXMgc3RhY2suXG4gICAgICovXG4gICAgYXN5bmMgc2NhbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy4jdnBhdGhNYXAuY2xlYXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuI3NjYW5EaXJlY3RvcnkoZGlyKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGlmICgoZXJyIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBWRlN0YWNrOiBEaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Q6ICR7ZGlyLnNyY31gKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jICNzY2FuRGlyZWN0b3J5KGRpcjogZGlyVG9Nb3VudCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuI3dhbGtEaXJlY3RvcnkoZGlyLnNyYyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBmc3BhdGggb2YgZmlsZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHZwYXRoRGF0YSA9IHRoaXMudnBhdGhGb3JGU1BhdGgoZnNwYXRoKTtcbiAgICAgICAgICAgIGlmICghdnBhdGhEYXRhKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy4jdnBhdGhNYXAuaGFzKHZwYXRoRGF0YS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiN2cGF0aE1hcC5zZXQodnBhdGhEYXRhLnZwYXRoLCB2cGF0aERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgI3dhbGtEaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnNwLnJlYWRkaXIoZGlyUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBlbnRyeS5uYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvSWdub3JlKGZ1bGxQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJGaWxlcyA9IGF3YWl0IHRoaXMuI3dhbGtEaXJlY3RvcnkoZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goLi4uc3ViRmlsZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhIGZpZSB3aXRoaW4gdGhlIGRpcmVjdG9yeSBzdGFjay5cbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZCh2cGF0aDogc3RyaW5nKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZwYXRoID0gdnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IHZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiB2cGF0aDtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmdldChub3JtYWxpemVkVnBhdGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBhbGwgcGF0aHMgaW4gdGhlIGRpcmVjdG9yeSBzdGFja1xuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRBbGwoKTogVlBhdGhEYXRhW10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLiN2cGF0aE1hcC52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVzdHMgd2hldGhlciB0aGUgdnBhdGggaXMgd2l0aGluIGEgZGlyZWN0b3J5IHN0YWNrLlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBoYXModnBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVnBhdGggPSB2cGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gdnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IHZwYXRoO1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuaGFzKG5vcm1hbGl6ZWRWcGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVsbHMgdXMgaG93IGJpZyB0aGUgc3RhY2sgaXMuXG4gICAgICovXG4gICAgZ2V0IHNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnNpemU7XG4gICAgfVxuXG4gICAgLy8gSXRlcmF0b3IgcHJvdG9jb2wgbWV0aG9kc1xuXG4gICAgW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmF0b3I8VlBhdGhEYXRhPiB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC52YWx1ZXMoKTtcbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgVlBhdGhEYXRhXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuZW50cmllcygpO1xuICAgIH1cblxuICAgIGtleXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmtleXMoKTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxWUGF0aERhdGE+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpO1xuICAgIH1cbn1cbiJdfQ==