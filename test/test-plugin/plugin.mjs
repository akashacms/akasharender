/**
 * AkashaTestPlugin exists to provide test-oriented fixtures of
 * AkashaCMS plugin features.   Simply add this plugin to the config
 * used in test suites, and you can use the fixtures.
 */
import { Plugin } from '../../dist/Plugin.js';

const pluginName = "akashacms-test-plugin";


const _plugin_config = Symbol('config');
const _plugin_options = Symbol('options');

export default class AkashaTestPlugin extends Plugin {

	constructor() {
		super(pluginName);
	}

	configure(config, options) {
        this[_plugin_config] = config;
        this[_plugin_options] = options;
        options.config = config;
        this.beforeSiteRenderedCalled = false;
        this.onSiteRenderedCalled = false;
        this.onFileAddedCalled = false;
        this.onFileChangedCalled = false;
        this.onFileUnlinkedCalled = false;
        this.onPluginCacheSetupCalled = false;
    }

    /*
     * These functions handle the AkashaRender "hooks".
     * This lets us verify that the hooks were called.
     */

    async beforeSiteRendered(config) {
        this.beforeSiteRenderedCalled = true;
    }

    async onSiteRendered(config) {
        this.onSiteRenderedCalled = true;
    }

    async onFileAdded(config, collection, vpinfo) {
        this.onFileAddedCalled = true;
    }

    async onFileChanged(config, collection, vpinfo) {
        this.onFileChangedCalled = true;
    }

    async onFileUnlinked(config, collection, vpinfo) {
        this.onFileUnlinkedCalled = true;
    }

    async onPluginCacheSetup() {
        this.onPluginCacheSetupCalled = true;
    }

};
