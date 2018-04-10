'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

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


var UserSchema = Schema({
  username: { type: String, required: false, unique: true },
  email: { type: String, unique: true, required: true },
  gender:{type:String,required:false},
  // indiate elder/norm user
  usr_type:{type:String, default:'norm'},
  access_token:{type:Number,unique:true,required:true},


});

// 9-4-2018
// Status schema to be included in Record
var StatusSchema = Schema({
  // sentiment score
  mental:{type:Number, default:0},
  // score from memory questions
  memory:{type:Number, default:0},
  // score for body condition / comfortable or not
  // range -3 ~ 3
  body:{type:Number, default:0}
  // ... May be expanded further
});

// Daily record of the user
var RecordSchema = Schema({
  owner: {type: ObjectId, required:true, ref:'User'},
  // Use String instead, for easy query
  date:{type:String, default: date.yyyymmdd()},
  count:{type:Number, default:0},
  avg_sentiment_score:{type:Number,default:0},
  // array of status object
  status:[StatusSchema]
});




var ItemSchema = Schema({
  owner: { type: ObjectId, ref: 'User' },
  description: { type: String, default: '' },
  createdOn: { type: Date, default: Date.now },
  tags: [ { type: String } ]
});

var User = mongoose.model('User', UserSchema);
var Record = mongoose.model('Record', RecordSchema);
var Status = mongoose.model('Status',StatusSchema);
var Item = mongoose.model('Item', ItemSchema);


class PaginationData {
  constructor (props) {
    if (props === undefined)
      return;

    for (let key in props) {
      this[key] = props[key];
    }
  }

  validate() { // Ensure all required properties have a value.
    let requiredProperties =
      [ 'pageCount', 'pageSize', 'currentPage', 'items', 'params' ];
    for (let p of requiredProperties) {
      if (this[p] === undefined) {
        console.error(this, `Property '${p}' is undefined.`);
      }
    }
  }
}

// Place holder. The parameter orderBy is not used in this example.
async function getItems(page, orderBy, order) {

  // Determine the sorting order
  // In this example, orderBy == 1 => order by 'createdOn'
  orderBy = orderBy || 1;   // Default to 1
  order = (order == 1 || order == -1) ? order : 1;

  let pData = new PaginationData( {
     pageSize: 10,
     params: {
       orderBy: orderBy,
       order: order
     }
  });

  let condition = {};   // Retrieve all items

  let itemCount = await Item.count(condition);

  pData.pageCount = Math.ceil(itemCount / pData.pageSize);

  // Ensure the current page number is between 1 and pData.pageCount
  page = (!page || page <= 0) ? 1 : page;
  page = (page >= pData.pageCount) ? pData.pageCount : page;
  pData.currentPage = page;

  // Construct parameter for sorting
  let sortParam = {};
  if (orderBy == 1)
    sortParam = { createdOn: order };

  // ----- Construct query and retrieve items from DB -----
  // Construct query

  pData.items = await Item.
    find(condition).
    skip(pData.pageSize * (pData.currentPage-1)).
    limit(pData.pageSize).
    sort(sortParam).
    exec();

  pData.validate(); // Make sure all required properties exist.

  return pData;
}

async function getItem(id) {
  let _id = new mongoose.Types.ObjectId(id);
  let result = await Item.
    findOne( {_id: _id} ).
    populate('owner', 'username'). // only return the owner's username
    exec();
  return result;
}

// Find if the user exists
// Uniquely identify an user by accessToken
async function getUserName(access_token) {
  let result = await User.
    findOne( {access_token: access_token} ).
    exec();
  return result.username;
}

async function getUserID(access_token) {
  try{
    console.log("Finding with ",access_token);
    let result = await User.
      findOne( {
        "access_token": access_token,
      } ).
      exec();
    console.log(result);
    return result._id;
  }catch(err){
    console.log("[getUserID]err ",err);
  }

}
// Find if user exists by token
async function findUser(access_token){
  try{
    let result = await User.
      findOne( {
        "access_token": access_token,
      } ).
      exec();
    return result;
  }catch(err){
    console.log("[findUser] err ",err);
  }
}

// Find if the user exists by Email
// Return the access_token of user
async function findUserByEmail(email) {
  let result = await User.
    findOne( {"email": email} ).exec();
     // return the token

  return result.access_token;
}


// Update user info
async function updateUser(access_token, fieldname, value){
  var updateparam = {};
  updateparam[fieldname] = value;
  let result = await User.
    findOneAndUpdate({"access_token": access_token},
      {$set:updateparam},{new:true}).exec();
  return result;
}

// Find user's record of the day
// populate result with user info
async function findUserDailyRecord(access_token,yyyymmdd) {
  try{
    let userID = await getUserID(access_token);
    let result = await Record.
      findOne( {
        "owner": userID,
        "date": yyyymmdd
      } ).populate('owner').
      exec();
      console.log("[findUserDailyRecord]");
      console.log(result);
    return result;
  }catch(err){
    console.log("[findUserDailyRecord] err ",err);
  }
}

// TODO
// populate result with user info
async function createDailyRecord(access_token,yyyymmdd) {
  try{
    let user = await findUser(access_token);
    console.log(user);
    var record= new Record({
      owner: user._id,
      count:0,
      avg_sentiment_score:0,
      status:[new Status()]
    });
    // TODO: may not work
    let result = await record.save();
    result.owner=user;
    console.log("CHECK***");
    console.log(result);

    return result;
  }catch(err){
    console.log(err);
    return -1;
  }
}

// Return user object, with record object and user names
async function getUserTodaysRecord(accessToken){
	let user = {
		"name":"",
		"record":{}
	};
	try{
    console.log("Get user record started->",accessToken);
		let record = await findUserDailyRecord(accessToken,date.yyyymmdd());
    console.log(record);
    if(record==null){
			console.log("[checkDailyRecord] Create record for today");
			record = await createDailyRecord(accessToken,date.yyyymmdd());
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


// Place holder for authentication
function authenticate(username, password) {

  return (username === 'john' && password === '123');
}

// Add new entry for user
async function addUser(email, access_token){

  var user= new User({
    email: email,
    access_token:access_token
  });

  try{
    let result = await user.save();
    console.log(result);
    return result;
  }catch(err){
    console.log(err);
    return false;
  }
}

module.exports = {
  User: User,
  Record: Record,
  Item: Item,
  authenticate: authenticate,
  getItems: getItems,
  getItem: getItem,
  findUser: findUser,
  getUserName: getUserName,
  findUserByEmail: findUserByEmail,
  updateUser: updateUser,
  findUserDailyRecord: findUserDailyRecord,
  createDailyRecord: createDailyRecord,
  getUserTodaysRecord: getUserTodaysRecord,
  addUser: addUser
}
