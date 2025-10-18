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
var _VFStack_instances, _VFStack_name, _VFStack_dirs, _VFStack_vpathMap, _VFStack_scanDirectory, _VFStack_walkDirectory;
import path from 'node:path';
import { promises as fsp, statSync } from 'node:fs';
// @ts-ignore - no type definitions available
import micromatch from 'micromatch';
// @ts-ignore - no type definitions available
import mime from 'mime';
export class VFStack {
    constructor(name, dirs) {
        _VFStack_instances.add(this);
        _VFStack_name.set(this, void 0);
        _VFStack_dirs.set(this, void 0);
        _VFStack_vpathMap.set(this, void 0);
        __classPrivateFieldSet(this, _VFStack_name, name, "f");
        __classPrivateFieldSet(this, _VFStack_dirs, dirs, "f");
        __classPrivateFieldSet(this, _VFStack_vpathMap, new Map(), "f");
    }
    get name() {
        return __classPrivateFieldGet(this, _VFStack_name, "f");
    }
    get dirs() {
        return __classPrivateFieldGet(this, _VFStack_dirs, "f");
    }
    toIgnore(fspath) {
        for (const dir of __classPrivateFieldGet(this, _VFStack_dirs, "f")) {
            const m = dir.mounted.startsWith('/')
                ? dir.mounted.substring(1)
                : dir.mounted;
            const m2 = m.endsWith('/') ? m : (m + '/');
            if (!fspath.startsWith(m2)) {
                continue;
            }
            if (dir.ignore) {
                const ignores = typeof dir.ignore === 'string'
                    ? [dir.ignore]
                    : dir.ignore;
                for (const pattern of ignores) {
                    if (micromatch.isMatch(fspath, pattern)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    vpathForFSPath(fspath, statsMtime) {
        for (const dir of __classPrivateFieldGet(this, _VFStack_dirs, "f")) {
            if (dir.ignore) {
                const ignores = typeof dir.ignore === 'string'
                    ? [dir.ignore]
                    : dir.ignore;
                let ignore = false;
                for (const pattern of ignores) {
                    if (micromatch.isMatch(fspath, pattern)) {
                        ignore = true;
                        break;
                    }
                }
                if (ignore)
                    continue;
            }
            const dirmounted = dir.mounted.endsWith('/')
                ? dir.mounted
                : (dir.mounted + '/');
            if (fspath.indexOf(dirmounted) === 0) {
                const pathInMounted = fspath.substring(dir.mounted.length).substring(1);
                const vpath = dir.mountPoint === '/'
                    ? pathInMounted
                    : path.join(dir.mountPoint, pathInMounted);
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
                    mounted: dir.mounted,
                    mountPoint: dir.mountPoint,
                    pathInMounted,
                    statsMtime: mtime
                };
            }
        }
        return undefined;
    }
    async scan() {
        __classPrivateFieldGet(this, _VFStack_vpathMap, "f").clear();
        for (const dir of __classPrivateFieldGet(this, _VFStack_dirs, "f")) {
            try {
                await __classPrivateFieldGet(this, _VFStack_instances, "m", _VFStack_scanDirectory).call(this, dir);
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    console.warn(`VFStack: Directory does not exist: ${dir.mounted}`);
                    continue;
                }
                throw err;
            }
        }
    }
    find(vpath) {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").get(normalizedVpath);
    }
    findAll() {
        return Array.from(__classPrivateFieldGet(this, _VFStack_vpathMap, "f").values());
    }
    has(vpath) {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").has(normalizedVpath);
    }
    get size() {
        return __classPrivateFieldGet(this, _VFStack_vpathMap, "f").size;
    }
}
_VFStack_name = new WeakMap(), _VFStack_dirs = new WeakMap(), _VFStack_vpathMap = new WeakMap(), _VFStack_instances = new WeakSet(), _VFStack_scanDirectory = async function _VFStack_scanDirectory(dir) {
    const files = await __classPrivateFieldGet(this, _VFStack_instances, "m", _VFStack_walkDirectory).call(this, dir.mounted);
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
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBaUZ4QixNQUFNLE9BQU8sT0FBTztJQUtoQixZQUFZLElBQVksRUFBRSxJQUFvQjs7UUFKOUMsZ0NBQWM7UUFDZCxnQ0FBc0I7UUFDdEIsb0NBQWtDO1FBRzlCLHVCQUFBLElBQUksaUJBQVMsSUFBSSxNQUFBLENBQUM7UUFDbEIsdUJBQUEsSUFBSSxpQkFBUyxJQUFJLE1BQUEsQ0FBQztRQUNsQix1QkFBQSxJQUFJLHFCQUFhLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ0osT0FBTyx1QkFBQSxJQUFJLHFCQUFNLENBQUM7SUFDdEIsQ0FBQztJQUVELElBQUksSUFBSTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxxQkFBTSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxRQUFRLENBQUMsTUFBYztRQUNuQixLQUFLLE1BQU0sR0FBRyxJQUFJLHVCQUFBLElBQUkscUJBQU0sRUFBRSxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztnQkFDakMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFD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QUssSUFBSSxPQUFPLEVBQUUsQ0FBQztZQUMxQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFaEQsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7Z0JBQzFCLFNBQVM7WUFDYixDQUFDO1lBRUQsSUFBSSxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxRQUFRLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGtEQUFlLE1BQW5CLElBQUksRUFBZ0IsUUFBUSxDQUFDLENBQUM7Z0JBQ3JELE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQztZQUM5QixDQUFDO2lCQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0IsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNYLE1BQU0sR0FBRyxDQUFDO0lBQ2QsQ0FBQztJQUVELE9BQU8sT0FBTyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNC0yMDI1IERhdmlkIEhlcnJvblxuICpcbiAqIFRoaXMgZmlsZSBpcyBwYXJ0IG9mIEFrYXNoYUNNUyAoaHR0cDovL2FrYXNoYWNtcy5jb20vKS5cbiAqXG4gKiAgTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqICB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiAgVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqICBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqICBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiAgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHByb21pc2VzIGFzIGZzcCwgc3RhdFN5bmMgfSBmcm9tICdub2RlOmZzJztcbi8vIEB0cy1pZ25vcmUgLSBubyB0eXBlIGRlZmluaXRpb25zIGF2YWlsYWJsZVxuaW1wb3J0IG1pY3JvbWF0Y2ggZnJvbSAnbWljcm9tYXRjaCc7XG4vLyBAdHMtaWdub3JlIC0gbm8gdHlwZSBkZWZpbml0aW9ucyBhdmFpbGFibGVcbmltcG9ydCBtaW1lIGZyb20gJ21pbWUnO1xuXG4vKipcbiAqIERlc2NyaWJlcyBvbmUgZW50cnkgaW4gYSBkaXJlY3Rvcnkgc3RhY2suXG4gKi9cbmV4cG9ydCB0eXBlIERpclN0YWNrSXRlbSA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgZmlsZXN5c3RlbSBwYXRoIHRvIG1vdW50LlxuICAgICAqL1xuICAgIG1vdW50ZWQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBwYXRoIHdpdGhpbiB0aGUgdmlydHVhbCBmaWxlc3lzdGVtIHdoZXJlIHRoaXMgd2lsbCBhcHBlYXIuXG4gICAgICovXG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogTWV0YWRhdGEgb2JqZWN0IHRvIHVzZSB3aXRoaW4gdGhlIHN1Yi1oaWVyYXJjaHkuXG4gICAgICovXG4gICAgYmFzZU1ldGFkYXRhPzogYW55O1xuXG4gICAgLyoqXG4gICAgICogT3B0aW9uYWwgYXJyYXkgb2Ygc3RyaW5ncyBjb250YWluaW5nIGdsb2JzIGZvciBtYXRjaGluZ1xuICAgICAqIGZpbGVzIHRvIGlnbm9yZS5cbiAgICAgKi9cbiAgICBpZ25vcmU/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbn07XG5cbi8qKlxuICogRGVzY3JpYmVzIG9uZSBmaWxlIGluIHRoZSBwaHlzaWNhbCBmaWxlc3lzdGVtLCBhbmRcbiAqIGhvdyBpdCBhcHBlYXJzIHdpdGhpbiB0aGUgdmlydHVhbCBzdGFja2VkIGZpbGVzeXN0ZW0uXG4gKi9cbmV4cG9ydCB0eXBlIFZQYXRoRGF0YSA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgZnVsbCBmaWxlLXN5c3RlbSBwYXRoIGZvciB0aGUgZmlsZS5cbiAgICAgKiBlLmcuIC9ob21lL3BhdGgvdG8vYXJ0aWNsZS1uYW1lLmh0bWwubWRcbiAgICAgKi9cbiAgICBmc3BhdGg6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSB2aXJ0dWFsIHBhdGgsIHJvb3RlZCBhdCB0aGUgdG9wXG4gICAgICogZGlyZWN0b3J5IG9mIHRoZSBmaWxlc3lzdGVtLCB3aXRoIG5vXG4gICAgICogbGVhZGluZyBzbGFzaC5cbiAgICAgKi9cbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gVGhlIG1pbWUgdHlwZXNcbiAgICAgKiBhcmUgZGV0ZXJtaW5lZCBmcm9tIHRoZSBmaWxlIGV4dGVuc2lvblxuICAgICAqIHVzaW5nIHRoZSAnbWltZScgcGFja2FnZS5cbiAgICAgKi9cbiAgICBtaW1lPzogc3RyaW5nO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGZpbGUtc3lzdGVtIHBhdGggd2hpY2ggaXMgbW91bnRlZFxuICAgICAqIGludG8gdGhlIHZpcnR1YWwgZmlsZSBzcGFjZS5cbiAgICAgKi9cbiAgICBtb3VudGVkOiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgdmlydHVhbCBkaXJlY3Rvcnkgb2YgdGhlIG1vdW50XG4gICAgICogZW50cnkgaW4gdGhlIGRpcmVjdG9yeSBzdGFjay5cbiAgICAgKi9cbiAgICBtb3VudFBvaW50OiBzdHJpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcmVsYXRpdmUgcGF0aCB1bmRlcm5lYXRoIHRoZSBtb3VudFBvaW50LlxuICAgICAqL1xuICAgIHBhdGhJbk1vdW50ZWQ6IHN0cmluZztcblxuICAgIC8qKlxuICAgICAqIFRoZSBtVGltZSB2YWx1ZSBmcm9tIFN0YXRzXG4gICAgICovXG4gICAgc3RhdHNNdGltZTogbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhlIGZpbGUtc3lzdGVtIHN0YWNrIHJlbGF0ZWQgdG8gdGhlIGZpbGUuXG4gICAgICovXG4gICAgc3RhY2s/OiBWUGF0aERhdGFbXTtcbn07XG5cbmV4cG9ydCBjbGFzcyBWRlN0YWNrIHtcbiAgICAjbmFtZTogc3RyaW5nO1xuICAgICNkaXJzOiBEaXJTdGFja0l0ZW1bXTtcbiAgICAjdnBhdGhNYXA6IE1hcDxzdHJpbmcsIFZQYXRoRGF0YT47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGRpcnM6IERpclN0YWNrSXRlbVtdKSB7XG4gICAgICAgIHRoaXMuI25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLiNkaXJzID0gZGlycztcbiAgICAgICAgdGhpcy4jdnBhdGhNYXAgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI25hbWU7XG4gICAgfVxuXG4gICAgZ2V0IGRpcnMoKTogRGlyU3RhY2tJdGVtW10ge1xuICAgICAgICByZXR1cm4gdGhpcy4jZGlycztcbiAgICB9XG5cbiAgICB0b0lnbm9yZShmc3BhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICBjb25zdCBtID0gZGlyLm1vdW50ZWQuc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIubW91bnRlZC5zdWJzdHJpbmcoMSlcbiAgICAgICAgICAgICAgICA6IGRpci5tb3VudGVkO1xuICAgICAgICAgICAgY29uc3QgbTIgPSBtLmVuZHNXaXRoKCcvJykgPyBtIDogKG0gKyAnLycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIWZzcGF0aC5zdGFydHNXaXRoKG0yKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGlyLmlnbm9yZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGlnbm9yZXMgPSB0eXBlb2YgZGlyLmlnbm9yZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyBbZGlyLmlnbm9yZV1cbiAgICAgICAgICAgICAgICAgICAgOiBkaXIuaWdub3JlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goZnNwYXRoLCBwYXR0ZXJuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZwYXRoRm9yRlNQYXRoKGZzcGF0aDogc3RyaW5nLCBzdGF0c010aW1lPzogbnVtYmVyKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZ25vcmVzID0gdHlwZW9mIGRpci5pZ25vcmUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgID8gW2Rpci5pZ25vcmVdXG4gICAgICAgICAgICAgICAgICAgIDogZGlyLmlnbm9yZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBsZXQgaWdub3JlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwYXR0ZXJuIG9mIGlnbm9yZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1pY3JvbWF0Y2guaXNNYXRjaChmc3BhdGgsIHBhdHRlcm4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZ25vcmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlnbm9yZSkgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRpcm1vdW50ZWQgPSBkaXIubW91bnRlZC5lbmRzV2l0aCgnLycpXG4gICAgICAgICAgICAgICAgPyBkaXIubW91bnRlZFxuICAgICAgICAgICAgICAgIDogKGRpci5tb3VudGVkICsgJy8nKTtcblxuICAgICAgICAgICAgaWYgKGZzcGF0aC5pbmRleE9mKGRpcm1vdW50ZWQpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGF0aEluTW91bnRlZCA9IGZzcGF0aC5zdWJzdHJpbmcoZGlyLm1vdW50ZWQubGVuZ3RoKS5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdnBhdGggPSBkaXIubW91bnRQb2ludCA9PT0gJy8nXG4gICAgICAgICAgICAgICAgICAgID8gcGF0aEluTW91bnRlZFxuICAgICAgICAgICAgICAgICAgICA6IHBhdGguam9pbihkaXIubW91bnRQb2ludCwgcGF0aEluTW91bnRlZCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgbXRpbWUgPSBzdGF0c010aW1lO1xuICAgICAgICAgICAgICAgIGlmIChtdGltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGF0cyA9IHN0YXRTeW5jKGZzcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdGltZSA9IHN0YXRzLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXRpbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBmc3BhdGgsXG4gICAgICAgICAgICAgICAgICAgIHZwYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiBtaW1lLmdldFR5cGUoZnNwYXRoKSxcbiAgICAgICAgICAgICAgICAgICAgbW91bnRlZDogZGlyLm1vdW50ZWQsXG4gICAgICAgICAgICAgICAgICAgIG1vdW50UG9pbnQ6IGRpci5tb3VudFBvaW50LFxuICAgICAgICAgICAgICAgICAgICBwYXRoSW5Nb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBzdGF0c010aW1lOiBtdGltZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBhc3luYyBzY2FuKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0aGlzLiN2cGF0aE1hcC5jbGVhcigpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuI2RpcnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy4jc2NhbkRpcmVjdG9yeShkaXIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKChlcnIgYXMgTm9kZUpTLkVycm5vRXhjZXB0aW9uKS5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFZGU3RhY2s6IERpcmVjdG9yeSBkb2VzIG5vdCBleGlzdDogJHtkaXIubW91bnRlZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jICNzY2FuRGlyZWN0b3J5KGRpcjogRGlyU3RhY2tJdGVtKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgdGhpcy4jd2Fsa0RpcmVjdG9yeShkaXIubW91bnRlZCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBmc3BhdGggb2YgZmlsZXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHZwYXRoRGF0YSA9IHRoaXMudnBhdGhGb3JGU1BhdGgoZnNwYXRoKTtcbiAgICAgICAgICAgIGlmICghdnBhdGhEYXRhKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy4jdnBhdGhNYXAuaGFzKHZwYXRoRGF0YS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiN2cGF0aE1hcC5zZXQodnBhdGhEYXRhLnZwYXRoLCB2cGF0aERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgI3dhbGtEaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnNwLnJlYWRkaXIoZGlyUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBlbnRyeS5uYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRvSWdub3JlKGZ1bGxQYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJGaWxlcyA9IGF3YWl0IHRoaXMuI3dhbGtEaXJlY3RvcnkoZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goLi4uc3ViRmlsZXMpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgZmluZCh2cGF0aDogc3RyaW5nKTogVlBhdGhEYXRhIHwgdW5kZWZpbmVkIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZwYXRoID0gdnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IHZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiB2cGF0aDtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmdldChub3JtYWxpemVkVnBhdGgpO1xuICAgIH1cblxuICAgIGZpbmRBbGwoKTogVlBhdGhEYXRhW10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLiN2cGF0aE1hcC52YWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgaGFzKHZwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFZwYXRoID0gdnBhdGguc3RhcnRzV2l0aCgnLycpXG4gICAgICAgICAgICA/IHZwYXRoLnN1YnN0cmluZygxKVxuICAgICAgICAgICAgOiB2cGF0aDtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLmhhcyhub3JtYWxpemVkVnBhdGgpO1xuICAgIH1cblxuICAgIGdldCBzaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLiN2cGF0aE1hcC5zaXplO1xuICAgIH1cbn1cbiJdfQ==