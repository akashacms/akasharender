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
                const pathInMounted = fspath.substring(dirsrc.length);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNqQyw2Q0FBNkM7QUFDN0MsT0FBTyxhQUFhLE1BQU0sd0JBQXdCLENBQUM7QUFFbkQsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFckMsTUFBTSxVQUFVLFVBQVUsQ0FBQyxJQUE4QjtJQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUErQkQ7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQVEsRUFBcUIsRUFBRTtJQUN4RCxJQUFJLE9BQU8sR0FBRyxLQUFLLFdBQVc7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUM3QyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUUxQyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUM5RCxJQUFJLE1BQU0sSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVE7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUVoRSxJQUFJLFFBQVEsSUFBSSxHQUFHLElBQUksT0FBTyxHQUFHLENBQUMsTUFB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O2dCQUM5QixDQUFDO3FCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7b0JBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQzNCLENBQUM7WUFDTCxDQUFDO1FBQ0wsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDWCxNQUFNLEdBQUcsQ0FBQztRQUNkLENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDLEVBMkNBLE1BQU0sQ0FBQyxRQUFRLEVBQUM7UUFDYixPQUFPLHVCQUFBLElBQUkseUJBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQsT0FBTztRQUNILE9BQU8sdUJBQUEsSUFBSSx5QkFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFFRCxJQUFJO1FBQ0EsT0FBTyx1QkFBQSxJQUFJLHlCQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVELE1BQU07UUFDRixPQUFPLHVCQUFBLElBQUkseUJBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCwgc3RhdFN5bmMgfSBmcm9tICdub2RlOmZzJztcbi8vIEB0cy1pZ25vcmUgLSBubyB0eXBlIGRlZmluaXRpb25zIGF2YWlsYWJsZVxuaW1wb3J0IG1pY3JvbWF0Y2ggZnJvbSAnbWljcm9tYXRjaCc7XG4vLyBAdHMtaWdub3JlIC0gbm8gdHlwZSBkZWZpbml0aW9ucyBhdmFpbGFibGVcbmltcG9ydCB7IE1pbWUgfSBmcm9tICdtaW1lL2xpdGUnO1xuLy8gQHRzLWlnbm9yZSAtIG5vIHR5cGUgZGVmaW5pdGlvbnMgYXZhaWxhYmxlXG5pbXBvcnQgc3RhbmRhcmRUeXBlcyBmcm9tICdtaW1lL3R5cGVzL3N0YW5kYXJkLmpzJztcblxuY29uc3QgbWltZSA9IG5ldyBNaW1lKHN0YW5kYXJkVHlwZXMpO1xuXG5leHBvcnQgZnVuY3Rpb24gbWltZWRlZmluZShkZWZzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT4pIHtcbiAgICBtaW1lLmRlZmluZShkZWZzKTtcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgb25lIGRpcmVjdG9yeSB0byBtb3VudCBpbiBhIGRpcmVjdG9yeSBzdGFjay5cbiAqL1xuZXhwb3J0IHR5cGUgZGlyVG9Nb3VudCA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgZnNwYXRoIHRvIG1vdW50XG4gICAgICovXG4gICAgc3JjOiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmlydHVhbCBmaWxlc3BhY2VcbiAgICAgKiBsb2NhdGlvblxuICAgICAqL1xuICAgIGRlc3Q6IHN0cmluZyxcblxuICAgIC8qKlxuICAgICAqIEFycmF5IG9mIEdMT0IgcGF0dGVybnNcbiAgICAgKiBvZiBmaWxlcyB0byBpZ25vcmVcbiAgICAgKi9cbiAgICBpZ25vcmU/OiBzdHJpbmdbXSxcblxuICAgIC8qKlxuICAgICAqIEFuIG9iamVjdCBjb250YWluaW5nXG4gICAgICogbWV0YWRhdGEgdGhhdCdzIHRvXG4gICAgICogYXBwbHkgdG8gZXZlcnkgZmlsZVxuICAgICAqL1xuICAgIGJhc2VNZXRhZGF0YT86IGFueVxufTtcblxuLyoqXG4gKiBUeXBlIGd1YXJkIHRvIGRldGVybWluZSB3aGV0aGVyIHtAY29kZSBkaXJ9IGlzIGEge0Bjb2RlIGRpclRvTW91bnR9LlxuICogQHBhcmFtIGRpciBUaGUgb2JqZWN0IHRvIGNoZWNrXG4gKiBAcmV0dXJucyB0cnVlIGlmIGl0IGlzIGEgZGlyVG9Nb3VudCwgZmFsc2Ugb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBjb25zdCBpc0RpclRvTW91bnQgPSAoZGlyOiBhbnkpOiBkaXIgaXMgZGlyVG9Nb3VudCA9PiB7XG4gICAgaWYgKHR5cGVvZiBkaXIgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBkaXIgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAoJ3NyYycgaW4gZGlyICYmIHR5cGVvZiBkaXIuc3JjICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmICgnZGVzdCcgaW4gZGlyICYmIHR5cGVvZiBkaXIuZGVzdCAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBcbiAgICBpZiAoJ2lnbm9yZScgaW4gZGlyICYmIHR5cGVvZiBkaXIuaWdub3JlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZGlyLmlnbm9yZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXR0ZXJuICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICgnYmFzZU1ldGFkYXRhJyBpbiBkaXIgJiYgdHlwZW9mIGRpci5iYXNlTWV0YWRhdGEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGlyLmJhc2VNZXRhZGF0YSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICghKFxuICAgICAgICAnc3JjJyBpbiBkaXJcbiAgICAgJiYgdHlwZW9mIGRpci5zcmMgPT09ICdzdHJpbmcnXG4gICAgICYmICdkZXN0JyBpbiBkaXJcbiAgICAgJiYgdHlwZW9mIGRpci5kZXN0ID09PSAnc3RyaW5nJ1xuICAgICkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBEZXNjcmliZXMgb25lIGZpbGUgaW4gdGhlIHBoeXNpY2FsIGZpbGVzeXN0ZW0sIGFuZFxuICogaG93IGl0IGFwcGVhcnMgd2l0aGluIHRoZSB2aXJ0dWFsIHN0YWNrZWQgZmlsZXN5c3RlbS5cbiAqL1xuZXhwb3J0IHR5cGUgVlBhdGhEYXRhID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBmdWxsIGZpbGUtc3lzdGVtIHBhdGggZm9yIHRoZSBmaWxlLlxuICAgICAqIGUuZy4gL2hvbWUvcGF0aC90by9hcnRpY2xlLW5hbWUuaHRtbC5tZFxuICAgICAqL1xuICAgIGZzcGF0aDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHZpcnR1YWwgcGF0aCwgcm9vdGVkIGF0IHRoZSB0b3BcbiAgICAgKiBkaXJlY3Rvcnkgb2YgdGhlIGZpbGVzeXN0ZW0sIHdpdGggbm9cbiAgICAgKiBsZWFkaW5nIHNsYXNoLlxuICAgICAqL1xuICAgIHZwYXRoOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbWltZSB0eXBlIG9mIHRoZSBmaWxlLiBUaGUgbWltZSB0eXBlc1xuICAgICAqIGFyZSBkZXRlcm1pbmVkIGZyb20gdGhlIGZpbGUgZXh0ZW5zaW9uXG4gICAgICogdXNpbmcgdGhlICdtaW1lJyBwYWNrYWdlLlxuICAgICAqL1xuICAgIG1pbWU/OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZmlsZS1zeXN0ZW0gcGF0aCB3aGljaCBpcyBtb3VudGVkXG4gICAgICogaW50byB0aGUgdmlydHVhbCBmaWxlIHNwYWNlLlxuICAgICAqL1xuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSB2aXJ0dWFsIGRpcmVjdG9yeSBvZiB0aGUgbW91bnRcbiAgICAgKiBlbnRyeSBpbiB0aGUgZGlyZWN0b3J5IHN0YWNrLlxuICAgICAqL1xuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSByZWxhdGl2ZSBwYXRoIHVuZGVybmVhdGggdGhlIG1vdW50UG9pbnQuXG4gICAgICovXG4gICAgcGF0aEluTW91bnRlZDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1UaW1lIHZhbHVlIGZyb20gU3RhdHNcbiAgICAgKi9cbiAgICBzdGF0c010aW1lOiBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZmlsZS1zeXN0ZW0gc3RhY2sgcmVsYXRlZCB0byB0aGUgZmlsZS5cbiAgICAgKi9cbiAgICBzdGFjaz86IFZQYXRoRGF0YVtdO1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgdW5pb24gb2YgZmlsZXMgaW4gYSBkaXJlY3Rvcnkgc3RhY2suXG4gKi9cbmV4cG9ydCBjbGFzcyBWRlN0YWNrIHtcbiAgICAjbmFtZTogc3RyaW5nO1xuICAgICNkaXJzOiBkaXJUb01vdW50W107XG4gICAgI3ZwYXRoTWFwOiBNYXA8c3RyaW5nLCBWUGF0aERhdGE+O1xuXG4gICAgLyoqXG4gICAgICogQ29uc3RydWN0cyBhbiBWRlN0YWNrIGluc3RhbmNlXG4gICAgICogXG4gICAgICogQHBhcmFtIG5hbWUgXG4gICAgICogQHBhcmFtIGRpcnMgXG4gICAgICovXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBkaXJzOiAoc3RyaW5nIHwgZGlyVG9Nb3VudClbXSkge1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy4jZGlycyA9IGRpcnMubWFwKGQgPT4gdGhpcy4jbm9ybWFsaXplTW91bnQoZCkpO1xuICAgICAgICB0aGlzLiN2cGF0aE1hcCA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBOb3JtYWxpemVzIGEgZGlyVG9Nb3VudCBvciBzdHJpbmcgaW50byBkaXJUb01vdW50LlxuICAgICAqIFZhbGlkYXRlcyB0aGF0IG9iamVjdCBmb3JtIGlzIGEgdmFsaWQgZGlyVG9Nb3VudC5cbiAgICAgKiBAcGFyYW0gZGlyIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgICNub3JtYWxpemVNb3VudChkaXI6IHN0cmluZyB8IGRpclRvTW91bnQpOiBkaXJUb01vdW50IHtcbiAgICAgICAgaWYgKHR5cGVvZiBkaXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNyYzogZGlyLFxuICAgICAgICAgICAgICAgIGRlc3Q6ICcvJ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRGlyVG9Nb3VudChkaXIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZGlyVG9Nb3VudCBvYmplY3Q6ICR7SlNPTi5zdHJpbmdpZnkoZGlyKX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGlyO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5hbWUgb2YgdGhpcyBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLiNuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGRpcmVjdG9yaWVzIGluIHRoaXMgZGlyZWN0b3J5IHN0YWNrXG4gICAgICovXG4gICAgZ2V0IGRpcnMoKTogZGlyVG9Nb3VudFtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RpcnM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRvIGlnbm9yZSBhIGZpbGUuICBFYWNoIGRpclRvTW91bnRcbiAgICAgKiBtYXkgaGF2ZSBhbiBhcnJheSBvZiBmaWxlIGdsb2JzIG9mIGZpbGVzIHRvIGlnbm9yZS5cbiAgICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGR1cmluZyBzY2FubmluZyB0aGUgZGlyZWN0b3J5IHN0YWNrXG4gICAgICogdG8gZGV0ZXJtaW5lIHdoaWNoIHN1YmRpcmVjdG9yaWVzIG9yIGZpbGVzIHRvIGlnbm9yZS5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZnNwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHRvSWdub3JlKGZzcGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuI2RpcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG0gPSBkaXIuc3JjLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgID8gZGlyLnNyYy5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICA6IGRpci5zcmM7XG4gICAgICAgICAgICBjb25zdCBtMiA9IG0uZW5kc1dpdGgoJy8nKSA/IG0gOiAobSArICcvJyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICghZnNwYXRoLnN0YXJ0c1dpdGgobTIpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkaXIuaWdub3JlKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChmc3BhdGgsIHBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgdGhlIHZwYXRoIGZvciBhIGZ1bGx5IHNwZWNpZmllZCBmaWxlIHBhdGgsXG4gICAgICogc28gbG9uZyBhcyB0aGUgZmlsZSBpcyB3aXRoaW4gb25lIG9mIHRoZSBkaXJlY3Rvcmllc1xuICAgICAqIGluIHRoZSBzdGFjay5cbiAgICAgKiBcbiAgICAgKiBAcGFyYW0gZnNwYXRoIFxuICAgICAqIEBwYXJhbSBzdGF0c010aW1lIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIHZwYXRoRm9yRlNQYXRoKGZzcGF0aDogc3RyaW5nLCBzdGF0c010aW1lPzogbnVtYmVyKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChmc3BhdGgsIHBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlnbm9yZSkgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRpcnNyYyA9IGRpci5zcmMuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgID8gZGlyLnNyY1xuICAgICAgICAgICAgICAgIDogKGRpci5zcmMgKyAnLycpO1xuXG4gICAgICAgICAgICBpZiAoZnNwYXRoLmluZGV4T2YoZGlyc3JjKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhJbk1vdW50ZWQgPSBmc3BhdGguc3Vic3RyaW5nKGRpcnNyYy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZwYXRoID0gZGlyLmRlc3QgPT09ICcvJ1xuICAgICAgICAgICAgICAgICAgICA/IHBhdGhJbk1vdW50ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBwYXRoLmpvaW4oZGlyLmRlc3QsIHBhdGhJbk1vdW50ZWQpO1xuXG4gICAgICAgICAgICAgICAgbGV0IG10aW1lID0gc3RhdHNNdGltZTtcbiAgICAgICAgICAgICAgICBpZiAobXRpbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXRpbWUgPSBzdGF0cy5tdGltZU1zO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG10aW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogbWltZS5nZXRUeXBlKGZzcGF0aCksXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5zcmMsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5kZXN0LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBtdGltZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTY2FucyB0aGUgZGlyZWN0b3J5IHN0YWNrIHRvIGNvbXB1dGUgdGhlIGZpbGVzXG4gICAgICogaW4gdGhpcyBzdGFjay5cbiAgICAgKi9cbiAgICBhc3luYyBzY2FuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLiN2cGF0aE1hcC5jbGVhcigpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuI2RpcnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy4jc2NhbkRpcmVjdG9yeShkaXIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKChlcnIgYXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uKS5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFZGU3RhY2s6IERpcmVjdG9yeSBkb2VzIG5vdCBleGlzdDogJHtkaXIuc3JjfWApO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgI3NjYW5EaXJlY3RvcnkoZGlyOiBkaXJUb01vdW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy4jd2Fsa0RpcmVjdG9yeShkaXIuc3JjKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGZzcGF0aCBvZiBmaWxlcykge1xuICAgICAgICAgICAgY29uc3QgdnBhdGhEYXRhID0gdGhpcy52cGF0aEZvckZTUGF0aChmc3BhdGgpO1xuICAgICAgICAgICAgaWYgKCF2cGF0aERhdGEpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0aGlzLiN2cGF0aE1hcC5oYXModnBhdGhEYXRhLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuI3ZwYXRoTWFwLnNldCh2cGF0aERhdGEudnBhdGgsIHZwYXRoRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyAjd2Fsa0RpcmVjdG9yeShkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmc3AucmVhZGRpcihkaXJQYXRoLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpclBhdGgsIGVudHJ5Lm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudG9JZ25vcmUoZnVsbFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YkZpbGVzID0gYXdhaXQgdGhpcy4jd2Fsa0RpcmVjdG9yeShmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCguLi5zdWJGaWxlcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgZmllIHdpdGhpbiB0aGUgZGlyZWN0b3J5IHN0YWNrLlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kKHZwYXRoOiBzdHJpbmcpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVnBhdGggPSB2cGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gdnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IHZwYXRoO1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuZ2V0KG5vcm1hbGl6ZWRWcGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFsbCBwYXRocyBpbiB0aGUgZGlyZWN0b3J5IHN0YWNrXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZEFsbCgpOiBWUGF0aERhdGFbXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB3aGV0aGVyIHRoZSB2cGF0aCBpcyB3aXRoaW4gYSBkaXJlY3Rvcnkgc3RhY2suXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGhhcyh2cGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRWcGF0aCA9IHZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyB2cGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogdnBhdGg7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5oYXMobm9ybWFsaXplZFZwYXRoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUZWxscyB1cyBob3cgYmlnIHRoZSBzdGFjayBpcy5cbiAgICAgKi9cbiAgICBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuc2l6ZTtcbiAgICB9XG5cbiAgICAvLyBJdGVyYXRvciBwcm90b2NvbCBtZXRob2RzXG5cbiAgICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYXRvcjxWUGF0aERhdGE+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpO1xuICAgIH1cblxuICAgIGVudHJpZXMoKTogSXRlcmFibGVJdGVyYXRvcjxbc3RyaW5nLCBWUGF0aERhdGFdPiB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5lbnRyaWVzKCk7XG4gICAgfVxuXG4gICAga2V5cygpOiBJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAua2V5cygpO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFZQYXRoRGF0YT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAudmFsdWVzKCk7XG4gICAgfVxufVxuIl19