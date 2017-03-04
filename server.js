var PORT=process.env.PORT || 3000;

var mongoDao = require('./MongoDao');
var authMan = require('./AuthMan');
var slashMan = require('./SlashMan');
var actionMan = require('./ActionMan');

//We need a function which handles requests and send response
//Lets use our dispatcher
function handleRequest(req, res){
    try {
        //log the request on console
        console.log(req.url);
        //Disptach
        dispatcher.dispatch(req, res);
    } catch(err) {
        console.log(err);
    }
}

var express        =        require("express");
var bodyParser     =        require("body-parser");
var app            =        express();

app.listen(PORT,function(){
  console.log("Started server!");
});

// I attach the DB to the req object so its available all over the place.
app.use(function(req,res,next){
    req.db = mongoDao;
    next();
});

// stuff in public folder is accessible directly from browser
app.use(express.static('public'));

// Might need to change these handlers
app.get("/slashy", function(req, res) {
    slashMan.handleSlashRequest(req, res);
});

app.post("/slashy", function(req, res) {
    slashMan.handleSlashRequest(req, res);
});

// These are for handling custom actions (pushing of buttons in interactive messages)
app.post("/action", function(req, res) {
	actionMan.handleAction(req, res);
});

app.get("/action", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got get Data');
});

// This just displays an html page with the link to install (with redirects, etc)
app.post("/install", function(req, res) {
    authMan.handleInstall(req,res);
});

app.get("/install", function(req, res) {
    authMan.handleInstall(req,res);
});

// Handles the response from slack after install attempt
app.get("/oauth", function(req, res) {
    authMan.handleOauth(req, res);
});

mongoDao.init();
