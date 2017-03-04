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
			afterTokenValidation(res, {}, post);
			// req.db.getAuth(post.team_id, afterTokenValidation, res, post);

		});
	}
};

function afterTokenValidation(res, deets, params) {

	if ( verification_token !== params.token ) {
		res.setHeader('content-type', 'application/json');
		res.writeHead(200);
		res.end('y u no have access?');

		return;
	}

	if ( params.command === '/gifadamn' || params.command === '/gad' ) {
		// TODO: if we're in a group, and the bot is not, reply with a message to invite him!

  		var gUrl = 'http://api.giphy.com/v1/gifs/search?limit=10&api_key=' + token + '&q=' + encodeURIComponent(params.text);
  		Request(gUrl, function (error, response, body) {
			if (!error && response.statusCode == 200) {
	            var parsed = JSON.parse(body);
	            var newRecord = createRequestRecord(params.text, parsed, params);
	            params.db.insertRequest(newRecord);

				// BUILD HTML
				res.setHeader('content-type', 'application/json');
				res.writeHead(200);
				res.end(actionMan.newResponse(newRecord, 0));
			} else {
				// show an error message
				res.setHeader('content-type', 'application/json');
				res.writeHead(200);
				res.end(JSON.stringify({'msg':'something went terrible wrong'}));
			}
		});
    } else {
    	// handle action response maybe?
    	res.setHeader('content-type', 'application/json');
		res.writeHead(200);
		res.end(JSON.stringify({'msg':'sall good'}));
    }
}

function createRequestRecord(terms, parsedBody, post) {
	var imgs = [];

	parsedBody.data.forEach(function(item) {
		imgs.push(item.images.fixed_height.url);
	});

	var obj = {
		id: uuid.v4(),
		terms: terms,
		imgs: imgs,
		uid: post.user_id,
		tid: post.team_id,
		createTS: Date.now()
	}

	return obj;
}