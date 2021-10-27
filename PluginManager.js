const md5 = require('md5');
const fs = require('fs');

exports.PluginManager = function(configObj)
{
	// Set vars
	this.plugins = {};
	this.activityQueue = [];
	this.configObj = configObj;

	// Functions
	this.pushToQueue = function(queueItem)
	{
		var hash = md5(queueItem.toString());

		// Check if it is already there.
		for(var i = 0; i < this.activityQueue.length; i++)
			if(this.activityQueue[i]["hash"] === hash)
			return;

		this.activityQueue.push({
			item: queueItem,
			hash: hash
		});
	}

	this.loadPlugin = function(dir)
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
		if(this.plugins[pluginName] != undefined)
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

		this.plugins[pluginName] = pluginData;
	}

	this.loadPlugins = function()
	{
		// Get all files in plugins folder
		var pluginDirs;
		try
		{
			pluginDirs = fs.readdirSync("./plugins");
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
		for(var i = 0; i < pluginDirs.length; i++)
		{
			this.loadPlugin(pluginDirs[i]);
		}
	}

	this.execSourcePlugins = function()
	{
		// Get all plugins of type "source"
		var pluginNames = Object.keys(this.plugins);
		for(var i = 0; i < pluginNames.length; i++)
		{
			var pluginName = pluginNames[i];
			var plugin = this.plugins[pluginName];
			if(plugin["manifest"]["type"] === "source")
			{
				try
				{
					// Exec check function
					plugin.checkFunc(this);
				}
				catch(e)
				{
					console.log("Error from plugin \"" + pluginName + "\": ");
					console.log(e);
				}
			}
		}
	}

	this.execDestinationPlugins = function()
	{
		// Get all plugins of type "destination"
		var pluginNames = Object.keys(this.plugins);
		for(var i = 0; i < pluginNames.length; i++)
		{
			var pluginName = pluginNames[i];
			var plugin = this.plugins[pluginName];
			if(plugin["manifest"]["type"] === "destination")
			{
				try
				{
					// Exec check function
					plugin.pushFunc(this.activityQueue);
				}
				catch(e)
				{
					console.log("Error from plugin \"" + pluginName + "\": ");
					console.log(e);
				}
			}
		}

		// Reset queue
		this.activityQueue = [];
	}

	// Initialization
	this.loadPlugins();

	// Do first execution
	this.execSourcePlugins();
	this.execDestinationPlugins();

	// Setup continual execution
	var temp = this;
	setInterval(function() {
		temp.execSourcePlugins();
	}, configObj["checkdelayms"]);

	setInterval(function() {
		temp.execDestinationPlugins();
	// }, configObj["pushdelayms"]);
	}, 5000);
}