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
/**
 * Describes one directory to mount in a directory stack.
 */
export type dirToMount = {
    /**
     * The fspath to mount
     */
    src: string;
    /**
     * The virtual filespace
     * location
     */
    dest: string;
    /**
     * Array of GLOB patterns
     * of files to ignore
     */
    ignore?: string[];
    /**
     * An object containing
     * metadata that's to
     * apply to every file
     */
    baseMetadata?: any;
};
/**
 * Type guard to determine whether {@code dir} is a {@code dirToMount}.
 * @param dir The object to check
 * @returns true if it is a dirToMount, false otherwise
 */
export declare const isDirToMount: (dir: any) => dir is dirToMount;
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
export declare class VFStack {
    #private;
    /**
     * Constructs an VFStack instance
     *
     * @param name
     * @param dirs
     */
    constructor(name: string, dirs: (string | dirToMount)[]);
    /**
     * Returns the name of this instance
     */
    get name(): string;
    /**
     * Returns the directories in this directory stack
     */
    get dirs(): dirToMount[];
    /**
     * Determines whether to ignore a file.  Each dirToMount
     * may have an array of file globs of files to ignore.
     * This method is used during scanning the directory stack
     * to determine which subdirectories or files to ignore.
     *
     * @param fspath
     * @returns
     */
    toIgnore(fspath: string): boolean;
    /**
     * Computes the vpath for a fully specified file path,
     * so long as the file is within one of the directories
     * in the stack.
     *
     * @param fspath
     * @param statsMtime
     * @returns
     */
    vpathForFSPath(fspath: string, statsMtime?: number): VPathData | undefined;
    /**
     * Scans the directory stack to compute the files
     * in this stack.
     */
    scan(): Promise<void>;
    /**
     * Find a fie within the directory stack.
     * @param vpath
     * @returns
     */
    find(vpath: string): VPathData | undefined;
    /**
     * Return all paths in the directory stack
     * @returns
     */
    findAll(): VPathData[];
    /**
     * Tests whether the vpath is within a directory stack.
     * @param vpath
     * @returns
     */
    has(vpath: string): boolean;
    /**
     * Tells us how big the stack is.
     */
    get size(): number;
    [Symbol.iterator](): Iterator<VPathData>;
    entries(): IterableIterator<[string, VPathData]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<VPathData>;
}
//# sourceMappingURL=vfstack.d.ts.map