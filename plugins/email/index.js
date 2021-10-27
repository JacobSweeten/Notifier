exports.push = async function(activityQueue)
{
	var nm;
	try
	{
		nm = require("nodemailer");
	}
	catch(e)
	{
		console.log("Email: Nodemailer not installed. Please install with \"npm install nodemailer\" to use this plugin.");
	}

	// TODO: Finish
	let account = await nm.createTestAccount();
	let transporter = nm.createTransport({
		
	});
}