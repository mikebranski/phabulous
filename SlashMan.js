var qs = require('querystring');
var Request = require('request');
var uuid = require('uuid');

var actionMan = require('./ActionMan');

var token = process.env.GIPHY_API_TOKEN || 'dc6zaTOxFJmzC';
var giphyURL = 'http://api.giphy.com/v1/gifs/search';

var verification_token = process.env.SLACK_VERIFICATION_TOKEN || 'f8KePnqWzMVeMUM5L4MDsXaq';

module.exports = {
	handleSlashRequest(req, res) {

		var body = "";
		req.on('data', function (chunk) {
			body += chunk;

		    if (body.length > 1e6) {
	            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
	            console.log('request gettin nuked');
	            req.connection.destroy();
	        }
		});

		req.on('end', function () {
			var post = qs.parse(body);
			post.db = req.db;

			// skip team verification, just use slash tokens
			// afterTokenValidation(res, {}, post);
			req.db.getAuth(post.team_id, afterTokenValidation, res, post);

		});
	}
};

function afterTokenValidation(res, deets, params) {
	// save somewhere in the deets (the auth object from mongo) 
	// that this team is configured
	if (!deets.configs.formWhatever && params.command !== '/config') {
		res.setHeader('content-type', 'application/json');
		res.writeHead(200);
		res.end('You havent configured your form ids yet, please use the command /phab config to set them up');
		return;
	}

	// this is probably unnecessary
	if ( verification_token !== params.token ) {
		res.setHeader('content-type', 'application/json');
		res.writeHead(200);
		res.end('y u no have access?');

		return;
	}

	switch (params.command) {
		case '/config':
			// this is a config request...do stuff then respond accordingly.

			break;
		case '/thisSlashCommand': 

			break;
		case '/thatSlashCommand': 

			break;
		
		default:
			res.setHeader('content-type', 'application/json');
			res.writeHead(200);
			res.end(JSON.stringify({'msg':'sall good'}));
	}
}