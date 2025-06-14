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
var _Plugin_name, _Plugin_options, _Plugin_config, _Plugin_akasha;
/*
 * Ideally, the options object would have a declared data type,
 * and TypeScript could help us enforce types.
 *
 * The base type has a link to the config, and each Plugin
 * adds its own fields.  In loosey-goosey JavaScript we just
 * declare a blank object and add fields as we wish.
 *
 * I attempted to use this as a base type, then use Union
 * types in each Plugin.  The type machinations became
 * impossible, unfortunately.
 *
export type PluginBaseOptions = {
    config?: Configuration
};
 *
 * The solution is adding a new attribute, config.  Any
 * plugin can now get the config with this.config.
 */
export class Plugin {
    constructor(name) {
        _Plugin_name.set(this, void 0);
        _Plugin_options.set(this, void 0);
        _Plugin_config.set(this, void 0);
        _Plugin_akasha.set(this, void 0);
        __classPrivateFieldSet(this, _Plugin_name, name, "f");
    }
    set options(newOptions) { __classPrivateFieldSet(this, _Plugin_options, newOptions, "f"); }
    get options() { return __classPrivateFieldGet(this, _Plugin_options, "f"); }
    set config(newConfig) { __classPrivateFieldSet(this, _Plugin_config, newConfig, "f"); }
    get config() { return __classPrivateFieldGet(this, _Plugin_config, "f"); }
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
_Plugin_name = new WeakMap(), _Plugin_options = new WeakMap(), _Plugin_config = new WeakMap(), _Plugin_akasha = new WeakMap();
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGx1Z2luLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL1BsdWdpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7Ozs7Ozs7Ozs7Ozs7QUFJSDs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBa0JHO0FBRUgsTUFBTSxPQUFPLE1BQU07SUFPZixZQUFZLElBQUk7UUFMaEIsK0JBQWM7UUFDZCxrQ0FBUztRQUNULGlDQUF1QjtRQUN2QixpQ0FBUTtRQUdKLHVCQUFBLElBQUksZ0JBQVUsSUFBSSxNQUFBLENBQUM7SUFDdkIsQ0FBQztJQUVELElBQUksT0FBTyxDQUFDLFVBQVUsSUFBSSx1QkFBQSxJQUFJLG1CQUFZLFVBQVUsTUFBQSxDQUFDLENBQUMsQ0FBQztJQUN2RCxJQUFJLE9BQU8sS0FBSyxPQUFPLHVCQUFBLElBQUksdUJBQVMsQ0FBQyxDQUFDLENBQUM7SUFDdkMsSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLHVCQUFBLElBQUksa0JBQVcsU0FBUyxNQUFBLENBQUMsQ0FBQyxDQUFDO0lBQ25ELElBQUksTUFBTSxLQUFvQixPQUFPLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEQsSUFBSSxNQUFNLEtBQUssT0FBTyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksTUFBTSxDQUFDLE9BQU8sSUFBSSx1QkFBQSxJQUFJLGtCQUFXLE9BQU8sTUFBQSxDQUFDLENBQUMsQ0FBQztJQUUvQzs7T0FFRztJQUNILFNBQVMsQ0FBQyxNQUFNLEVBQUUsT0FBTztRQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLG1DQUFtQyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxJQUFJLEtBQUssT0FBTyx1QkFBQSxJQUFJLG9CQUFNLENBQUMsQ0FBQyxDQUFDO0lBRWpDOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILElBQUksWUFBWTtRQUNaLE9BQU87WUFDSCxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU07WUFDNUIsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNO1lBQ3pCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTTtZQUMxQixRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUs7U0FDN0IsQ0FBQztJQUNOLENBQUM7Q0FDSjs7QUFBQSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNSBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7IENvbmZpZ3VyYXRpb24gfSBmcm9tIFwiLi9pbmRleC5qc1wiO1xuXG4vKlxuICogSWRlYWxseSwgdGhlIG9wdGlvbnMgb2JqZWN0IHdvdWxkIGhhdmUgYSBkZWNsYXJlZCBkYXRhIHR5cGUsXG4gKiBhbmQgVHlwZVNjcmlwdCBjb3VsZCBoZWxwIHVzIGVuZm9yY2UgdHlwZXMuXG4gKlxuICogVGhlIGJhc2UgdHlwZSBoYXMgYSBsaW5rIHRvIHRoZSBjb25maWcsIGFuZCBlYWNoIFBsdWdpblxuICogYWRkcyBpdHMgb3duIGZpZWxkcy4gIEluIGxvb3NleS1nb29zZXkgSmF2YVNjcmlwdCB3ZSBqdXN0XG4gKiBkZWNsYXJlIGEgYmxhbmsgb2JqZWN0IGFuZCBhZGQgZmllbGRzIGFzIHdlIHdpc2guXG4gKlxuICogSSBhdHRlbXB0ZWQgdG8gdXNlIHRoaXMgYXMgYSBiYXNlIHR5cGUsIHRoZW4gdXNlIFVuaW9uXG4gKiB0eXBlcyBpbiBlYWNoIFBsdWdpbi4gIFRoZSB0eXBlIG1hY2hpbmF0aW9ucyBiZWNhbWVcbiAqIGltcG9zc2libGUsIHVuZm9ydHVuYXRlbHkuXG4gKlxuZXhwb3J0IHR5cGUgUGx1Z2luQmFzZU9wdGlvbnMgPSB7XG4gICAgY29uZmlnPzogQ29uZmlndXJhdGlvblxufTtcbiAqXG4gKiBUaGUgc29sdXRpb24gaXMgYWRkaW5nIGEgbmV3IGF0dHJpYnV0ZSwgY29uZmlnLiAgQW55XG4gKiBwbHVnaW4gY2FuIG5vdyBnZXQgdGhlIGNvbmZpZyB3aXRoIHRoaXMuY29uZmlnLlxuICovXG5cbmV4cG9ydCBjbGFzcyBQbHVnaW4ge1xuXG4gICAgI25hbWU6IHN0cmluZztcbiAgICAjb3B0aW9ucztcbiAgICAjY29uZmlnOiBDb25maWd1cmF0aW9uO1xuICAgICNha2FzaGE7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lKSB7XG4gICAgICAgIHRoaXMuI25hbWUgID0gbmFtZTtcbiAgICB9XG5cbiAgICBzZXQgb3B0aW9ucyhuZXdPcHRpb25zKSB7IHRoaXMuI29wdGlvbnMgPSBuZXdPcHRpb25zOyB9XG4gICAgZ2V0IG9wdGlvbnMoKSB7IHJldHVybiB0aGlzLiNvcHRpb25zOyB9XG4gICAgc2V0IGNvbmZpZyhuZXdDb25maWcpIHsgdGhpcy4jY29uZmlnID0gbmV3Q29uZmlnOyB9XG4gICAgZ2V0IGNvbmZpZygpOiBDb25maWd1cmF0aW9uIHsgcmV0dXJuIHRoaXMuI2NvbmZpZzsgfVxuICAgIGdldCBha2FzaGEoKSB7IHJldHVybiB0aGlzLiNha2FzaGE7IH1cbiAgICBzZXQgYWthc2hhKF9ha2FzaGEpIHsgdGhpcy4jYWthc2hhID0gX2FrYXNoYTsgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIHRoaXMgcGx1Z2luIHRvIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdC5cbiAgICAgKi9cbiAgICBjb25maWd1cmUoY29uZmlnLCBvcHRpb25zKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk11c3QgaW1wbGVtZW50IGNvbmZpZ3VyZSBmdW5jdGlvblwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXR0ZXIgZm9yIHRoZSBwbHVnaW4gbmFtZVxuICAgICAqL1xuICAgIGdldCBuYW1lKCkgeyByZXR1cm4gdGhpcy4jbmFtZTsgfVxuXG4gICAgLyoqXG4gICAgICogR2V0dGVyIGZvciBvYmplY3QgZGVzY3JpYmluZyB0aGUgYWRkaXRpb25hbCBGaWxlQ2FjaGUgZmllbGRzXG4gICAgICogdG8gaW5kZXguICBQbHVnaW5zIG1heSBiZSBpbnRlcmVzdGVkIGluIHNwZWNpZmljIGRhdGEgdGhhdCBtdXN0XG4gICAgICogYmUgaW5kZXhlZC5cbiAgICAgKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBhbiBlbXB0eSBvYmplY3QuICBBbnkgcGx1Z2luIHdpc2hpbmcgdG9cbiAgICAgKiBoYXZlIGFuIGluZGV4ZWQgZmllbGQgc2hvdWxkIGltcGxlbWVudCB0aGlzLCBhbmQgbW9kaWZ5IHRoaXMgb2JqZWN0XG4gICAgICogYXBwcm9wcmlhdGVseS5cbiAgICAgKlxuICAgICAqIFRoZSBvYmplY3QgcmV0dXJuZWQgaGFzIGZvdXIgZmllbGRzLCA8Y29kZT5kb2N1bWVudHM8L2NvZGU+LFxuICAgICAqIDxjb2RlPmFzc2V0czwvY29kZT4sIDxjb2RlPmxheW91dHM8L2NvZGU+LCBhbmQgPGNvZGU+cGFydGlhbHM8L2NvZGU+LlxuICAgICAqXG4gICAgICogQW55IGZpZWxkIHRoYXQgaXMgPGNvZGU+dW5kZWZpbmVkPC9jb2RlPiBpcyB0byBiZSBpZ25vcmVkLiAgT3RoZXJ3aXNlXG4gICAgICogdGhlIGZpZWxkIG11c3QgYmUgYW4gb2JqZWN0IGxpc3RpbmcgdGhlIGZpZWxkcyB0byBpbmRleC4gIFRoaXNcbiAgICAgKiBtZWNoYW5pc20gZG9lcyBub3Qgc3VwcG9ydCBzZXR0aW5nIHRoZSBpbmRleCB0eXBlLlxuICAgICAqL1xuICAgIGdldCBjYWNoZUluZGV4ZXMoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBkb2N1bWVudHM6IHVuZGVmaW5lZCwgLy8ge30sXG4gICAgICAgICAgICBhc3NldHM6IHVuZGVmaW5lZCwgLy8ge30sXG4gICAgICAgICAgICBsYXlvdXRzOiB1bmRlZmluZWQsIC8vIHt9LFxuICAgICAgICAgICAgcGFydGlhbHM6IHVuZGVmaW5lZCwgLy8ge31cbiAgICAgICAgfTtcbiAgICB9XG59O1xuIl19