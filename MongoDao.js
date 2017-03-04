var mdb_user=process.env.DB_USER || 'dbusername';
var mdb_pass=process.env.DB_PASS || 'dbuserpasswd';
var mdb_port=process.env.DB_PORT || '33076';
var mdb_name=process.env.DB_NAME || 'gifadamn';
var mdb_url=process.env.DB_URL || 'ds033076.mlab.com';

var mongoUrl = 'mongodb://' + mdb_user + ':' + mdb_pass + '@' + mdb_url + ':' + mdb_port + '/' + mdb_name;

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var DB = null;

var createSummary = function(deets, action, index) {

}

var deleteRequest = function(id) {
  console.log('deleting id', id);
  var query = { 'id': id };
  DB.collection('requests').remove(query);
}

function insertDocument(obj, collection) {
   DB.collection(collection).insertOne(obj, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted an object into the " + collection + " collection.");
  });
}

module.exports = {

  init() {
    MongoClient.connect(mongoUrl, function(err, db) {
      assert.equal(null, err);
      console.log("Connected correctly to server.");
      DB = db;
    });
  },

  insertOauth(object) {
    insertDocument(object, 'authorization');
  },

  insertRequest(object) {
    insertDocument(object, 'requests');
  },

  getAuth(team_id, callback, res, params) {
      var query = { 'team_id': team_id };
      DB.collection('authorization').findOne(query, function(err, obj) {
        console.log('getRequest found obj', obj);
        callback(res, obj, params);
      });
  },


  getRequest(id, callback, res, params) {
      var query = { 'id': id };
      DB.collection('requests').findOne(query, function(err, obj) {
        console.log('getRequest found obj', obj);
        callback(res, obj, params);
      });
  },

  deleteOldRequests() {
    var thirtySecondsOld = Date.now() - 30000;
    var query = { createTS: { $lt: thirtySecondsOld }};
    var objs = DB.collection('requests').find(query);

    var del_ids = [];
    objs.each(function(err, item) {
      if (item !== null) {
        console.log('item to delete', item);
        del_ids.push(item.id);
      }
    });

    del_ids.forEach(function(id) {
      deleteRequest(id);
    });
  },

  deleteRequest: deleteRequest,
  createSummary: createSummary
}