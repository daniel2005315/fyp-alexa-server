// use pos to determine the part of speech
var pos = require('pos');
module.exports = {
  isNoun: function(input) {
    console.log("Checking if the word is a noun");
    var tagger = new pos.Tagger();
    var taggedWords = tagger.tag(input);
    for (i in taggedWords) {
      var taggedWord = taggedWords[i];
      var word = taggedWord[0];
      var tag = taggedWord[1];
      console.log(word + " /" + tag);
    }
    // The result is in JSON with the following fields
    // score: int
    // comparative: double
    // tokens: array
    // words: array
    // positive: array
    // negative: array
    var result = "true";
    return result;
  }
}
