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
        return {
            src: dir.src,
            dest: dir.dest,
            ignore: dir.ignore,
            baseMetadata: dir.baseMetadata
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBbUd4Qjs7R0FFRztBQUNILE1BQU0sT0FBTyxPQUFPO0lBS2hCOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUFZLEVBQUUsSUFBa0I7O1FBVjVDLGdDQUFjO1FBQ2QsZ0NBQXlCO1FBQ3pCLG9DQUFrQztRQVM5Qix1QkFBQSxJQUFJLGlCQUFTLElBQUksTUFBQSxDQUFDO1FBQ2xCLHVCQUFBLElBQUksaUJBQVMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLHVCQUFBLElBQUksbURBQWdCLE1BQXBCLElBQUksRUFBaUIsQ0FBQyxDQUFDLENBQUMsTUFBQSxDQUFDO1FBQ3BELHVCQUFBLElBQUkscUJBQWEsSUFBSSxHQUFHLEVBQUUsTUFBQSxDQUFDO0lBQy9CLENBQUM7SUFzQkQ7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDSixPQUFPLHVCQUFBLElBQUkscUJBQU0sQ0FBQztJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDSixPQUFPLHVCQUFBLElBQUkscUJBQU0sQ0FBQztJQUN0QixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxRQUFRLENBQUMsTUFBYztRQUNuQixLQUFLLE1BQU0sR0FBRyxJQUFJLHVCQUFBLElBQUkscUJBQU0sRUFBRSxDQUFDO1lBQzNCLE1B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LENBQUM7SUFDbkMsQ0FBQztJQUVELE9BQU87UUFDSCxPQUFPLHVCQUFBLElBQUkseUJBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNwQyxDQUFDO0lBRUQsSUFBSTtRQUNBLE9BQU8sdUJBQUEsSUFBSSx5QkFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxNQUFNO1FBQ0YsT0FBTyx1QkFBQSxJQUFJLHlCQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbkMsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBwcm9taXNlcyBhcyBmc3AsIHN0YXRTeW5jIH0gZnJvbSAnbm9kZTpmcyc7XG4vLyBAdHMtaWdub3JlIC0gbm8gdHlwZSBkZWZpbml0aW9ucyBhdmFpbGFibGVcbmltcG9ydCBtaWNyb21hdGNoIGZyb20gJ21pY3JvbWF0Y2gnO1xuLy8gQHRzLWlnbm9yZSAtIG5vIHR5cGUgZGVmaW5pdGlvbnMgYXZhaWxhYmxlXG5pbXBvcnQgbWltZSBmcm9tICdtaW1lJztcblxuLyoqXG4gKiBEZXNjcmliZXMgb25lIGRpcmVjdG9yeSB0byBtb3VudCBpbiBhIGRpcmVjdG9yeSBzdGFjay5cbiAqIENhbiBiZSBhIHNpbXBsZSBzdHJpbmcgcGF0aCAobW91bnRlZCBhdCAnLycpIG9yIGFuIG9iamVjdFxuICogd2l0aCBkZXRhaWxlZCBjb25maWd1cmF0aW9uLlxuICovXG5leHBvcnQgdHlwZSBkaXJUb01vdW50ID1cbiAgICBzdHJpbmdcbiAgICB8IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBmc3BhdGggdG8gbW91bnRcbiAgICAgICAgICovXG4gICAgICAgIHNyYzogc3RyaW5nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdmlydHVhbCBmaWxlc3BhY2VcbiAgICAgICAgICogbG9jYXRpb25cbiAgICAgICAgICovXG4gICAgICAgIGRlc3Q6IHN0cmluZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQXJyYXkgb2YgR0xPQiBwYXR0ZXJuc1xuICAgICAgICAgKiBvZiBmaWxlcyB0byBpZ25vcmVcbiAgICAgICAgICovXG4gICAgICAgIGlnbm9yZT86IHN0cmluZ1tdLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbiBvYmplY3QgY29udGFpbmluZ1xuICAgICAgICAgKiBtZXRhZGF0YSB0aGF0J3MgdG9cbiAgICAgICAgICogYXBwbHkgdG8gZXZlcnkgZmlsZVxuICAgICAgICAgKi9cbiAgICAgICAgYmFzZU1ldGFkYXRhPzogYW55XG4gICAgfTtcblxuLyoqXG4gKiBJbnRlcm5hbCBub3JtYWxpemVkIHJlcHJlc2VudGF0aW9uIG9mIGEgZGlyZWN0b3J5IG1vdW50LlxuICogQGludGVybmFsXG4gKi9cbnR5cGUgTm9ybWFsaXplZE1vdW50ID0ge1xuICAgIHNyYzogc3RyaW5nO1xuICAgIGRlc3Q6IHN0cmluZztcbiAgICBpZ25vcmU/OiBzdHJpbmdbXTtcbiAgICBiYXNlTWV0YWRhdGE/OiBhbnk7XG59O1xuXG4vKipcbiAqIERlc2NyaWJlcyBvbmUgZmlsZSBpbiB0aGUgcGh5c2ljYWwgZmlsZXN5c3RlbSwgYW5kXG4gKiBob3cgaXQgYXBwZWFycyB3aXRoaW4gdGhlIHZpcnR1YWwgc3RhY2tlZCBmaWxlc3lzdGVtLlxuICovXG5leHBvcnQgdHlwZSBWUGF0aERhdGEgPSB7XG4gICAgLyoqXG4gICAgICogVGhlIGZ1bGwgZmlsZS1zeXN0ZW0gcGF0aCBmb3IgdGhlIGZpbGUuXG4gICAgICogZS5nLiAvaG9tZS9wYXRoL3RvL2FydGljbGUtbmFtZS5odG1sLm1kXG4gICAgICovXG4gICAgZnNwYXRoOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmlydHVhbCBwYXRoLCByb290ZWQgYXQgdGhlIHRvcFxuICAgICAqIGRpcmVjdG9yeSBvZiB0aGUgZmlsZXN5c3RlbSwgd2l0aCBub1xuICAgICAqIGxlYWRpbmcgc2xhc2guXG4gICAgICovXG4gICAgdnBhdGg6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBtaW1lIHR5cGUgb2YgdGhlIGZpbGUuIFRoZSBtaW1lIHR5cGVzXG4gICAgICogYXJlIGRldGVybWluZWQgZnJvbSB0aGUgZmlsZSBleHRlbnNpb25cbiAgICAgKiB1c2luZyB0aGUgJ21pbWUnIHBhY2thZ2UuXG4gICAgICovXG4gICAgbWltZT86IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBmaWxlLXN5c3RlbSBwYXRoIHdoaWNoIGlzIG1vdW50ZWRcbiAgICAgKiBpbnRvIHRoZSB2aXJ0dWFsIGZpbGUgc3BhY2UuXG4gICAgICovXG4gICAgbW91bnRlZDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHZpcnR1YWwgZGlyZWN0b3J5IG9mIHRoZSBtb3VudFxuICAgICAqIGVudHJ5IGluIHRoZSBkaXJlY3Rvcnkgc3RhY2suXG4gICAgICovXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHJlbGF0aXZlIHBhdGggdW5kZXJuZWF0aCB0aGUgbW91bnRQb2ludC5cbiAgICAgKi9cbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbVRpbWUgdmFsdWUgZnJvbSBTdGF0c1xuICAgICAqL1xuICAgIHN0YXRzTXRpbWU6IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFRoZSBmaWxlLXN5c3RlbSBzdGFjayByZWxhdGVkIHRvIHRoZSBmaWxlLlxuICAgICAqL1xuICAgIHN0YWNrPzogVlBhdGhEYXRhW107XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSB1bmlvbiBvZiBmaWxlcyBpbiBhIGRpcmVjdG9yeSBzdGFjay5cbiAqL1xuZXhwb3J0IGNsYXNzIFZGU3RhY2sge1xuICAgICNuYW1lOiBzdHJpbmc7XG4gICAgI2RpcnM6IE5vcm1hbGl6ZWRNb3VudFtdO1xuICAgICN2cGF0aE1hcDogTWFwPHN0cmluZywgVlBhdGhEYXRhPjtcblxuICAgIC8qKlxuICAgICAqIENvbnN0cnVjdHMgYW4gVkZTdGFjayBpbnN0YW5jZVxuICAgICAqIFxuICAgICAqIEBwYXJhbSBuYW1lIFxuICAgICAqIEBwYXJhbSBkaXJzIFxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgZGlyczogZGlyVG9Nb3VudFtdKSB7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycy5tYXAoZCA9PiB0aGlzLiNub3JtYWxpemVNb3VudChkKSk7XG4gICAgICAgIHRoaXMuI3ZwYXRoTWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZXMgYSBkaXJUb01vdW50IGludG8gaW50ZXJuYWwgcmVwcmVzZW50YXRpb25cbiAgICAgKiBAcGFyYW0gZGlyIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgICNub3JtYWxpemVNb3VudChkaXI6IGRpclRvTW91bnQpOiBOb3JtYWxpemVkTW91bnQge1xuICAgICAgICBpZiAodHlwZW9mIGRpciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3JjOiBkaXIsXG4gICAgICAgICAgICAgICAgZGVzdDogJy8nXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzcmM6IGRpci5zcmMsXG4gICAgICAgICAgICBkZXN0OiBkaXIuZGVzdCxcbiAgICAgICAgICAgIGlnbm9yZTogZGlyLmlnbm9yZSxcbiAgICAgICAgICAgIGJhc2VNZXRhZGF0YTogZGlyLmJhc2VNZXRhZGF0YVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIG5hbWUgb2YgdGhpcyBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLiNuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGRpcmVjdG9yaWVzIGluIHRoaXMgZGlyZWN0b3J5IHN0YWNrXG4gICAgICovXG4gICAgZ2V0IGRpcnMoKTogTm9ybWFsaXplZE1vdW50W10ge1xuICAgICAgICByZXR1cm4gdGhpcy4jZGlycztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gaWdub3JlIGEgZmlsZS4gIEVhY2ggZGlyVG9Nb3VudFxuICAgICAqIG1heSBoYXZlIGFuIGFycmF5IG9mIGZpbGUgZ2xvYnMgb2YgZmlsZXMgdG8gaWdub3JlLlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgZHVyaW5nIHNjYW5uaW5nIHRoZSBkaXJlY3Rvcnkgc3RhY2tcbiAgICAgKiB0byBkZXRlcm1pbmUgd2hpY2ggc3ViZGlyZWN0b3JpZXMgb3IgZmlsZXMgdG8gaWdub3JlLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmc3BhdGggXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgdG9JZ25vcmUoZnNwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgY29uc3QgbSA9IGRpci5zcmMuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIuc3JjLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgICAgIDogZGlyLnNyYztcbiAgICAgICAgICAgIGNvbnN0IG0yID0gbS5lbmRzV2l0aCgnLycpID8gbSA6IChtICsgJy8nKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFmc3BhdGguc3RhcnRzV2l0aChtMikpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb21wdXRlcyB0aGUgdnBhdGggZm9yIGEgZnVsbHkgc3BlY2lmaWVkIGZpbGUgcGF0aCxcbiAgICAgKiBzbyBsb25nIGFzIHRoZSBmaWxlIGlzIHdpdGhpbiBvbmUgb2YgdGhlIGRpcmVjdG9yaWVzXG4gICAgICogaW4gdGhlIHN0YWNrLlxuICAgICAqIFxuICAgICAqIEBwYXJhbSBmc3BhdGggXG4gICAgICogQHBhcmFtIHN0YXRzTXRpbWUgXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgdnBhdGhGb3JGU1BhdGgoZnNwYXRoOiBzdHJpbmcsIHN0YXRzTXRpbWU/OiBudW1iZXIpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICBpZiAoZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgIGxldCBpZ25vcmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlnbm9yZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaWdub3JlKSBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGlyc3JjID0gZGlyLnNyYy5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIuc3JjXG4gICAgICAgICAgICAgICAgOiAoZGlyLnNyYyArICcvJyk7XG5cbiAgICAgICAgICAgIGlmIChmc3BhdGguaW5kZXhPZihkaXJzcmMpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aEluTW91bnRlZCA9IGZzcGF0aC5zdWJzdHJpbmcoZGlyLnNyYy5sZW5ndGgpLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2cGF0aCA9IGRpci5kZXN0ID09PSAnLydcbiAgICAgICAgICAgICAgICAgICAgPyBwYXRoSW5Nb3VudGVkXG4gICAgICAgICAgICAgICAgICAgIDogcGF0aC5qb2luKGRpci5kZXN0LCBwYXRoSW5Nb3VudGVkKTtcblxuICAgICAgICAgICAgICAgIGxldCBtdGltZSA9IHN0YXRzTXRpbWU7XG4gICAgICAgICAgICAgICAgaWYgKG10aW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gc3RhdFN5bmMoZnNwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG10aW1lID0gc3RhdHMubXRpbWVNcztcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdGltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGZzcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgdnBhdGgsXG4gICAgICAgICAgICAgICAgICAgIG1pbWU6IG1pbWUuZ2V0VHlwZShmc3BhdGgpLFxuICAgICAgICAgICAgICAgICAgICBtb3VudGVkOiBkaXIuc3JjLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIuZGVzdCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogbXRpbWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2NhbnMgdGhlIGRpcmVjdG9yeSBzdGFjayB0byBjb21wdXRlIHRoZSBmaWxlc1xuICAgICAqIGluIHRoaXMgc3RhY2suXG4gICAgICovXG4gICAgYXN5bmMgc2NhbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy4jdnBhdGhNYXAuY2xlYXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuI3NjYW5EaXJlY3RvcnkoZGlyKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGlmICgoZXJyIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBWRlN0YWNrOiBEaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Q6ICR7ZGlyLnNyY31gKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jICNzY2FuRGlyZWN0b3J5KGRpcjogTm9ybWFsaXplZE1vdW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy4jd2Fsa0RpcmVjdG9yeShkaXIuc3JjKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGZzcGF0aCBvZiBmaWxlcykge1xuICAgICAgICAgICAgY29uc3QgdnBhdGhEYXRhID0gdGhpcy52cGF0aEZvckZTUGF0aChmc3BhdGgpO1xuICAgICAgICAgICAgaWYgKCF2cGF0aERhdGEpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF0aGlzLiN2cGF0aE1hcC5oYXModnBhdGhEYXRhLnZwYXRoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuI3ZwYXRoTWFwLnNldCh2cGF0aERhdGEudnBhdGgsIHZwYXRoRGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyAjd2Fsa0RpcmVjdG9yeShkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmc3AucmVhZGRpcihkaXJQYXRoLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpclBhdGgsIGVudHJ5Lm5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudG9JZ25vcmUoZnVsbFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YkZpbGVzID0gYXdhaXQgdGhpcy4jd2Fsa0RpcmVjdG9yeShmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCguLi5zdWJGaWxlcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGaW5kIGEgZmllIHdpdGhpbiB0aGUgZGlyZWN0b3J5IHN0YWNrLlxuICAgICAqIEBwYXJhbSB2cGF0aCBcbiAgICAgKiBAcmV0dXJucyBcbiAgICAgKi9cbiAgICBmaW5kKHZwYXRoOiBzdHJpbmcpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVnBhdGggPSB2cGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gdnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IHZwYXRoO1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuZ2V0KG5vcm1hbGl6ZWRWcGF0aCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGFsbCBwYXRocyBpbiB0aGUgZGlyZWN0b3J5IHN0YWNrXG4gICAgICogQHJldHVybnMgXG4gICAgICovXG4gICAgZmluZEFsbCgpOiBWUGF0aERhdGFbXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB3aGV0aGVyIHRoZSB2cGF0aCBpcyB3aXRoaW4gYSBkaXJlY3Rvcnkgc3RhY2suXG4gICAgICogQHBhcmFtIHZwYXRoIFxuICAgICAqIEByZXR1cm5zIFxuICAgICAqL1xuICAgIGhhcyh2cGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRWcGF0aCA9IHZwYXRoLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgPyB2cGF0aC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgIDogdnBhdGg7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5oYXMobm9ybWFsaXplZFZwYXRoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUZWxscyB1cyBob3cgYmlnIHRoZSBzdGFjayBpcy5cbiAgICAgKi9cbiAgICBnZXQgc2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuc2l6ZTtcbiAgICB9XG5cbiAgICAvLyBJdGVyYXRvciBwcm90b2NvbCBtZXRob2RzXG5cbiAgICBbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYXRvcjxWUGF0aERhdGE+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpO1xuICAgIH1cblxuICAgIGVudHJpZXMoKTogSXRlcmFibGVJdGVyYXRvcjxbc3RyaW5nLCBWUGF0aERhdGFdPiB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5lbnRyaWVzKCk7XG4gICAgfVxuXG4gICAga2V5cygpOiBJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAua2V5cygpO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBJdGVyYWJsZUl0ZXJhdG9yPFZQYXRoRGF0YT4ge1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAudmFsdWVzKCk7XG4gICAgfVxufVxuIl19