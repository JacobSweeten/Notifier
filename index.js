const PluginManager = require("./PluginManager.js").PluginManager;
const ConfigLoader = require("./ConfigLoader.js").ConfigLoader;

function init()
{
	var configObj = ConfigLoader.initConfig();
	var pm = new PluginManager(configObj);
}

init();
