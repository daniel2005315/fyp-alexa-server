'use strict';

var AlexaAppServer = require("alexa-app-server");
var sentiment_Analyser = require("./process/sAnalyse.js");
var entityClassifier = require("./process/entityTrain.js");
var database = require("./db/database.js");



var server = new AlexaAppServer({
  server_root: './',
  httpsEnabled: true,
  port: process.env.PORT||8080,

});



// Set up the data before server starts
entityClassifier.init();

// Testing on database promise
database.connect().then(function(result){
  var status;
  console.log("Progmise returned by resolved"+result);
  if(result){
    status='online';
  }
  else {
    status='offline';
  }
  console.log("Database is: "+status);
});

// Test the training feature
//entityClassifier.addToTraining(coffee,'coffee');

server.start();
// test express routing
server.express.use('/input', function(req,res){
  var score = sentiment_Analyser(req,res);
  res.json(score);
})
