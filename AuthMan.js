var qs = require('querystring');
var url = require('url');
var Request = require('request');

var client_id = process.env.CLIENT_ID || '22697087328.81343575316';
var client_secret = process.env.CLIENT_SECRET || 'a6826a960012fb7aeab6d50d0600cbbd';
var redirect_uri = process.env.REDIRECT_URI || 'https://gifadamn-test.herokuapp.com/oauth';

module.exports = {
	handleInstall(req, res) {

		var options = {
			client_id: client_id,
			redirect_uri: redirect_uri,
			scope: 'commands,chat:write:bot,chat:write:user,bot',
			state: 'some_state'
		};

		var buttonUrl = 'https://slack.com/oauth/authorize?' + qs.stringify(options);

		var html = '<html><body>';
		html+= '<a href="' + buttonUrl + '">Click here to install Gif-A-Damn</a>';
		html+= '</body></html>';

		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(html);
	},

	handleOauth(req, res) {
		var body = "";
		req.on('data', function (chunk) {
			body += chunk;

		    if (body.length > 1e6) {
	            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
	            req.connection.destroy();
	        }
		});

		req.on('end', function () {
	  		var queryObject = url.parse(req.url, true).query;
	  		var code = queryObject.code;
	  		var state = queryObject.state;

	  		// TODO: should lookup the state to make sure this req is valid

	  		var opts = {
	  			client_id: client_id,
	  			client_secret: client_secret,
	  			code: code,
	  			redirect_uri: redirect_uri
	  		};

	  		var oa_url = 'https://slack.com/api/oauth.access?' + qs.stringify(opts);

	  		Request(oa_url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					// save Oauth Token stuffs
					req.db.insertOauth(JSON.parse(body));

					// Show success page
					res.setHeader('content-type', 'application/json');
					res.writeHead(200);
					res.end(JSON.stringify({'msg':'sall good on oauth'}));
				} else {
					// show an error message
					res.setHeader('content-type', 'application/json');
					res.writeHead(200);
					res.end(JSON.stringify({'msg':'something went terrible wrong'}));
				}
			});
		});
	}
}