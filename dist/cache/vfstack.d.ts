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