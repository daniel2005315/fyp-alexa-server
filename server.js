'use strict';

var AlexaAppServer = require("alexa-app-server");
var sentiment_Analyser = require("./process/sAnalyse.js");
var entityClassifier = require("./process/entityTrain.js");
// var database =
var handler = require("./process/webhook.js");

var server = new AlexaAppServer({
  server_root: './',
  httpsEnabled: true,
  port: process.env.PORT||8080,

});

// Set up the data before server starts
// 19-2-2018 Disable the classifier
//entityClassifier.init();
require("./db/database.js");
// Testing on database promise
/*
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
*/

// Test the training feature
//entityClassifier.addToTraining(coffee,'coffee');


server.start();
// ask user to login if not
// *** Google Oauth2 API Keys
// # Client ID: 115422974852-ppcqqt3s258bicmqgmk5nocdu4peo83f.apps.googleusercontent.com
// # Client Secret: m3cWBP3-uD3EjSf6lleyt96Z
// test express routing
server.express.use('/input', function(req,res){
  console.log(req);
  var score = sentiment_Analyser.getScore();
  res.json(score);
})

// 9-3-2018
// Webhook for daily status
server.express.post('/webhook', async function(req,res){
    // log request details
    //console.log(req);
    //console.log(req.body);
    //console.log("-------\n");
    //console.log(req.body.result);

    console.log("meta data************************8\n");
    console.log(req.body.result.metadata.intentName);
    var intent = req.body.result.metadata.intentName;

    // 10-3-2018 call intent handler
    let outputSpeech;
    try{
    outputSpeech= await handler.parse(intent, req);
    console.log(outputSpeech);
    }catch(err){
      console.log(err);
      outputSpeech='error';
    }
    return res.json({
        speech: outputSpeech,
        displayText: 'Nothing here',
        source: 'status-response'
    });
  }
);

// Movie details example
// themoviedb API Key: d4e6a3f439205ab8948c848ad64041fe
server.express.post('/moviedetails', function (req, res) {

    let movieToSearch = req.body.result && req.body.result.parameters && req.body.result.parameters.movie ? req.body.result.parameters.movie : 'The Godfather';
    let reqUrl = encodeURI('https://api.themoviedb.org/3/movie/550?api_key=d4e6a3f439205ab8948c848ad64041fe' + movieToSearch);
    http.get(reqUrl, (responseFromAPI) => {

        responseFromAPI.on('data', function (chunk) {
            let movie = JSON.parse(chunk)['data'];
            let dataToSend = movieToSearch === 'The Godfather' ? 'I don\'t have the required info on that. Here\'s some info on \'The Godfather\' instead.\n' : '';
            dataToSend += movie.name + ' is a ' + movie.stars + ' starer ' + movie.genre + ' movie, released in ' + movie.year + '. It was directed by ' + movie.director;

            return res.json({
                speech: dataToSend,
                displayText: dataToSend,
                source: 'get-movie-details'
            });

        });
    }, (error) => {
        return res.json({
            speech: 'Something went wrong!',
            displayText: 'Something went wrong!',
            source: 'get-movie-details'
        });
    });
});
