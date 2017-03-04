var qs = require('querystring');
var WebClient = require('@slack/client').WebClient;
var root_url = process.env.ROOT_URL || 'https://test.gifadamn.com';
var verification_token = process.env.SLACK_VERIFICATION_TOKEN || 'abcdefghijklmnopqrstuvwxyz';

var handleAction = function(req, res) {
  var body = "";
  req.on('data', function (chunk) {
    body += chunk;

      if (body.length > 1e6) {
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            req.connection.destroy();
        }
  });

  req.on('end', function () {
      var post = qs.parse(body);
      // should lookup the state to make sure this req is valid
      var payload = JSON.parse(post.payload);

      console.log('action payload', payload);

      payload.db = req.db;

      if ( verification_token !== payload.token ) {
        res.setHeader('content-type', 'application/json');
        res.writeHead(200);
        res.end('y u no have access?');

        return;
      }

      req.db.getAuth(payload.team.id, afterTokenValidation, res, payload);
  });
}

var afterTokenValidation = function(res, deets, params) {

  if (deets === null) {
    res.setHeader('content-type', 'application/json');
    res.writeHead(200);
    res.end('y u no have access?');

    return;
  }

  switch (params.actions[0].name) {
    case 'showMore':
      params.db.getRequest(params.callback_id, handleShowMore, res, params);
      break;
    case 'picked':
      params.db.getRequest(params.callback_id, handleGifSelected, res, params);
      break;
    case 'abort':
      params.db.getRequest(params.callback_id, handleAbort, res, params);
      break;
    default:
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end(JSON.stringify(post));
  }
}

var newResponse = function(newRecord, startAt) {
  console.log('Generating new response');
  console.log('Record:', newRecord);
  console.log('StartAt:', startAt);

  var attachments = [];
  var count = 0;
  for (var x = startAt; x < newRecord.imgs.length; x++) {
    if (x > startAt + 1) {
      break;
    }
    attachments[count] = {
      title: 'Image' + (x+1-startAt),
      image_url: newRecord.imgs[x]
    }
    count++;
  }

  var actions = [];
  var lastAction = 1;
  for (var y = 1; y < attachments.length+1; y++) {
    actions[y] = {
      name: 'picked',
      text: 'Image ' + y,
      type: 'button',
      style: 'primary',
      value: startAt + y
    }
    lastAction = y;
  }

  var actionIdx = lastAction+1;
  var lastPage = false;
  var optionText = 'Select an image, get more, or cancel:';

  if (startAt + y < 10) {
    // This was the last page, don't show the 'Show More' button
    actions[actionIdx] = {
      name: 'showMore',
      text: 'Show me more',
      type: 'button',
      style: 'default',
      value: startAt + lastAction
    }
    actionIdx++;
  } else {
    lastPage = true;
    optionText = 'Select an image or cancel cause I\'m out of ideas:';
  }

  actions[actionIdx] = {
    name: 'abort',
    text: 'Cancel',
    type: 'button',
    style: 'danger',
    value: 'abort'
  }

  //build the buttons
  attachments[2] = {
    title: optionText,
    callback_id: newRecord.id,
    actions: actions
  }

  attachments[3] = {
    title: ' ',
    image_url: root_url + '/images/giphy_small.png'
  }

  var msg = {
    text: 'One of these okay?',
    response_type: 'ephemeral',
    attachments: attachments
  }

  return JSON.stringify(msg);
}

var handleAbort = function(res, deets, params) {
  var msg = {
    text: 'Nothing to see here...'
  }

  res.setHeader('content-type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify(msg));

  params.db.deleteRequest(deets.id);
}

var handleShowMore = function(res, deets, params) {
  // call newresponse with appropriate startAt
  var msg = newResponse(deets, parseInt(params.actions[0].value));

  res.setHeader('content-type', 'application/json');
  res.writeHead(200);
  res.end(msg);
}

var handleGifSelected = function(res, deets, params) {
  // respond with an actual post of the gif (with powered by giphy)
  var gif = deets.imgs[parseInt(params.actions[0].value)-1];

  var msg = {
    attachments: [
      { title: ' ',
        image_url: gif}
    ]
  }
  // respond with nothing
  res.setHeader('content-type', 'application/json');
  res.writeHead(200);
  res.end('Coming right up!');

  params.msg = msg;
  params.terms = deets.terms;

  params.msg_text = '<@' + params.user.id + '> gifs a damn about "' + params.terms +'"';

  var withTeamId = function(res, auth_obj, params) {
    var web = new WebClient(auth_obj.bot.bot_access_token);
    web.chat.postMessage(params.channel.id, params.msg_text, params.msg);
    params.db.deleteRequest(deets.id);
  };

  params.db.getAuth(params.team.id, withTeamId, res, params);
}

module.exports = {
  handleAction: handleAction,
  newResponse: newResponse,
  handleShowMore: handleShowMore,
  handleGifSelected: handleGifSelected
};