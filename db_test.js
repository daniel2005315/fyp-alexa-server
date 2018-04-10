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
    let record = await model.findUserDailyRecord(101,date.yyyymmdd());
    if(record==null){
      console.log("Create record");
      let result = await model.createDailyRecord(101,date.yyyymmdd());
      console.log(result);
    }


    // Find and update user info
    let newuser = await model.updateUser(101,"username","Daniel");
    console.log(newuser);

    // Get user record for TODAY, if the record does not
    // exists, create it
    let user_obj = await model.getUserTodaysRecord(101);


  }catch(err){
    console.log(err);
  }
}
/*
// Return user object, with record object and user names
async function getUserRecord(accessToken,recordDate){
	let user = {
		"name":"",
		"record":{}
	};
	try{
    console.log("Get user record started->",accessToken);
		let record = await model.findUserDailyRecord(accessToken,recordDate);
    console.log(record);
    if(record==null){
			console.log("[checkDailyRecord] Create record for today");
			record = await model.createDailyRecord(accessToken,date.yyyymmdd());
		}
    user.record=record;
    user.name=record.owner.username;
    console.log("User");
    console.log(user);
    return user;
	}catch(err){
		console.log("[checkDailyRecord] error", err);
	}
}
*/
runTest();
