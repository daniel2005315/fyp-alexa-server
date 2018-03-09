'use strict';

var AlexaAppServer = require("alexa-app-server");
var sentiment_Analyser = require("./process/sAnalyse.js");
var entityClassifier = require("./process/entityTrain.js");
var database = require("./db/database.js");

// 6-2-2018
// Added for webhook with DialogFlow
var bodyParser = require('body-parser');


var server = new AlexaAppServer({
  server_root: './',
  httpsEnabled: true,
  port: process.env.PORT||8080,

});



// Set up the data before server starts
// 19-2-2018 Disable the classifier
//entityClassifier.init();

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

// 6-2-2018
server.express.use(bodyParser.urlencoded({extended:true}));
server.express.use(bodyParser.json());
// test express routing
server.express.use('/input', function(req,res){
  console.log(req);
  var score = sentiment_Analyser.getScore();
  res.json(score);
})

// 9-3-2018
// Webhook for daily status
server.express.post('/dailystatus', function(req,res){
    // log request details
    //console.log(req);
    console.log(req.body);
    return res.json({
        speech: 'Webhook triggered',
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
