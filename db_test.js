// Small program to test on DB operations

var model = require('./db/model.js');

var request= require('request');

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

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
				console.log("[doRequest]res received");
        resolve(body);
      } else {
				console.log("Status code:"+res.statusCode);
				console.log("[doRequest]rejected, error=>"+error);
        reject(error);
      }
    });
  });
}

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

  var user_context={
    "lifespan": 3,
    "name": "message_info",
    "parameters": {
      "name": "Peter",
      "message": "Hello"
    }
  };

  // options
  options = {
    headers: {"Authorization": "Bearer d25cbadf552a43eba0ed4d4905e98858"},
      url: 'https://api.dialogflow.com/v1/query?v=20150910',
      method: 'POST',
      json:true,
      body: {
        "contexts":[user_context],
        "lang": "en",
        "sessionId": "12345",
        // init event, empty query
        "event":{"name": "line_message"}
      }
  };
  try{
    let res = await doRequest(options);
    console.log("response result=>\n");
    console.log(res.result);
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

async function updateDB2(){
  // try async update DB
  try{
    let result = await model.getUserTodaysRecord(101);
    console.log(result);
    console.log("async update started");
    model.updateUserDailyRecord(101,"count",0);
    console.log("*** this line will display first before the update completed");

    // update User to elderly

  }catch(err){
    console.log("err ",err );
  }
}

// update User to elderly
async function updateDB(){
  // try async update DB
  try{
    console.log("async update started");
    model.updateUserInfo(101,"usr_type","elder");
    console.log("*** this line will display first before the update completed");

  }catch(err){
    console.log("err ",err );
  }
}
// update User to elderly
async function updateDB(){
  // try async update DB
  try{
    console.log("async update started");
    model.updateUserInfo(101,"usr_type","elder");
    console.log("*** this line will display first before the update completed");

  }catch(err){
    console.log("err ",err );
  }
}

// populate result with user info
async function getUserContactsID(access_token) {
  let result = await model.getUserContactsID(access_token);
}

//runTest();
//updateDB2();
getUserContactsID("101ihave1nc3th5le1f5oeishahaline");
