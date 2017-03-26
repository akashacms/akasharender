'use strict';

const _plugin_name = Symbol('name');

module.exports = class Plugin {

    constructor(name) {
        this[_plugin_name]  = name;
    }

    /**
     * Add this plugin to the configuration object.
     */
    configure(config) {
        throw new Error("Must implement configure function");
    }

    /**
     * Getter for the plugin name
     */
    get name() { return this[_plugin_name]; }

};
