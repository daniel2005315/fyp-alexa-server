// Small program to test on DB operations

var model = require('./db/model.js');

require('./db/database.js');
console.log("Test the Database access");

// Helper function for date format
Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

// for getting date as yyyymmdd format
var date = new Date();

async function runTest(){
  try{
    let token = await model.findUserByEmail("daniel2005315@gmail.com");
    console.log(token);
    if(token==null){
      console.log("creating user");
      let result = await model.addUser("daniel2005315@gmail.com",101);
    }

    // Get record and check Date
    // try create record
    let record = await model.findUserDailyRecord(date.yyyymmdd());
    if(record==null){
      console.log("Create record");
      let result = await model.createDailyRecord(101,date.yyyymmdd());
      console.log(result);
    }
  }catch(err){
    console.log(err);
  }
}

runTest();
