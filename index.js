const fs = require('fs');
const ini = require('ini');
const md5 = require('md5');

var plugins = {};
var activityQueue = [];
var configObj;

function pushToQueue(queueItem)
{
	var hash = md5(queueItem.toString());

	// Check if it is already there.
	for(var i = 0; i < activityQueue.length; i++)
		if(activityQueue[i]["hash"] === hash)
		return;

	activityQueue.push({
		item: queueItem,
		hash: hash
	});
}

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
}

function loadPlugin(dir)
{
	// Check if plugin is a directory
	try
	{
		fs.readdirSync("./plugins/" + dir);
	}
	catch(e)
	{
		console.log("\"./plugins/" + dir + "\" is not a directory. Skipping.");
		return;
	}

	// Look for manifest file
	var pluginManifestFile;
	try
	{
		pluginManifestFile = fs.readFileSync("./plugins/" + dir + "/manifest.json", "utf-8");
	}
	catch(e)
	{
		console.log("No manifest.json found in directory \"./plugins/" + dir + "\". Skipping.");
		return;
	}

	// Parse manifest file
	var pluginManifest;
	try
	{
		pluginManifest = JSON.parse(pluginManifestFile);
	}
	catch(e)
	{
		console.log("Invalid JSON in file \"./plugins/" + dir + "/manifest.json\". Ignoring.");
		return;
	}

	// Get plugin name
	var pluginName = pluginManifest["name"];
	if(pluginName === undefined)
	{
		console.log("No key \"name\" found in \"./plugins/" + dir + "/mainfest.json\". Skipping.");
		return;
	}

	// Check for duplicate name
	if(plugins[pluginName] != undefined)
	{
		console.log("Duplicate plugin name \"" + pluginName + "\". Skipping.");
		return;
	}

	// Get main file
	var pluginMainFileName = pluginManifest["main"];
	if(pluginMainFileName === undefined)
	{
		console.log("No key \"main\" found in \"./plugins/" + dir + "/mainfest.json\". Skipping.");
		return;
	}

	// Check if main file exists
	if(!fs.existsSync("./plugins/" + dir + "/" + pluginMainFileName))
	{
		console.log("Main file \"./plugins/" + dir + "/" + pluginMainFileName + "\" not found. Skipping.");
		return;
	}

	// Check plugin type
	var pluginType = pluginManifest["type"];
	if(pluginType === undefined)
	{
		console.log("No key \"type\" found in \"./plugins/" + dir + "/manifest.json\". Skipping.");
		return;
	}

	if(!/(source)|(destination)/.test(pluginType))
	{
		console.log("Invalid plugin type \"" + pluginType + "\" in plugin \"" + pluginName + "\". Skipping.");
		return;
	}

	// Load main file
	var plugin = require("./plugins/" + dir + "/" + pluginMainFileName);

	if(pluginType === "source" && plugin.check === undefined)
	{
		console.log("Missing check function in plugin \"" + pluginName + "\". Skipping.");
		return;
	}

	if(pluginType === "destination" && plugin.push === undefined)
	{
		console.log("Missing push function in plugin \"" + pluginName + "\". Skipping.");
		return;
	}

	// Create plugin data structure
	var pluginData = {
		manifest: pluginManifest,
		checkFunc: plugin.check,
		pushFunc: plugin.push
	};

	plugins[pluginName] = pluginData;
}

function loadPlugins()
{
	// Get all files in plugins folder
	var plugins;
	try
	{
		plugins = fs.readdirSync("./plugins");
	}
	catch(e)
	{
		// Attempt to create plugins folder
		try
		{
			fs.mkdirSync("./plugins");
		}
		catch(f)
		{
			console.error("Failed to load or create plugins folder.");
		}

		// If we had to create the folder, then there is nothing in there anyway.
		return;
	}

	// Load plugins
	for(var i = 0; i < plugins.length; i++)
	{
		loadPlugin(plugins[i]);
	}
}

function execSourcePlugins()
{
	// Get all plugins of type "source"
	var pluginNames = Object.keys(plugins);
	for(var i = 0; i < pluginNames.length; i++)
	{
		var pluginName = pluginNames[i];
		var plugin = plugins[pluginName];
		if(plugin["manifest"]["type"] === "source")
		{
			try
			{
				// Exec check function
				plugin.checkFunc(pushToQueue);
			}
			catch(e)
			{
				console.log("Error from plugin \"" + pluginName + "\": ");
				console.log(e);
			}
		}
	}
}

function execDestinationPlugins()
{
	// Get all plugins of type "destination"
	var pluginNames = Object.keys(plugins);
	for(var i = 0; i < pluginNames.length; i++)
	{
		var pluginName = pluginNames[i];
		var plugin = plugins[pluginName];
		if(plugin["manifest"]["type"] === "destination")
		{
			try
			{
				// Exec check function
				plugin.pushFunc(activityQueue);
			}
			catch(e)
			{
				console.log("Error from plugin \"" + pluginName + "\": ");
				console.log(e);
			}
		}
	}

	// Reset queue
	activityQueue = [];
}

function init()
{
	// Load stuff
	initConfig();
	loadPlugins();

	// Do first execution
	execSourcePlugins();
	execDestinationPlugins();

	// Setup continual execution
	setInterval(execSourcePlugins, configObj["checkdelayms"]);
	//setInterval(execDestinationPlugins, configObj["pushdelayms"]);
	setInterval(execDestinationPlugins, 5000);
}

init();
