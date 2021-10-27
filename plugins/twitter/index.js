exports.check = async function(pluginManager)
{
	// TODO: Finish
	pluginManager.pushToQueue({
		source: "twitter",
		message: "I have something really cool!"
	});
}