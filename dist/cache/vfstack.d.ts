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
 * Describes one entry in a directory stack.
 */
export type DirStackItem = {
    /**
     * The filesystem path to mount.
     */
    mounted: string;
    /**
     * The path within the virtual filesystem where this will appear.
     */
    mountPoint: string;
    /**
     * Metadata object to use within the sub-hierarchy.
     */
    baseMetadata?: any;
    /**
     * Optional array of strings containing globs for matching
     * files to ignore.
     */
    ignore?: string | string[];
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
export declare class VFStack {
    #private;
    constructor(name: string, dirs: DirStackItem[]);
    get name(): string;
    get dirs(): DirStackItem[];
    toIgnore(fspath: string): boolean;
    vpathForFSPath(fspath: string, statsMtime?: number): VPathData | undefined;
    scan(): Promise<void>;
    find(vpath: string): VPathData | undefined;
    findAll(): VPathData[];
    has(vpath: string): boolean;
    get size(): number;
}
//# sourceMappingURL=vfstack.d.ts.map