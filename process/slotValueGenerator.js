// module for generating the JSON list of sample values for a slot

'use strict';

var fs = require('fs');

fs.stat('./values.txt', function(err, stat) {
  if(err == null) {
      // read file
      console.log("Reading file sync");
      fs.readFile('./values.txt',(err,data)=>{
        console.log("Go in?");
        var lines = data.toString().split("\n");
        for(var index in lines){
          var content = "{\n\"id\":null,\n\"name\":{\n\"value\": \""+lines[index].replace(/(\n|\r)+$/, '')+"\",\n\"synonyms\": []\n}\n},";

          fs.appendFile('slot_sample.txt', content, function (err) {
            if (err) throw err;
            console.log('Saved!');
          });
        }

        //var content = "{\"id\":null, \"name\":{\"value\":\""+
        /* Template
        {
            "id": null,
            "name": {
              "value": "I like the new movie",
              "synonyms": []
            }
          },

        */
      });
  } else if(err.code == 'ENOENT') {
      // file does not exist
      console.log("file does not exist");
      // Init the data with data sets under ./training

      // Sync function to ensure all data loaded before server starts
      /*
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

      */
  } else {
      console.log('Some other error: ', err.code);
  }
});
