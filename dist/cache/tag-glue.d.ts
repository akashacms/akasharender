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
import { AsyncDatabase } from 'promised-sqlite3';
export declare class TagGlue {
    #private;
    get db(): AsyncDatabase;
    init(db: AsyncDatabase): Promise<void>;
    addTagGlue(vpath: string, tags: string[]): Promise<void>;
    deleteTagGlue(vpath: string): Promise<void>;
    tags(): Promise<string[]>;
    pathsForTag(tagName: string | string[]): Promise<string[]>;
}
export declare class TagDescriptions {
    #private;
    get db(): AsyncDatabase;
    init(db: AsyncDatabase): Promise<void>;
    addDesc(tag: string, description: string): Promise<void>;
    deleteDesc(tag: string): Promise<void>;
    getDesc(tag: string): Promise<string | undefined>;
}
//# sourceMappingURL=tag-glue.d.ts.map