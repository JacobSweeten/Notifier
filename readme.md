# Notifier
## Description
Notifier is a NodeJS application that uses plugins to fetch
data from the internet and push it to whatever platform you wish!

## Requirements:
- NodeJS (Developed using latest LTS, 16.13.0)
- Install required packages with `npm install`

## Writing plugins:
### manifest.json
Each plugin directory must contain a manifest.json file in the following format:
```json
{
	"name": "Plugin Name",
	"type": "source|destination",
	"main": "MainScript.js"
}
```
### Source Plugins
Source plugins must export a `check` function in the following format:
```js
exports.check = async function(pluginManager)
{
	// Do your checking
	// ...
	
	// Push to queue
	pluginManager.pushToQueue({
		source: "My Plugin Name",
		message: "Some message"
	});
}
```

### Destination Plugins
Destination plugins must export a `push` function in the following format:
```js
exports.push = async function(activityQueue)
{
	// Push the activity to wherever you want
}
```
