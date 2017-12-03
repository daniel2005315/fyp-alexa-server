//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)
var url = 'mongodb://myfriend:fypproject@ds127436.mlab.com:27436/fypserver';
//(Focus on This Variable)

module.exports = {
  // async function returning a promise
  connect: function(){
    return new Promise((resolve,reject)=>{
      MongoClient.connect(url, function (err, db) {
        if (err) {
          console.log('Unable to connect to the mongoDB server. Error:', err);
          reject(false);
        } else {
          console.log('Connection established to', url);
          // do some work here with the database.

          //Close connection
          db.close();
          resolve(true);
        }
      });

    });
  }
}
