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
var _Plugin_name, _Plugin_options, _Plugin_akasha;
export class Plugin {
    constructor(name) {
        _Plugin_name.set(this, void 0);
        _Plugin_options.set(this, void 0);
        _Plugin_akasha.set(this, void 0);
        __classPrivateFieldSet(this, _Plugin_name, name, "f");
    }
    set options(newOptions) { __classPrivateFieldSet(this, _Plugin_options, newOptions, "f"); }
    get options() { return __classPrivateFieldGet(this, _Plugin_options, "f"); }
    get akasha() { return __classPrivateFieldGet(this, _Plugin_akasha, "f"); }
    set akasha(_akasha) { __classPrivateFieldSet(this, _Plugin_akasha, _akasha, "f"); }
    /**
     * Add this plugin to the configuration object.
     */
    configure(config, options) {
        throw new Error("Must implement configure function");
    }
    /**
     * Getter for the plugin name
     */
    get name() { return __classPrivateFieldGet(this, _Plugin_name, "f"); }
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
    get cacheIndexes() {
        return {
            documents: undefined, // {},
            assets: undefined, // {},
            layouts: undefined, // {},
            partials: undefined, // {}
        };
    }
}
_Plugin_name = new WeakMap(), _Plugin_options = new WeakMap(), _Plugin_akasha = new WeakMap();
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL1BsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFFSCxNQUFNLE9BQU8sTUFBTTtJQU1mLFlBQVksSUFBSTtRQUpoQiwrQkFBYztRQUNkLGtDQUFjO1FBQ2QsaUNBQVE7UUFHSix1QkFBQSxJQUFJLGdCQUFVLElBQUksTUFBQSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLElBQUksdUJBQUEsSUFBSSxtQkFBWSxVQUFVLE1BQUEsQ0FBQyxDQUFDLENBQUM7SUFDdkQsSUFBSSxPQUFPLEtBQUssT0FBTyx1QkFBQSxJQUFJLHVCQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLElBQUksTUFBTSxLQUFLLE9BQU8sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLENBQUMsQ0FBQztJQUNyQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksdUJBQUEsSUFBSSxrQkFBVyxPQUFPLE1BQUEsQ0FBQyxDQUFDLENBQUM7SUFFL0M7O09BRUc7SUFDSCxTQUFTLENBQUMsTUFBTSxFQUFFLE9BQU87UUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksSUFBSSxLQUFLLE9BQU8sdUJBQUEsSUFBSSxvQkFBTSxDQUFDLENBQUMsQ0FBQztJQUVqQzs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSCxJQUFJLFlBQVk7UUFDWixPQUFPO1lBQ0gsU0FBUyxFQUFFLFNBQVMsRUFBRSxNQUFNO1lBQzVCLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTTtZQUN6QixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU07WUFDMUIsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLO1NBQzdCLENBQUM7SUFDTixDQUFDO0NBQ0o7O0FBQUEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjIgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5leHBvcnQgY2xhc3MgUGx1Z2luIHtcblxuICAgICNuYW1lOiBzdHJpbmc7XG4gICAgI29wdGlvbnM6IGFueTtcbiAgICAjYWthc2hhO1xuXG4gICAgY29uc3RydWN0b3IobmFtZSkge1xuICAgICAgICB0aGlzLiNuYW1lICA9IG5hbWU7XG4gICAgfVxuXG4gICAgc2V0IG9wdGlvbnMobmV3T3B0aW9ucykgeyB0aGlzLiNvcHRpb25zID0gbmV3T3B0aW9uczsgfVxuICAgIGdldCBvcHRpb25zKCkgeyByZXR1cm4gdGhpcy4jb3B0aW9uczsgfVxuICAgIGdldCBha2FzaGEoKSB7IHJldHVybiB0aGlzLiNha2FzaGE7IH1cbiAgICBzZXQgYWthc2hhKF9ha2FzaGEpIHsgdGhpcy4jYWthc2hhID0gX2FrYXNoYTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIHRoaXMgcGx1Z2luIHRvIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25maWd1cmUoY29uZmlnLCBvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgaW1wbGVtZW50IGNvbmZpZ3VyZSBmdW5jdGlvblwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXR0ZXIgZm9yIHRoZSBwbHVnaW4gbmFtZVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy4jbmFtZTsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0dGVyIGZvciBvYmplY3QgZGVzY3JpYmluZyB0aGUgYWRkaXRpb25hbCBGaWxlQ2FjaGUgZmllbGRzXG4gICAgICogdG8gaW5kZXguICBQbHVnaW5zIG1heSBiZSBpbnRlcmVzdGVkIGluIHNwZWNpZmljIGRhdGEgdGhhdCBtdXN0XG4gICAgICogYmUgaW5kZXhlZC5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhbiBlbXB0eSBvYmplY3QuICBBbnkgcGx1Z2luIHdpc2hpbmcgdG9cbiAgICAgKiBoYXZlIGFuIGluZGV4ZWQgZmllbGQgc2hvdWxkIGltcGxlbWVudCB0aGlzLCBhbmQgbW9kaWZ5IHRoaXMgb2JqZWN0XG4gICAgICogYXBwcm9wcmlhdGVseS5cbiAgICAgKlxuICAgICAqIFRoZSBvYmplY3QgcmV0dXJuZWQgaGFzIGZvdXIgZmllbGRzLCA8Y29kZT5kb2N1bWVudHM8L2NvZGU+LFxuICAgICAqIDxjb2RlPmFzc2V0czwvY29kZT4sIDxjb2RlPmxheW91dHM8L2NvZGU+LCBhbmQgPGNvZGU+cGFydGlhbHM8L2NvZGU+LlxuICAgICAqXG4gICAgICogQW55IGZpZWxkIHRoYXQgaXMgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiBpcyB0byBiZSBpZ25vcmVkLiAgT3RoZXJ3aXNlXG4gICAgICogdGhlIGZpZWxkIG11c3QgYmUgYW4gb2JqZWN0IGxpc3RpbmcgdGhlIGZpZWxkcyB0byBpbmRleC4gIFRoaXNcbiAgICAgKiBtZWNoYW5pc20gZG9lcyBub3Qgc3VwcG9ydCBzZXR0aW5nIHRoZSBpbmRleCB0eXBlLlxuICAgICAqL1xuICAgIGdldCBjYWNoZUluZGV4ZXMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkb2N1bWVudHM6IHVuZGVmaW5lZCwgLy8ge30sXG4gICAgICAgICAgICBhc3NldHM6IHVuZGVmaW5lZCwgLy8ge30sXG4gICAgICAgICAgICBsYXlvdXRzOiB1bmRlZmluZWQsIC8vIHt9LFxuICAgICAgICAgICAgcGFydGlhbHM6IHVuZGVmaW5lZCwgLy8ge31cbiAgICAgICAgfTtcbiAgICB9XG59O1xuIl19