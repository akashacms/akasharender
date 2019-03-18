'use strict';

const _plugin_name = Symbol('name');
const _plugin_options = Symbol('options');

module.exports = class Plugin {

    constructor(name) {
        this[_plugin_name]  = name;
    }

    set options(newOptions) { this[_plugin_options] = newOptions; }
    get options() { return this[_plugin_options]; }

    /**
     * Add this plugin to the configuration object.
     */
    configure(config, options) {
        throw new Error("Must implement configure function");
    }

    /**
     * Getter for the plugin name
     */
    get name() { return this[_plugin_name]; }

};
