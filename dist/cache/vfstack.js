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
import mime from 'mime';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBK0J4Qjs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBUSxFQUFxQixFQUFFO0lBQ3hELElBQUksT0FBTyxHQUFHLEtBQUssV0FBVztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzdDLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBRTFDLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUssUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQzlELElBQUksTUFBTSxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBRWhFLElBQUksUUFBUSxJQUFJLEdBQUcsSUFBSSxPQUFPLEdBQUcsQ0FBQyxNQUFNLEtBQUssV0FBVyxFQUFFLENBQUM7UUFDdkQsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDN0IsT0FBTyxLQUFLLENBQUM7UUFDakIsQ0FBQztRQUNELEtBQUssTUFBTSxPQUFPLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQy9CLElBQUksT0FBTyxPQUFP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Q1gsTUFBTSxHQUFHLENBQUM7UUFDZCxDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQyxFQTJDQSxNQUFNLENBQUMsUUFBUSxFQUFDO1FBQ2IsT0FBTyx1QkFBQSxJQUFJLHlCQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVELE9BQU87UUFDSCxPQUFPLHVCQUFBLElBQUkseUJBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRUQsSUFBSTtRQUNBLE9BQU8sdUJBQUEsSUFBSSx5QkFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxNQUFNO1FBQ0YsT0FBTyx1QkFBQSxJQUFJLHlCQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbkMsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AsIHN0YXRTeW5jIH0gZnJvbSAnbm9kZTpmcyc7XG4vLyBAdHMtaWdub3JlIC0gbm8gdHlwZSBkZWZpbml0aW9ucyBhdmFpbGFibGVcbmltcG9ydCBtaWNyb21hdGNoIGZyb20gJ21pY3JvbWF0Y2gnO1xuLy8gQHRzLWlnbm9yZSAtIG5vIHR5cGUgZGVmaW5pdGlvbnMgYXZhaWxhYmxlXG5pbXBvcnQgbWltZSBmcm9tICdtaW1lJztcblxuLyoqXG4gKiBEZXNjcmliZXMgb25lIGRpcmVjdG9yeSB0byBtb3VudCBpbiBhIGRpcmVjdG9yeSBzdGFjay5cbiAqL1xuZXhwb3J0IHR5cGUgZGlyVG9Nb3VudCA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgZnNwYXRoIHRvIG1vdW50XG4gICAgICovXG4gICAgc3JjOiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmlydHVhbCBmaWxlc3BhY2VcbiAgICAgKiBsb2NhdGlvblxuICAgICAqL1xuICAgIGRlc3Q6IHN0cmluZyxcblxuICAgIC8qKlxuICAgICAqIEFycmF5IG9mIEdMT0IgcGF0dGVybnNcbiAgICAgKiBvZiBmaWxlcyB0byBpZ25vcmVcbiAgICAgKi9cbiAgICBpZ25vcmU/OiBzdHJpbmdbXSxcblxuICAgIC8qKlxuICAgICAqIEFuIG9iamVjdCBjb250YWluaW5nXG4gICAgICogbWV0YWRhdGEgdGhhdCdzIHRvXG4gICAgICogYXBwbHkgdG8gZXZlcnkgZmlsZVxuICAgICAqL1xuICAgIGJhc2VNZXRhZGF0YT86IGFueVxufTtcblxuLyoqXG4gKiBUeXBlIGd1YXJkIHRvIGRldGVybWluZSB3aGV0aGVyIHtAY29kZSBkaXJ9IGlzIGEge0Bjb2RlIGRpclRvTW91bnR9LlxuICogQHBhcmFtIGRpciBUaGUgb2JqZWN0IHRvIGNoZWNrXG4gKiBAcmV0dXJucyB0cnVlIGlmIGl0IGlzIGEgZGlyVG9Nb3VudCwgZmFsc2Ugb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBjb25zdCBpc0RpclRvTW91bnQgPSAoZGlyOiBhbnkpOiBkaXIgaXMgZGlyVG9Nb3VudCA9PiB7XG4gICAgaWYgKHR5cGVvZiBkaXIgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBkaXIgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAoJ3NyYycgaW4gZGlyICYmIHR5cGVvZiBkaXIuc3JjICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmICgnZGVzdCcgaW4gZGlyICYmIHR5cGVvZiBkaXIuZGVzdCAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBcbiAgICBpZiAoJ2lnbm9yZScgaW4gZGlyICYmIHR5cGVvZiBkaXIuaWdub3JlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGlyLmlnbm9yZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgnYmFzZU1ldGFkYXRhJyBpbiBkaXIgJiYgdHlwZW9mIGRpci5iYXNlTWV0YWRhdGEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyLmJhc2VNZXRhZGF0YSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghKFxuICAgICAgICAnc3JjJyBpbiBkaXJcbiAgICAgJiYgdHlwZW9mIGRpci5zcmMgPT09ICdzdHJpbmcnXG4gICAgICYmICdkZXN0JyBpbiBkaXJcbiAgICAgJiYgdHlwZW9mIGRpci5kZXN0ID09PSAnc3RyaW5nJ1xuICAgICkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBEZXNjcmliZXMgb25lIGZpbGUgaW4gdGhlIHBoeXNpY2FsIGZpbGVzeXN0ZW0sIGFuZFxuICogaG93IGl0IGFwcGVhcnMgd2l0aGluIHRoZSB2aXJ0dWFsIHN0YWNrZWQgZmlsZXN5c3RlbS5cbiAqL1xuZXhwb3J0IHR5cGUgVlBhdGhEYXRhID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBmdWxsIGZpbGUtc3lzdGVtIHBhdGggZm9yIHRoZSBmaWxlLlxuICAgICAqIGUuZy4gL2hvbWUvcGF0aC90by9hcnRpY2xlLW5hbWUuaHRtbC5tZFxuICAgICAqL1xuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHZpcnR1YWwgcGF0aCwgcm9vdGVkIGF0IHRoZSB0b3BcbiAgICAgKiBkaXJlY3Rvcnkgb2YgdGhlIGZpbGVzeXN0ZW0sIHdpdGggbm9cbiAgICAgKiBsZWFkaW5nIHNsYXNoLlxuICAgICAqL1xuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWltZSB0eXBlIG9mIHRoZSBmaWxlLiBUaGUgbWltZSB0eXBlc1xuICAgICAqIGFyZSBkZXRlcm1pbmVkIGZyb20gdGhlIGZpbGUgZXh0ZW5zaW9uXG4gICAgICogdXNpbmcgdGhlICdtaW1lJyBwYWNrYWdlLlxuICAgICAqL1xuICAgIG1pbWU/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZmlsZS1zeXN0ZW0gcGF0aCB3aGljaCBpcyBtb3VudGVkXG4gICAgICogaW50byB0aGUgdmlydHVhbCBmaWxlIHNwYWNlLlxuICAgICAqL1xuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSB2aXJ0dWFsIGRpcmVjdG9yeSBvZiB0aGUgbW91bnRcbiAgICAgKiBlbnRyeSBpbiB0aGUgZGlyZWN0b3J5IHN0YWNrLlxuICAgICAqL1xuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSByZWxhdGl2ZSBwYXRoIHVuZGVybmVhdGggdGhlIG1vdW50UG9pbnQuXG4gICAgICovXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1UaW1lIHZhbHVlIGZyb20gU3RhdHNcbiAgICAgKi9cbiAgICBzdGF0c010aW1lOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZmlsZS1zeXN0ZW0gc3RhY2sgcmVsYXRlZCB0byB0aGUgZmlsZS5cbiAgICAgKi9cbiAgICBzdGFjaz86IFZQYXRoRGF0YVtdO1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgdW5pb24gb2YgZmlsZXMgaW4gYSBkaXJlY3Rvcnkgc3RhY2suXG4gKi9cbmV4cG9ydCBjbGFzcyBWRlN0YWNrIHtcbiAgICAjbmFtZTogc3RyaW5nO1xuICAgICNkaXJzOiBkaXJUb01vdW50W107XG4gICAgI3ZwYXRoTWFwOiBNYXA8c3RyaW5nLCBWUGF0aERhdGE+O1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhbiBWRlN0YWNrIGluc3RhbmNlXG4gICAgICogXG4gICAgICogQHBhcmFtIG5hbWUgXG4gICAgICogQHBhcmFtIGRpcnMgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBkaXJzOiAoc3RyaW5nIHwgZGlyVG9Nb3VudClbXSkge1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy4jZGlycyA9IGRpcnMubWFwKGQgPT4gdGhpcy4jbm9ybWFsaXplTW91bnQoZCkpO1xuICAgICAgICB0aGlzLiN2cGF0aE1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemVzIGEgZGlyVG9Nb3VudCBvciBzdHJpbmcgaW50byBkaXJUb01vdW50LlxuICAgICAqIFZhbGlkYXRlcyB0aGF0IG9iamVjdCBmb3JtIGlzIGEgdmFsaWQgZGlyVG9Nb3VudC5cbiAgICAgKiBAcGFyYW0gZGlyIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgICNub3JtYWxpemVNb3VudChkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpOiBkaXJUb01vdW50IHtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7SlNPTi5zdHJpbmdpZnkoZGlyKX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5hbWUgb2YgdGhpcyBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLiNuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGRpcmVjdG9yaWVzIGluIHRoaXMgZGlyZWN0b3J5IHN0YWNrXG4gICAgICovXG4gICAgZ2V0IGRpcnMoKTogZGlyVG9Nb3VudFtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RpcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRvIGlnbm9yZSBhIGZpbGUuICBFYWNoIGRpclRvTW91bnRcbiAgICAgKiBtYXkgaGF2ZSBhbiBhcnJheSBvZiBmaWxlIGdsb2JzIG9mIGZpbGVzIHRvIGlnbm9yZS5cbiAgICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGR1cmluZyBzY2FubmluZyB0aGUgZGlyZWN0b3J5IHN0YWNrXG4gICAgICogdG8gZGV0ZXJtaW5lIHdoaWNoIHN1YmRpcmVjdG9yaWVzIG9yIGZpbGVzIHRvIGlnbm9yZS5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZnNwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHRvSWdub3JlKGZzcGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuI2RpcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG0gPSBkaXIuc3JjLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgID8gZGlyLnNyYy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICA6IGRpci5zcmM7XG4gICAgICAgICAgICBjb25zdCBtMiA9IG0uZW5kc1dpdGgoJy8nKSA/IG0gOiAobSArICcvJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghZnNwYXRoLnN0YXJ0c1dpdGgobTIpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaXIuaWdub3JlKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChmc3BhdGgsIHBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIHZwYXRoIGZvciBhIGZ1bGx5IHNwZWNpZmllZCBmaWxlIHBhdGgsXG4gICAgICogc28gbG9uZyBhcyB0aGUgZmlsZSBpcyB3aXRoaW4gb25lIG9mIHRoZSBkaXJlY3Rvcmllc1xuICAgICAqIGluIHRoZSBzdGFjay5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZnNwYXRoIFxuICAgICAqIEBwYXJhbSBzdGF0c010aW1lIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHZwYXRoRm9yRlNQYXRoKGZzcGF0aDogc3RyaW5nLCBzdGF0c010aW1lPzogbnVtYmVyKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChmc3BhdGgsIHBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlnbm9yZSkgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRpcnNyYyA9IGRpci5zcmMuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgID8gZGlyLnNyY1xuICAgICAgICAgICAgICAgIDogKGRpci5zcmMgKyAnLycpO1xuXG4gICAgICAgICAgICBpZiAoZnNwYXRoLmluZGV4T2YoZGlyc3JjKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhJbk1vdW50ZWQgPSBmc3BhdGguc3Vic3RyaW5nKGRpci5zcmMubGVuZ3RoKS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdnBhdGggPSBkaXIuZGVzdCA9PT0gJy8nXG4gICAgICAgICAgICAgICAgICAgID8gcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgICAgICA6IHBhdGguam9pbihkaXIuZGVzdCwgcGF0aEluTW91bnRlZCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgbXRpbWUgPSBzdGF0c010aW1lO1xuICAgICAgICAgICAgICAgIGlmIChtdGltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0cyA9IHN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdGltZSA9IHN0YXRzLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXRpbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLnNyYyxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRQb2ludDogZGlyLmRlc3QsXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJbk1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzTXRpbWU6IG10aW1lXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNjYW5zIHRoZSBkaXJlY3Rvcnkgc3RhY2sgdG8gY29tcHV0ZSB0aGUgZmlsZXNcbiAgICAgKiBpbiB0aGlzIHN0YWNrLlxuICAgICAqL1xuICAgIGFzeW5jIHNjYW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHRoaXMuI3ZwYXRoTWFwLmNsZWFyKCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLiNzY2FuRGlyZWN0b3J5KGRpcik7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoKGVyciBhcyBOb2RlSlMuRXJybm9FeGNlcHRpb24pLmNvZGUgPT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgVkZTdGFjazogRGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0OiAke2Rpci5zcmN9YCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyAjc2NhbkRpcmVjdG9yeShkaXI6IGRpclRvTW91bnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCB0aGlzLiN3YWxrRGlyZWN0b3J5KGRpci5zcmMpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZnNwYXRoIG9mIGZpbGVzKSB7XG4gICAgICAgICAgICBjb25zdCB2cGF0aERhdGEgPSB0aGlzLnZwYXRoRm9yRlNQYXRoKGZzcGF0aCk7XG4gICAgICAgICAgICBpZiAoIXZwYXRoRGF0YSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIXRoaXMuI3ZwYXRoTWFwLmhhcyh2cGF0aERhdGEudnBhdGgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4jdnBhdGhNYXAuc2V0KHZwYXRoRGF0YS52cGF0aCwgdnBhdGhEYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jICN3YWxrRGlyZWN0b3J5KGRpclBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0czogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzcC5yZWFkZGlyKGRpclBhdGgsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyUGF0aCwgZW50cnkubmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy50b0lnbm9yZShmdWxsUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3ViRmlsZXMgPSBhd2FpdCB0aGlzLiN3YWxrRGlyZWN0b3J5KGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKC4uLnN1YkZpbGVzKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpbmQgYSBmaWUgd2l0aGluIHRoZSBkaXJlY3Rvcnkgc3RhY2suXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmQodnBhdGg6IHN0cmluZyk6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRWcGF0aCA9IHZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyB2cGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogdnBhdGg7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5nZXQobm9ybWFsaXplZFZwYXRoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYWxsIHBhdGhzIGluIHRoZSBkaXJlY3Rvcnkgc3RhY2tcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kQWxsKCk6IFZQYXRoRGF0YVtdIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy4jdnBhdGhNYXAudmFsdWVzKCkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHdoZXRoZXIgdGhlIHZwYXRoIGlzIHdpdGhpbiBhIGRpcmVjdG9yeSBzdGFjay5cbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgaGFzKHZwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZwYXRoID0gdnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IHZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiB2cGF0aDtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmhhcyhub3JtYWxpemVkVnBhdGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRlbGxzIHVzIGhvdyBiaWcgdGhlIHN0YWNrIGlzLlxuICAgICAqL1xuICAgIGdldCBzaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5zaXplO1xuICAgIH1cblxuICAgIC8vIEl0ZXJhdG9yIHByb3RvY29sIG1ldGhvZHNcblxuICAgIFtTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhdG9yPFZQYXRoRGF0YT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAudmFsdWVzKCk7XG4gICAgfVxuXG4gICAgZW50cmllcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFtzdHJpbmcsIFZQYXRoRGF0YV0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmVudHJpZXMoKTtcbiAgICB9XG5cbiAgICBrZXlzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5rZXlzKCk7XG4gICAgfVxuXG4gICAgdmFsdWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8VlBhdGhEYXRhPiB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC52YWx1ZXMoKTtcbiAgICB9XG59XG4iXX0=