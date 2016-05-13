

TODO  Is this needed?  It was copied from AkashaCMS but might not be needed

Instead, is registerPlugin a method of the Plugin class?

Or, is there a Configuration class that has these methods?

If so, some methods in the Plugin class belong in Configuration


/**
 * registerPlugins - go through plugins array, adding each to the plugins array in
 * the config file, then calling the config function of each plugin.
 */
exports.registerPlugins = function(config, plugins) {
	if (typeof config.plugins === 'undefined' || !config.hasOwnProperty("plugins") || ! config.plugins) {
		config.plugins = [];
	}
	
	plugins.forEach(function(pluginObj) {
		if (typeof pluginObj.plugin === 'string') {
			pluginObj.plugin = require(pluginObj.plugin);
		}
		config.plugins.push(pluginObj);
		pluginObj.plugin.config(module.exports, config);
		
		/* if (pluginObj.plugin.mahabhuta) {
		 *	registerMahabhuta(_config, pluginObj.plugin.mahabhuta);
		} */
	});
	
	return module.exports;
}

exports.eachPlugin = function(config, iterator, final) {
	async.eachSeries(config.plugins,
	function(plugin, next) {
		iterator(plugin.plugin, next);
	},
	final);
}

/**
 * plugin - Look for a plugin, returning its module reference.
 */
exports.plugin = function(config, name) {
	if (! config.plugins) {
		throw new Error('Configuration has no plugins');
	}
	var ret;
	config.plugins.forEach(function(pluginObj) {
		if (pluginObj.name === name) {
			ret = pluginObj.plugin;
		}
	});
	return ret;
}

