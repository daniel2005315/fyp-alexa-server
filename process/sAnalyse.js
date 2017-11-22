var sentiment = require.main.require('./process/sentiment');

// hard code input
//var input = "Today is a sunny day, it will be okay, Good :D";

module.exports = {
  getScore: function(input) {
    console.log("Analysing sentiment");
    var result = sentiment(input);
    // The result is in JSON with the following fields
    // score: int
    // comparative: double
    // tokens: array
    // words: array
    // positive: array
    // negative: array

    console.dir(result);
    return result.score;
  },
  getCompar: function(input) {
    console.log("Analysing sentiment");
    var result = sentiment(input);
    // The result is in JSON with the following fields
    // score: int
    // comparative: double
    // tokens: array
    // words: array
    // positive: array
    // negative: array

    console.dir(result);
    return result.comparative;
  }
}
