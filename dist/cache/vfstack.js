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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBb0Z4Qjs7R0FFRztBQUNILE1BQU0sT0FBTyxPQUFPO0lBS2hCOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsSUFBNkI7O1FBVnZELGdDQUFjO1FBQ2QsZ0NBQW9CO1FBQ3BCLG9DQUFrQztRQVM5Qix1QkFBQSxJQUFJLGlCQUFTLElBQUksTUFBQSxDQUFDO1FBQ2xCLHVCQUFBLElBQUksaUJBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHVCQUFBLElBQUksbURBQWdCLE1BQXBCLElBQUksRUFBaUIsQ0FBQyxDQUFDLENBQUMsTUFBQSxDQUFDO1FBQ3BELHVCQUFBLElBQUkscUJBQWEsSUFBSSxHQUFHLEVBQUUsTUFBQSxDQUFDO0lBQy9CLENBQUM7SUFpQkQ7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDSixPQUFPLHVCQUFBLElBQUkscUJBQU0sQ0FBQztJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDSixPQUFPLHVCQUFBLElBQUkscUJBQU0sQ0FBQztJQUN0QixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxRQUFRLENBQUMsTUFBYztRQUNuQixLQUFLLE1BQU0sR0FBRyxJQUFJLHVCQUFBLElBQUkscUJBQU0sRUFBRSxDQUFDO1lBQzNCLE1B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Q0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRUQsTUFBTTtRQUNGLE9BQU8sdUJBQUEsSUFBSSx5QkFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ25DLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwLCBzdGF0U3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuLy8gQHRzLWlnbm9yZSAtIG5vIHR5cGUgZGVmaW5pdGlvbnMgYXZhaWxhYmxlXG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbi8vIEB0cy1pZ25vcmUgLSBubyB0eXBlIGRlZmluaXRpb25zIGF2YWlsYWJsZVxuaW1wb3J0IG1pbWUgZnJvbSAnbWltZSc7XG5cbi8qKlxuICogRGVzY3JpYmVzIG9uZSBkaXJlY3RvcnkgdG8gbW91bnQgaW4gYSBkaXJlY3Rvcnkgc3RhY2suXG4gKi9cbmV4cG9ydCB0eXBlIGRpclRvTW91bnQgPSB7XG4gICAgLyoqXG4gICAgICogVGhlIGZzcGF0aCB0byBtb3VudFxuICAgICAqL1xuICAgIHNyYzogc3RyaW5nLFxuXG4gICAgLyoqXG4gICAgICogVGhlIHZpcnR1YWwgZmlsZXNwYWNlXG4gICAgICogbG9jYXRpb25cbiAgICAgKi9cbiAgICBkZXN0OiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBBcnJheSBvZiBHTE9CIHBhdHRlcm5zXG4gICAgICogb2YgZmlsZXMgdG8gaWdub3JlXG4gICAgICovXG4gICAgaWdub3JlPzogc3RyaW5nW10sXG5cbiAgICAvKipcbiAgICAgKiBBbiBvYmplY3QgY29udGFpbmluZ1xuICAgICAqIG1ldGFkYXRhIHRoYXQncyB0b1xuICAgICAqIGFwcGx5IHRvIGV2ZXJ5IGZpbGVcbiAgICAgKi9cbiAgICBiYXNlTWV0YWRhdGE/OiBhbnlcbn07XG5cbi8qKlxuICogRGVzY3JpYmVzIG9uZSBmaWxlIGluIHRoZSBwaHlzaWNhbCBmaWxlc3lzdGVtLCBhbmRcbiAqIGhvdyBpdCBhcHBlYXJzIHdpdGhpbiB0aGUgdmlydHVhbCBzdGFja2VkIGZpbGVzeXN0ZW0uXG4gKi9cbmV4cG9ydCB0eXBlIFZQYXRoRGF0YSA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgZnVsbCBmaWxlLXN5c3RlbSBwYXRoIGZvciB0aGUgZmlsZS5cbiAgICAgKiBlLmcuIC9ob21lL3BhdGgvdG8vYXJ0aWNsZS1uYW1lLmh0bWwubWRcbiAgICAgKi9cbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSB2aXJ0dWFsIHBhdGgsIHJvb3RlZCBhdCB0aGUgdG9wXG4gICAgICogZGlyZWN0b3J5IG9mIHRoZSBmaWxlc3lzdGVtLCB3aXRoIG5vXG4gICAgICogbGVhZGluZyBzbGFzaC5cbiAgICAgKi9cbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gVGhlIG1pbWUgdHlwZXNcbiAgICAgKiBhcmUgZGV0ZXJtaW5lZCBmcm9tIHRoZSBmaWxlIGV4dGVuc2lvblxuICAgICAqIHVzaW5nIHRoZSAnbWltZScgcGFja2FnZS5cbiAgICAgKi9cbiAgICBtaW1lPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGZpbGUtc3lzdGVtIHBhdGggd2hpY2ggaXMgbW91bnRlZFxuICAgICAqIGludG8gdGhlIHZpcnR1YWwgZmlsZSBzcGFjZS5cbiAgICAgKi9cbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmlydHVhbCBkaXJlY3Rvcnkgb2YgdGhlIG1vdW50XG4gICAgICogZW50cnkgaW4gdGhlIGRpcmVjdG9yeSBzdGFjay5cbiAgICAgKi9cbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVsYXRpdmUgcGF0aCB1bmRlcm5lYXRoIHRoZSBtb3VudFBvaW50LlxuICAgICAqL1xuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBtVGltZSB2YWx1ZSBmcm9tIFN0YXRzXG4gICAgICovXG4gICAgc3RhdHNNdGltZTogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGZpbGUtc3lzdGVtIHN0YWNrIHJlbGF0ZWQgdG8gdGhlIGZpbGUuXG4gICAgICovXG4gICAgc3RhY2s/OiBWUGF0aERhdGFbXTtcbn07XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIHVuaW9uIG9mIGZpbGVzIGluIGEgZGlyZWN0b3J5IHN0YWNrLlxuICovXG5leHBvcnQgY2xhc3MgVkZTdGFjayB7XG4gICAgI25hbWU6IHN0cmluZztcbiAgICAjZGlyczogZGlyVG9Nb3VudFtdO1xuICAgICN2cGF0aE1hcDogTWFwPHN0cmluZywgVlBhdGhEYXRhPjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYW4gVkZTdGFjayBpbnN0YW5jZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSBuYW1lIFxuICAgICAqIEBwYXJhbSBkaXJzIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZGlyczogKHN0cmluZyB8IGRpclRvTW91bnQpW10pIHtcbiAgICAgICAgdGhpcy4jbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuI2RpcnMgPSBkaXJzLm1hcChkID0+IHRoaXMuI25vcm1hbGl6ZU1vdW50KGQpKTtcbiAgICAgICAgdGhpcy4jdnBhdGhNYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXplcyBhIGRpclRvTW91bnQgb3Igc3RyaW5nIGludG8gZGlyVG9Nb3VudFxuICAgICAqIEBwYXJhbSBkaXIgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgI25vcm1hbGl6ZU1vdW50KGRpcjogc3RyaW5nIHwgZGlyVG9Nb3VudCk6IGRpclRvTW91bnQge1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgbmFtZSBvZiB0aGlzIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI25hbWU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgZGlyZWN0b3JpZXMgaW4gdGhpcyBkaXJlY3Rvcnkgc3RhY2tcbiAgICAgKi9cbiAgICBnZXQgZGlycygpOiBkaXJUb01vdW50W10ge1xuICAgICAgICByZXR1cm4gdGhpcy4jZGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gaWdub3JlIGEgZmlsZS4gIEVhY2ggZGlyVG9Nb3VudFxuICAgICAqIG1heSBoYXZlIGFuIGFycmF5IG9mIGZpbGUgZ2xvYnMgb2YgZmlsZXMgdG8gaWdub3JlLlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZHVyaW5nIHNjYW5uaW5nIHRoZSBkaXJlY3Rvcnkgc3RhY2tcbiAgICAgKiB0byBkZXRlcm1pbmUgd2hpY2ggc3ViZGlyZWN0b3JpZXMgb3IgZmlsZXMgdG8gaWdub3JlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmc3BhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgdG9JZ25vcmUoZnNwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgY29uc3QgbSA9IGRpci5zcmMuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIuc3JjLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgIDogZGlyLnNyYztcbiAgICAgICAgICAgIGNvbnN0IG0yID0gbS5lbmRzV2l0aCgnLycpID8gbSA6IChtICsgJy8nKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFmc3BhdGguc3RhcnRzV2l0aChtMikpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgdnBhdGggZm9yIGEgZnVsbHkgc3BlY2lmaWVkIGZpbGUgcGF0aCxcbiAgICAgKiBzbyBsb25nIGFzIHRoZSBmaWxlIGlzIHdpdGhpbiBvbmUgb2YgdGhlIGRpcmVjdG9yaWVzXG4gICAgICogaW4gdGhlIHN0YWNrLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmc3BhdGggXG4gICAgICogQHBhcmFtIHN0YXRzTXRpbWUgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgdnBhdGhGb3JGU1BhdGgoZnNwYXRoOiBzdHJpbmcsIHN0YXRzTXRpbWU/OiBudW1iZXIpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICBpZiAoZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaWdub3JlKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGlyc3JjID0gZGlyLnNyYy5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIuc3JjXG4gICAgICAgICAgICAgICAgOiAoZGlyLnNyYyArICcvJyk7XG5cbiAgICAgICAgICAgIGlmIChmc3BhdGguaW5kZXhPZihkaXJzcmMpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aEluTW91bnRlZCA9IGZzcGF0aC5zdWJzdHJpbmcoZGlyLnNyYy5sZW5ndGgpLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2cGF0aCA9IGRpci5kZXN0ID09PSAnLydcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgICAgIDogcGF0aC5qb2luKGRpci5kZXN0LCBwYXRoSW5Nb3VudGVkKTtcblxuICAgICAgICAgICAgICAgIGxldCBtdGltZSA9IHN0YXRzTXRpbWU7XG4gICAgICAgICAgICAgICAgaWYgKG10aW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG10aW1lID0gc3RhdHMubXRpbWVNcztcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdGltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIuZGVzdCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogbXRpbWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2NhbnMgdGhlIGRpcmVjdG9yeSBzdGFjayB0byBjb21wdXRlIHRoZSBmaWxlc1xuICAgICAqIGluIHRoaXMgc3RhY2suXG4gICAgICovXG4gICAgYXN5bmMgc2NhbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy4jdnBhdGhNYXAuY2xlYXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuI3NjYW5EaXJlY3RvcnkoZGlyKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGlmICgoZXJyIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBWRlN0YWNrOiBEaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Q6ICR7ZGlyLnNyY31gKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jICNzY2FuRGlyZWN0b3J5KGRpcjogZGlyVG9Nb3VudCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuI3dhbGtEaXJlY3RvcnkoZGlyLnNyYyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBmc3BhdGggb2YgZmlsZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHZwYXRoRGF0YSA9IHRoaXMudnBhdGhGb3JGU1BhdGgoZnNwYXRoKTtcbiAgICAgICAgICAgIGlmICghdnBhdGhEYXRhKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy4jdnBhdGhNYXAuaGFzKHZwYXRoRGF0YS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiN2cGF0aE1hcC5zZXQodnBhdGhEYXRhLnZwYXRoLCB2cGF0aERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgI3dhbGtEaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnNwLnJlYWRkaXIoZGlyUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBlbnRyeS5uYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvSWdub3JlKGZ1bGxQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJGaWxlcyA9IGF3YWl0IHRoaXMuI3dhbGtEaXJlY3RvcnkoZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goLi4uc3ViRmlsZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmluZCBhIGZpZSB3aXRoaW4gdGhlIGRpcmVjdG9yeSBzdGFjay5cbiAgICAgKiBAcGFyYW0gdnBhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZCh2cGF0aDogc3RyaW5nKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZwYXRoID0gdnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IHZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiB2cGF0aDtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmdldChub3JtYWxpemVkVnBhdGgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBhbGwgcGF0aHMgaW4gdGhlIGRpcmVjdG9yeSBzdGFja1xuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGZpbmRBbGwoKTogVlBhdGhEYXRhW10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLiN2cGF0aE1hcC52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVzdHMgd2hldGhlciB0aGUgdnBhdGggaXMgd2l0aGluIGEgZGlyZWN0b3J5IHN0YWNrLlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBoYXModnBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVnBhdGggPSB2cGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gdnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IHZwYXRoO1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuaGFzKG5vcm1hbGl6ZWRWcGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGVsbHMgdXMgaG93IGJpZyB0aGUgc3RhY2sgaXMuXG4gICAgICovXG4gICAgZ2V0IHNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnNpemU7XG4gICAgfVxuXG4gICAgLy8gSXRlcmF0b3IgcHJvdG9jb2wgbWV0aG9kc1xuXG4gICAgW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmF0b3I8VlBhdGhEYXRhPiB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC52YWx1ZXMoKTtcbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IEl0ZXJhYmxlSXRlcmF0b3I8W3N0cmluZywgVlBhdGhEYXRhXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuZW50cmllcygpO1xuICAgIH1cblxuICAgIGtleXMoKTogSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmtleXMoKTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogSXRlcmFibGVJdGVyYXRvcjxWUGF0aERhdGE+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpO1xuICAgIH1cbn1cbiJdfQ==