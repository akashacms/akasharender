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

import path from 'node:path';
import { promises as fsp, statSync } from 'node:fs';
// @ts-ignore - no type definitions available
import micromatch from 'micromatch';
// @ts-ignore - no type definitions available
import mime from 'mime';

export type DirStackItem = {
    mounted: string;
    mountPoint: string;
    baseMetadata?: any;
    ignore?: string | string[];
};

export type VPathData = {
    fspath: string;
    vpath: string;
    mime?: string;
    mounted: string;
    mountPoint: string;
    pathInMounted: string;
    statsMtime: number;
    stack?: VPathData[];
};

export class VFStack {
    #name: string;
    #dirs: DirStackItem[];
    #vpathMap: Map<string, VPathData>;

    constructor(name: string, dirs: DirStackItem[]) {
        this.#name = name;
        this.#dirs = dirs;
        this.#vpathMap = new Map();
    }

    get name(): string {
        return this.#name;
    }

    get dirs(): DirStackItem[] {
        return this.#dirs;
    }

    toIgnore(fspath: string): boolean {
        for (const dir of this.#dirs) {
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

    vpathForFSPath(fspath: string, statsMtime?: number): VPathData | undefined {
        for (const dir of this.#dirs) {
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
                if (ignore) continue;
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
                    } catch (err) {
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

    async scan(): Promise<void> {
        this.#vpathMap.clear();

        for (const dir of this.#dirs) {
            try {
                await this.#scanDirectory(dir);
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                    console.warn(`VFStack: Directory does not exist: ${dir.mounted}`);
                    continue;
                }
                throw err;
            }
        }
    }

    async #scanDirectory(dir: DirStackItem): Promise<void> {
        const files = await this.#walkDirectory(dir.mounted);

        for (const fspath of files) {
            const vpathData = this.vpathForFSPath(fspath);
            if (!vpathData) {
                continue;
            }

            if (!this.#vpathMap.has(vpathData.vpath)) {
                this.#vpathMap.set(vpathData.vpath, vpathData);
            }
        }
    }

    async #walkDirectory(dirPath: string): Promise<string[]> {
        const results: string[] = [];

        try {
            const entries = await fsp.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);

                if (this.toIgnore(fullPath)) {
                    continue;
                }

                if (entry.isDirectory()) {
                    const subFiles = await this.#walkDirectory(fullPath);
                    results.push(...subFiles);
                } else if (entry.isFile()) {
                    results.push(fullPath);
                }
            }
        } catch (err) {
            throw err;
        }

        return results;
    }

    find(vpath: string): VPathData | undefined {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return this.#vpathMap.get(normalizedVpath);
    }

    findAll(): VPathData[] {
        return Array.from(this.#vpathMap.values());
    }

    has(vpath: string): boolean {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return this.#vpathMap.has(normalizedVpath);
    }

    get size(): number {
        return this.#vpathMap.size;
    }
}
