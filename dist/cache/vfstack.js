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
        if (this.toIgnore(fspath)) {
            continue;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmZzdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jYWNoZS92ZnN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUcsRUFBRSxRQUFRLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDcEQsNkNBQTZDO0FBQzdDLE9BQU8sVUFBVSxNQUFNLFlBQVksQ0FBQztBQUNwQyw2Q0FBNkM7QUFDN0MsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBb0J4QixNQUFNLE9BQU8sT0FBTztJQUtoQixZQUFZLElBQVksRUFBRSxJQUFvQjs7UUFKOUMsZ0NBQWM7UUFDZCxnQ0FBc0I7UUFDdEIsb0NBQWtDO1FBRzlCLHVCQUFBLElBQUksaUJBQVMsSUFBSSxNQUFBLENBQUM7UUFDbEIsdUJBQUEsSUFBSSxpQkFBUyxJQUFJLE1BQUEsQ0FBQztRQUNsQix1QkFBQSxJQUFJLHFCQUFhLElBQUksR0FBRyxFQUFFLE1BQUEsQ0FBQztJQUMvQixDQUFDO0lBRUQsSUFBSSxJQUFJO1FBQ0osT0FBTyx1QkFBQSxJQUFJLHFCQUFNLENBQUM7SUFDdEIsQ0FBQztJQUVELElBQUksSUFBSTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxxQkFBTSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxRQUFRLENBQUMsTUFBYztRQUNuQixLQUFLLE1BQU0sR0FBRyxJQUFJLHVCQUFBLElBQUkscUJBQU0sRUFBRSxDQUFDO1lBQzNCLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztnQkFDakMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFD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QU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVwRSxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzFCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUVoRCxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO2dCQUN0QixNQUFNLFFBQVEsR0FBRyxNQUFNLHVCQUFBLElBQUksa0RBQWUsTUFBbkIsSUFBSSxFQUFnQixRQUFRLENBQUMsQ0FBQztnQkFDckQsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQzlCLENBQUM7aUJBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDeEIsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzQixDQUFDO1FBQ0wsQ0FBQztJQUNMLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ1gsTUFBTSxHQUFHLENBQUM7SUFDZCxDQUFDO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgcHJvbWlzZXMgYXMgZnNwLCBzdGF0U3luYyB9IGZyb20gJ25vZGU6ZnMnO1xuLy8gQHRzLWlnbm9yZSAtIG5vIHR5cGUgZGVmaW5pdGlvbnMgYXZhaWxhYmxlXG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcbi8vIEB0cy1pZ25vcmUgLSBubyB0eXBlIGRlZmluaXRpb25zIGF2YWlsYWJsZVxuaW1wb3J0IG1pbWUgZnJvbSAnbWltZSc7XG5cbmV4cG9ydCB0eXBlIERpclN0YWNrSXRlbSA9IHtcbiAgICBtb3VudGVkOiBzdHJpbmc7XG4gICAgbW91bnRQb2ludDogc3RyaW5nO1xuICAgIGJhc2VNZXRhZGF0YT86IGFueTtcbiAgICBpZ25vcmU/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbn07XG5cbmV4cG9ydCB0eXBlIFZQYXRoRGF0YSA9IHtcbiAgICBmc3BhdGg6IHN0cmluZztcbiAgICB2cGF0aDogc3RyaW5nO1xuICAgIG1pbWU/OiBzdHJpbmc7XG4gICAgbW91bnRlZDogc3RyaW5nO1xuICAgIG1vdW50UG9pbnQ6IHN0cmluZztcbiAgICBwYXRoSW5Nb3VudGVkOiBzdHJpbmc7XG4gICAgc3RhdHNNdGltZTogbnVtYmVyO1xuICAgIHN0YWNrPzogVlBhdGhEYXRhW107XG59O1xuXG5leHBvcnQgY2xhc3MgVkZTdGFjayB7XG4gICAgI25hbWU6IHN0cmluZztcbiAgICAjZGlyczogRGlyU3RhY2tJdGVtW107XG4gICAgI3ZwYXRoTWFwOiBNYXA8c3RyaW5nLCBWUGF0aERhdGE+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBkaXJzOiBEaXJTdGFja0l0ZW1bXSkge1xuICAgICAgICB0aGlzLiNuYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy4jZGlycyA9IGRpcnM7XG4gICAgICAgIHRoaXMuI3ZwYXRoTWFwID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLiNuYW1lO1xuICAgIH1cblxuICAgIGdldCBkaXJzKCk6IERpclN0YWNrSXRlbVtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI2RpcnM7XG4gICAgfVxuXG4gICAgdG9JZ25vcmUoZnNwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy4jZGlycykge1xuICAgICAgICAgICAgY29uc3QgbSA9IGRpci5tb3VudGVkLnN0YXJ0c1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgID8gZGlyLm1vdW50ZWQuc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICAgICAgOiBkaXIubW91bnRlZDtcbiAgICAgICAgICAgIGNvbnN0IG0yID0gbS5lbmRzV2l0aCgnLycpID8gbSA6IChtICsgJy8nKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCFmc3BhdGguc3RhcnRzV2l0aChtMikpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpci5pZ25vcmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpZ25vcmVzID0gdHlwZW9mIGRpci5pZ25vcmUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgID8gW2Rpci5pZ25vcmVdXG4gICAgICAgICAgICAgICAgICAgIDogZGlyLmlnbm9yZTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHBhdHRlcm4gb2YgaWdub3Jlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobWljcm9tYXRjaC5pc01hdGNoKGZzcGF0aCwgcGF0dGVybikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2cGF0aEZvckZTUGF0aChmc3BhdGg6IHN0cmluZywgc3RhdHNNdGltZT86IG51bWJlcik6IFZQYXRoRGF0YSB8IHVuZGVmaW5lZCB7XG4gICAgICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuI2RpcnMpIHtcbiAgICAgICAgICAgIGlmIChkaXIuaWdub3JlKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaWdub3JlcyA9IHR5cGVvZiBkaXIuaWdub3JlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IFtkaXIuaWdub3JlXVxuICAgICAgICAgICAgICAgICAgICA6IGRpci5pZ25vcmU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbGV0IGlnbm9yZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcGF0dGVybiBvZiBpZ25vcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaWNyb21hdGNoLmlzTWF0Y2goZnNwYXRoLCBwYXR0ZXJuKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWdub3JlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpZ25vcmUpIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkaXJtb3VudGVkID0gZGlyLm1vdW50ZWQuZW5kc1dpdGgoJy8nKVxuICAgICAgICAgICAgICAgID8gZGlyLm1vdW50ZWRcbiAgICAgICAgICAgICAgICA6IChkaXIubW91bnRlZCArICcvJyk7XG5cbiAgICAgICAgICAgIGlmIChmc3BhdGguaW5kZXhPZihkaXJtb3VudGVkKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGhJbk1vdW50ZWQgPSBmc3BhdGguc3Vic3RyaW5nKGRpci5tb3VudGVkLmxlbmd0aCkuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZwYXRoID0gZGlyLm1vdW50UG9pbnQgPT09ICcvJ1xuICAgICAgICAgICAgICAgICAgICA/IHBhdGhJbk1vdW50ZWRcbiAgICAgICAgICAgICAgICAgICAgOiBwYXRoLmpvaW4oZGlyLm1vdW50UG9pbnQsIHBhdGhJbk1vdW50ZWQpO1xuXG4gICAgICAgICAgICAgICAgbGV0IG10aW1lID0gc3RhdHNNdGltZTtcbiAgICAgICAgICAgICAgICBpZiAobXRpbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBzdGF0U3luYyhmc3BhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXRpbWUgPSBzdGF0cy5tdGltZU1zO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG10aW1lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZnNwYXRoLFxuICAgICAgICAgICAgICAgICAgICB2cGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogbWltZS5nZXRUeXBlKGZzcGF0aCksXG4gICAgICAgICAgICAgICAgICAgIG1vdW50ZWQ6IGRpci5tb3VudGVkLFxuICAgICAgICAgICAgICAgICAgICBtb3VudFBvaW50OiBkaXIubW91bnRQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgcGF0aEluTW91bnRlZCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHNNdGltZTogbXRpbWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgYXN5bmMgc2NhbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgdGhpcy4jdnBhdGhNYXAuY2xlYXIoKTtcblxuICAgICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLiNkaXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuI3NjYW5EaXJlY3RvcnkoZGlyKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGlmICgoZXJyIGFzIE5vZGVKUy5FcnJub0V4Y2VwdGlvbikuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBWRlN0YWNrOiBEaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Q6ICR7ZGlyLm1vdW50ZWR9YCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyAjc2NhbkRpcmVjdG9yeShkaXI6IERpclN0YWNrSXRlbSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHRoaXMuI3dhbGtEaXJlY3RvcnkoZGlyLm1vdW50ZWQpO1xuXG4gICAgICAgIGZvciAoY29uc3QgZnNwYXRoIG9mIGZpbGVzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50b0lnbm9yZShmc3BhdGgpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHZwYXRoRGF0YSA9IHRoaXMudnBhdGhGb3JGU1BhdGgoZnNwYXRoKTtcbiAgICAgICAgICAgIGlmICghdnBhdGhEYXRhKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy4jdnBhdGhNYXAuaGFzKHZwYXRoRGF0YS52cGF0aCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiN2cGF0aE1hcC5zZXQodnBhdGhEYXRhLnZwYXRoLCB2cGF0aERhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgI3dhbGtEaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnNwLnJlYWRkaXIoZGlyUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBlbnRyeS5uYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YkZpbGVzID0gYXdhaXQgdGhpcy4jd2Fsa0RpcmVjdG9yeShmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCguLi5zdWJGaWxlcyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICBmaW5kKHZwYXRoOiBzdHJpbmcpOiBWUGF0aERhdGEgfCB1bmRlZmluZWQge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVnBhdGggPSB2cGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gdnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IHZwYXRoO1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuZ2V0KG5vcm1hbGl6ZWRWcGF0aCk7XG4gICAgfVxuXG4gICAgZmluZEFsbCgpOiBWUGF0aERhdGFbXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuI3ZwYXRoTWFwLnZhbHVlcygpKTtcbiAgICB9XG5cbiAgICBoYXModnBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkVnBhdGggPSB2cGF0aC5zdGFydHNXaXRoKCcvJylcbiAgICAgICAgICAgID8gdnBhdGguc3Vic3RyaW5nKDEpXG4gICAgICAgICAgICA6IHZwYXRoO1xuICAgICAgICByZXR1cm4gdGhpcy4jdnBhdGhNYXAuaGFzKG5vcm1hbGl6ZWRWcGF0aCk7XG4gICAgfVxuXG4gICAgZ2V0IHNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuI3ZwYXRoTWFwLnNpemU7XG4gICAgfVxufVxuIl19