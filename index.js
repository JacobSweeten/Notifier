const fs = require('fs');
const ini = require('ini');
const PluginManager = require("./PluginManager.js").PluginManager;

var configObj;
var pm;

function initConfig()
{
	// Open config file
	try
	{
		var configFile = fs.readFileSync("./config.ini", "utf-8");
	}
	catch(e)
	{
		console.error("Failed to load config.ini. Exiting.");
		process.exit(1);
	}

	// Parse config file
	try
	{
		configObj = ini.parse(configFile);
	}
	catch(e)
	{
		console.error("Invalid config.ini. Exiting.");
		process.exit(1);
	}

	// Check checkdelayms variable
	if(configObj["checkdelayms"] === undefined)
	{
		console.error("Missing config \"checkdelayms\". Exiting");
		process.exit(1);
	}

	if(!/^[0-9]+$/.test(configObj["checkdelayms"]))
	{
		console.error("checkdelayms is not a number. Exiting.");
		process.exit(1);
	}

	// Check pushdelayms variable
	if(configObj["pushdelayms"] === undefined)
	{
		console.error("Missing config \"pushdelayms\". Exiting");
		process.exit(1);
	}

	if(!/^[0-9]+$/.test(configObj["pushdelayms"]))
	{
		console.error("pushdelayms is not a number. Exiting.");
		process.exit(1);
	}
}

function init()
{
	// Load stuff
	initConfig();

	pm = new PluginManager(configObj);
}

init();
