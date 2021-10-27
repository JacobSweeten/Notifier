exports.push = async function(activityQueue)
{
	if(activityQueue.length === 0)
	{
		console.log("Nothing to report!");
		return;
	}

	for(var i = 0; i < activityQueue.length; i++)
	{
		console.log(activityQueue[i]["item"]);
	}
}