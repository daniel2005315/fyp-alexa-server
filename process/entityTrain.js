//var fs = require('fs');
'use strict';
// For entity recognition
var fs = require('fs');
var natural = require('natural');
var classifier = new natural.BayesClassifier();

// training data location
const dataSets = './training/datasets/';

// Load in testing training data
//var sciMovies = require.main.require('./training/sciActionMovie.js');
// Test
//var coffee = require.main.require("./training/coffee.js");

module.exports = {
  init: function() {
    // Check if the classifier has been initialized
    fs.stat('./training/classifier.json', function(err, stat) {
      if(err == null) {
          console.log('File exists, load existing classifier');
          natural.BayesClassifier.load('./training/classifier.json', null, function(err, classifier) {
          //console.log(classifier.classify('StarWars'));
          console.log("Classifying ===> Dream on");
          console.log("\'Dream on\' belongs to : "+classifier.classify('Dream on'));
          var dream =classifier.getClassifications('Dream on');
          console.log(dream);
          console.log("Classifying ===> KISS");
          console.log("\'KISS\' belongs to: "+classifier.classify('KISS'));
          var kiss = classifier.getClassifications('KISS');
          console.log(kiss);
          //console.log("Classifying A cup of Americano  "+ classifier.classify('A cup of Americano'));
          });
      } else if(err.code == 'ENOENT') {
          // file does not exist
          // Init the data with data sets under ./training

          // Sync function to ensure all data loaded before server starts
          fs.readdirSync(dataSets).forEach(file => {
            console.log("Loading file =>"+file);
            var label = file.replace(/\.[^/.]+$/, "");
            console.log("Training entities into class ===>"+ label);
            var entries = fs.readFileSync(dataSets+file).toString().split("\n");
            for(var i in entries) {
                classifier.addDocument(entries[i], label);
            }
            classifier.train();
          });

          // Save the classifier
          classifier.save('./training/classifier.json', function(err, classifier) {
            console.log("Classifier has been saved");
          });


/*
          console.log('File does not exist, perform first testing training');
          classifier.addDocument(sciMovies, 'sci-fi action movie');
          classifier.addDocument(coffee, 'coffee');

          classifier.train();
          classifier.save('./training/classifier.json', function(err, classifier) {
          console.log("Classifier has been saved");
          });
          */
      } else {
          console.log('Some other error: ', err.code);
      }
    });

  },
// take in an entry of an array of entries, train it to be part of the "class"
addToTraining: function(input, classLabel) {
  console.log("Adding entry: "+input+" to the class = "+classLabel);
  natural.BayesClassifier.load('./training/classifier.json', null, function(err, classifier) {
    classifier.addDocument(input, classLabel);
    classifier.train();
    classifier.save('./training/classifier.json', function(err, classifier) {
      console.log("Classifier has been saved");
    });
  });
}

classify: function(input){
  natural.BayesClassifier.load('./training/classifier.json', null, function(err, classifier) {
    var output =classifier.getClassifications(input);
    console.log("classifying =>"+input+"... Result is->"+output);
    return output;
  });
}
}
