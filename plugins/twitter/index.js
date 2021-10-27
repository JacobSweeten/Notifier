exports.check = async function(pushToQueue)
{
	// TODO: Finish
	pushToQueue({
		source: "twitter",
		message: "I have something really cool!"
	});
}