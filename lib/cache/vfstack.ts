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
import { Mime } from 'mime/lite';
// @ts-ignore - no type definitions available
import standardTypes from 'mime/types/standard.js';

const mime = new Mime(standardTypes);

export function mimedefine(defs: Record<string, string[]>) {
    mime.define(defs);
}

/**
 * Describes one directory to mount in a directory stack.
 */
export type dirToMount = {
    /**
     * The fspath to mount
     */
    src: string,

    /**
     * The virtual filespace
     * location
     */
    dest: string,

    /**
     * Array of GLOB patterns
     * of files to ignore
     */
    ignore?: string[],

    /**
     * An object containing
     * metadata that's to
     * apply to every file
     */
    baseMetadata?: any
};

/**
 * Type guard to determine whether {@code dir} is a {@code dirToMount}.
 * @param dir The object to check
 * @returns true if it is a dirToMount, false otherwise
 */
export const isDirToMount = (dir: any): dir is dirToMount => {
    if (typeof dir === 'undefined') return false;
    if (typeof dir !== 'object') return false;

    if ('src' in dir && typeof dir.src !== 'string') return false;
    if ('dest' in dir && typeof dir.dest !== 'string') return false;
    
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

    if (!(
        'src' in dir
     && typeof dir.src === 'string'
     && 'dest' in dir
     && typeof dir.dest === 'string'
    )) {
        return false;
    }

    return true;
};

/**
 * Describes one file in the physical filesystem, and
 * how it appears within the virtual stacked filesystem.
 */
export type VPathData = {
    /**
     * The full file-system path for the file.
     * e.g. /home/path/to/article-name.html.md
     */
    fspath: string;

    /**
     * The virtual path, rooted at the top
     * directory of the filesystem, with no
     * leading slash.
     */
    vpath: string;

    /**
     * The mime type of the file. The mime types
     * are determined from the file extension
     * using the 'mime' package.
     */
    mime?: string;

    /**
     * The file-system path which is mounted
     * into the virtual file space.
     */
    mounted: string;

    /**
     * The virtual directory of the mount
     * entry in the directory stack.
     */
    mountPoint: string;

    /**
     * The relative path underneath the mountPoint.
     */
    pathInMounted: string;

    /**
     * The mTime value from Stats
     */
    statsMtime: number;

    /**
     * The file-system stack related to the file.
     */
    stack?: VPathData[];
};

/**
 * Computes the union of files in a directory stack.
 */
export class VFStack {
    #name: string;
    #dirs: dirToMount[];
    #vpathMap: Map<string, VPathData>;

    /**
     * Constructs an VFStack instance
     * 
     * @param name 
     * @param dirs 
     */
    constructor(name: string, dirs: (string | dirToMount)[]) {
        this.#name = name;
        this.#dirs = dirs.map(d => this.#normalizeMount(d));
        this.#vpathMap = new Map();
    }

    /**
     * Normalizes a dirToMount or string into dirToMount.
     * Validates that object form is a valid dirToMount.
     * @param dir 
     * @returns 
     */
    #normalizeMount(dir: string | dirToMount): dirToMount {
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
    }

    /**
     * Returns the name of this instance
     */
    get name(): string {
        return this.#name;
    }

    /**
     * Returns the directories in this directory stack
     */
    get dirs(): dirToMount[] {
        return this.#dirs;
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
    toIgnore(fspath: string): boolean {
        for (const dir of this.#dirs) {
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
    vpathForFSPath(fspath: string, statsMtime?: number): VPathData | undefined {
        for (const dir of this.#dirs) {
            if (dir.ignore) {
                let ignore = false;
                for (const pattern of dir.ignore) {
                    if (micromatch.isMatch(fspath, pattern)) {
                        ignore = true;
                        break;
                    }
                }
                if (ignore) continue;
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
                    } catch (err) {
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
    async scan(): Promise<void> {
        this.#vpathMap.clear();

        for (const dir of this.#dirs) {
            try {
                await this.#scanDirectory(dir);
            } catch (err) {
                if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                    console.warn(`VFStack: Directory does not exist: ${dir.src}`);
                    continue;
                }
                throw err;
            }
        }
    }

    async #scanDirectory(dir: dirToMount): Promise<void> {
        const files = await this.#walkDirectory(dir.src);

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

    /**
     * Find a fie within the directory stack.
     * @param vpath 
     * @returns 
     */
    find(vpath: string): VPathData | undefined {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return this.#vpathMap.get(normalizedVpath);
    }

    /**
     * Return all paths in the directory stack
     * @returns 
     */
    findAll(): VPathData[] {
        return Array.from(this.#vpathMap.values());
    }

    /**
     * Tests whether the vpath is within a directory stack.
     * @param vpath 
     * @returns 
     */
    has(vpath: string): boolean {
        const normalizedVpath = vpath.startsWith('/')
            ? vpath.substring(1)
            : vpath;
        return this.#vpathMap.has(normalizedVpath);
    }

    /**
     * Tells us how big the stack is.
     */
    get size(): number {
        return this.#vpathMap.size;
    }

    // Iterator protocol methods

    [Symbol.iterator](): Iterator<VPathData> {
        return this.#vpathMap.values();
    }

    entries(): IterableIterator<[string, VPathData]> {
        return this.#vpathMap.entries();
    }

    keys(): IterableIterator<string> {
        return this.#vpathMap.keys();
    }

    values(): IterableIterator<VPathData> {
        return this.#vpathMap.values();
    }
}
