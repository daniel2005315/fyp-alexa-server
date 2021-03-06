var async = require('async');
var fs = require('fs');
var path = require('path');

// File paths
var AFINN_PATH = path.resolve(__dirname, 'AFINN-en-165.txt');
var EMOJI_PATH = path.resolve(__dirname, 'Emoji_Sentiment_Data_v1.0.csv');
var RESULT_PATH = path.resolve(__dirname, 'build.json');

// Customize Chinese list
var CHINESE_PATH = path.resolve(__dirname, 'CHINESE_TRAD.txt');

/**
 * Read emoji data from original format (CSV).
 * @param  {object}   hash     Result hash
 * @param  {Function} callback Callback
 * @return {void}
 */
function processEmoji(hash, callback) {
    // Read file
    fs.readFile(EMOJI_PATH, 'utf8', function (err, data) {
        if (err) return callback(err);

        // Split data by new line
        data = data.split(/\n/);

        // Iterate over dataset and add to hash
        for (var i in data) {
            var line = data[i].split(',');

            // Validate line
            if (i == 0) continue;               // Label
            if (line.length !== 9) continue;    // Invalid

            // Establish sentiment value
            var emoji = String.fromCodePoint(line[1]);
            var occurences = line[2];
            var negCount = line[4];
            var posCount = line[6];
            var score = (posCount / occurences) - (negCount / occurences);
            var sentiment = Math.floor(5 * score);

            // Validate score
            if (Number.isNaN(sentiment)) continue;
            if (sentiment === 0) continue;

            // Add to hash
            hash[emoji] = sentiment;
        }

        callback(null, hash);
    });
}

/**
 * Read AFINN data from original format (TSV).
 * @param  {object}   hash     Result hash
 * @param  {Function} callback Callback
 * @return {void}
 */
function processAFINN(hash, callback) {
    // Read file
    fs.readFile(AFINN_PATH, 'utf8', function (err, data) {
        if (err) return callback(err);

        // Split data by new line
        data = data.split(/\n/);

        // Iterate over dataset and add to hash
        for (var i in data) {
            var line = data[i].split(/\t/);

            // Validate line
            if (line[0] === '') continue;

            // Add to hash
            hash[line[0]] = Number(line[1]);
        }

        callback(null, hash);
    });
}

/** Custom Function
 * Read CHINESE data from original format (TSV).
 * @param  {object}   hash     Result hash
 * @param  {Function} callback Callback
 * @return {void}
 */
function processCHINESE(hash, callback) {
    // Read file
    fs.readFile(CHINESE_PATH, 'utf8', function (err, data) {
        if (err) return callback(err);

        // Split data by new line
        data = data.split(/\n/);

        // Iterate over dataset and add to hash
        for (var i in data) {
            var line = data[i].split(/\t/);

            // Validate line
            if (line[0] === '') continue;

            // Add to hash
            hash[line[0]] = Number(line[1]);
        }

        callback(null, hash);
    });
}

/**
 * Write sentiment score hash to disk.
 * @param  {object}   hash     Result hash
 * @param  {Function} callback Callback
 * @return {void}
 */
function finish(hash, callback) {
    var result = JSON.stringify(hash, null, 4);
    fs.writeFile(RESULT_PATH, result, function (err) {
        if (err) return callback(err);
        callback(null, hash);
    });
}

// Execute build process
async.waterfall([
    function (cb) {
        cb(null, {});
    },
    processEmoji,
    processAFINN,
    processCHINESE,
    finish
], function(err, result) {
    if (err) throw new Error(err);
    process.stderr.write(
        'Complete: ' +
        Object.keys(result).length +
        ' entries.\n'
    );
});
