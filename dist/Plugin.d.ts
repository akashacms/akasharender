/**
 *
 * Copyright 2014-2022 David Herron
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
export declare class Plugin {
    #private;
    constructor(name: any);
    set options(newOptions: any);
    get options(): any;
    get akasha(): any;
    set akasha(_akasha: any);
    /**
     * Add this plugin to the configuration object.
     */
    configure(config: any, options: any): void;
    /**
     * Getter for the plugin name
     */
    get name(): string;
    /**
     * Getter for object describing the additional FileCache fields
     * to index.  Plugins may be interested in specific data that must
     * be indexed.
     *
     * This function returns an empty object.  Any plugin wishing to
     * have an indexed field should implement this, and modify this object
     * appropriately.
     *
     * The object returned has four fields, <code>documents</code>,
     * <code>assets</code>, <code>layouts</code>, and <code>partials</code>.
     *
     * Any field that is <code>undefined</code> is to be ignored.  Otherwise
     * the field must be an object listing the fields to index.  This
     * mechanism does not support setting the index type.
     */
    get cacheIndexes(): {
        documents: any;
        assets: any;
        layouts: any;
        partials: any;
    };
}
//# sourceMappingURL=Plugin.d.ts.map