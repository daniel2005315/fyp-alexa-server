var alexa = require('alexa-app');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;

// Define an alexa-app
var app = new alexa.app('google_it');
app.launch(function(req, res) {
  res.say("What you want me to do?");
});

app.intent('GoogleItForMe', {
  "slots": { "SearchItem": "LITERAL" },
  "utterances": ["{Search for|Google|I want to know about} {Alexa|Latest Movies|Weather|Nearest clinic|Jokes}"]
}, function(req, res) {
  res.say('Your want to search about ' + req.slot('SearchItem'));
});

module.exports = app;
