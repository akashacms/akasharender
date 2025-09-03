/**
 *
 * Copyright 2014-2024 David Herron
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
export declare function init(): Promise<void>;
export declare function report(basedir: any, fpath: any, renderTo: any, stage: any, start: Date): Promise<void>;
/**
 * Support removing items from the saved data.  This is useful
 * when we're rendering the same file multiple times.
 *
 * @param {*} basedir
 * @param {*} fpath
 */
export declare function remove(basedir: any, fpath: any): Promise<void>;
export declare function removeAll(): Promise<void>;
export declare function print(): Promise<void>;
export declare function data4file(basedir: any, fpath: any): Promise<string>;
//# sourceMappingURL=data-new.d.ts.map