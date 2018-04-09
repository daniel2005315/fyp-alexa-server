'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
let ObjectId = Schema.Types.ObjectId;

var UserSchema = Schema({
  username: { type: String, required: false, unique: true },
  email: { type: String, unique: true, required: true },
  access_token:{type:Number,unique:true,required:true},
  password: { type: String, required: false }
});


var ItemSchema = Schema({
  owner: { type: ObjectId, ref: 'User' },
  description: { type: String, default: '' },
  createdOn: { type: Date, default: Date.now },
  tags: [ { type: String } ]
});

var User = mongoose.model('User', UserSchema);
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
async function findUser(access_token) {
  let result = await User.
    findOne( {access_token: access_token} ).
    populate('username'). // return the username
    exec();
  return result;
}

// Find if the user exists by Email
// Uniquely identify an user by accessToken
async function findUserByEmail(email) {
  let result = await User.
    findOne( {email: email} ).
    populate('access_token'). // return the token
    exec();
  return result;
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
  Item: Item,
  authenticate: authenticate,
  getItems: getItems,
  getItem: getItem,
  findUser: findUser,
  findUserByEmail: findUserByEmail,
  addUser: addUser
}
