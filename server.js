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

app.use(function(req,res,next){
    req.db = mongoDao;
    next();
});

app.use(express.static('public'));

app.get("/delold", function(req, res) {
    mongoDao.deleteOldRequests();
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('SUCESS!!!!');
});

app.get("/slashy", function(req, res) {
    slashMan.handleSlashRequest(req, res);
});

app.post("/slashy", function(req, res) {
    slashMan.handleSlashRequest(req, res);
});


app.post("/action", function(req, res) {
	actionMan.handleAction(req, res);
});

app.get("/action", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Got get Data');
});

app.post("/install", function(req, res) {
    authMan.handleInstall(req,res);
});

app.get("/install", function(req, res) {
    authMan.handleInstall(req,res);
});

app.get("/oauth", function(req, res) {
    authMan.handleOauth(req, res);
});

mongoDao.init();
