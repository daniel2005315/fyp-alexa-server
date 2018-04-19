var path = require('path');

// Refactoring
// 6-2-2018
// Added for webhook with DialogFlow
var bodyParser = require('body-parser');
// 4-4-2018 Added session and Oauth related
const session = require('express-session');
//const MemcachedStore = require('connect-memcached')(session);
const passport = require('passport');
// 4-4-2018
// Added session checking for Google Account linking
const oauth2 = require('../auth/oauth2');

// for making post requests
var request= require('request');
// for making request to Ulala service
var ulala = require('./ulala.js');
// access Database
var model = require('../db/model.js');

// [Configure session and storage]
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  secret: "thisIsthesecretOnlyThewitchDoctorKnows",
  signed: true
};

module.exports = function(express,alexaAppServerObject) {

	// Add ejs as templating engine
	express.set('view.engine','ejs');
	express.set('views', path.join(__dirname, '../views'));

	// 4-4-2018 Refactoring
	// 6-2-2018
	express.use(bodyParser.urlencoded({extended:true}));
	express.use(bodyParser.json());
	express.use(session(sessionConfig));
	// Use oauth router
	express.use(passport.initialize());
	express.use(passport.session());
	express.use(oauth2.router);

  express.get('#',function(req,res) {
		res.render('login.ejs',{title:'Login Page'});
	});

  express.all('/',function(req,res) {
		res.render('login.ejs',{title:'Login Page'});
	});

	//express.use('/alexa/myfriend',oauth2.required, (req, res, next) => {
	//  console.log("Middleware check\n");
	//});
	//console.log(__dirname);
	express.use('/login',function(req,res) {
		res.render('login.ejs',{title:'Login Page'});
	});

	// DONE
	// Check for login before proceeding to chat page
	express.use('/chat', oauth2.required, (req, res, next) =>{
    // TODO Check
    res.locals.ptitle="Let's chat!";
    res.render('chat.ejs',{title:"Let's chat!"});

	})

  // TODO: webhook for fulfillment
  // The webhook will amend context out / speech
  // For certain situation
  express.post('/webhook', async function (req,res){
    console.log('[webhoook] Triggered')
    // getting session idicating the user
    var sessionId=req.body.sessionId;
    var speech;
    var result=req.body.result;
    var param=result.parameters;
    var contexts_in = result.contexts;
    // For db query
    var user_obj;
    // output context
    var context_array=[];
    // for storing message to send, if any
    var message_context;
    console.log(result);

    // Parse JSON for
    // Actions: Additional reasoning / API calls
    // Check what action is needed, it indicates what will be inside the parameters field
    // a. test.answer
    if(result.action==="elder.test1.answer"){
      console.log("[webhook] test ans check");
      var day = getDayofWeek();
      console.log("correct ans: ",day);
      var user_ans = param.date;
      console.log("user answer: ",user_ans);
      if(day.toLowerCase()===user_ans.toLowerCase()){
        speech="Great! You got it right! Now, let me ask you, have you taken your pills?";
        context_name="test2_start";
      }else{
        speech="No it's not. Look up the calender and try it again!";
        // output retry context
        context_name="test1_retry";
      }
    }
    if(result.action==="elder.test1.retry"){
      console.log("[webhook] test retry check");
      // check if the answer is correct
      var day = getDayofWeek();
      var context_name;
      console.log("correct ans: ",day);
      var user_ans = param.date;
      console.log("user answer: ",user_ans);
      if(day.toLowerCase()===user_ans.toLowerCase()){
        speech="Great! You got it right! Now, let me ask you, have you taken your pills?";
        context_name="test2_start";
      }else{
        speech="Actually, today is "+day+". Try to remember it, I'll ask you again tomorrow! Now, tell me if you have taken your pills?";
        context_name="test2_start";
      }
    }
    // b. body.problem => parameters:{symtom:string, body_part:string}
    if(result.action==="body.problem"){
      // Just for record, no further processing needed
      //speech=result.fulfillment.speech;
      // The above line works
      speech="body problem";
    }

    // TODO prompt for message
    if(result.action==="line.send"){
      var target_user;
      // TODO check if contact param is validate
      console.log("Search DB with user token: "+sessionId);
      try{
        user_obj= await model.findUser(sessionId);

        var contact = param.contact;
        // contact.relation  => look for exact relation in contact
        if(contact.relation!=null){
          console.log("[cotact.relation]runs")
          target_user = user_obj.contacts.find(function(entry){
            console.log("looking at entry:")
            console.log(entry);
            if(entry.relation===contact.relation){
              return entry._id;
            }

          });

        }else if(contact.given_name!=null){
          console.log("[cotact.given_name]runs")
          // TODO iterate each array entry to look for a match
          var name_query=contact.given_name;
          name_query=name_query.toLowerCase().trim();
          target_user = user_obj.contacts.find(function(entry){
            console.log("looking at entry:")
            console.log(entry);
            var found = entry.name.find(function(name){
              if(name.toLowerCase().trim()===name_query){
                return true;
              }
            });
            if(found===true){
              return entry._id;
            }
          });

        }
        // Target_user is the user's server id
        if(target_user!=null){
          let result = await model.findUser(target_user);

          // get user's lineID
          var lineID = result.lineID;
        }
        // contact.given_name   => look for name array in contact
        console.log("[line.send] Web hook got lindID->"+lineID);

        // TODO if valid, ask for message
        speech="What would you like to say?";
        context_name="line_send_message";
        message_context={
          "name": context_name,
          "parameters":{
          "target_line": lineID
          },
          "lifespan": 1
        };

      }catch(err){
        console.log(err);
      }

    }

    if(result.action==="action.line.send"){
      // get message lineId
      var message_target=contexts_in.find(function (obj) { return obj.name === 'line_send_message'; });
      var targetID = message_target.target_line;
      var message = param.message;

      console.log("result->",result);
      console.log("[action.line.send] Web hook sending message->"+message);
      console.log("to target=>"+targetID);

      try{
        // TODO send push message as required
        // include own name
        let source = await model.getUserName(sessionId);
        let result=await ulala.line_push(targetID,message,source);
        // TODO if successful, say success
        if(result){
          speech="Message sent";
          context_name="line_send_message_success";
        }else{
          speech="There was an error, please try again later";
          context_name="line_send_message_failed";
        }
      }catch(err){
        console.log(err);
      }


    }

    console.log("[webhook] sending speech and context array:");
    // For odinary context output
    context_array=context_array.concat({
      "name": context_name,
      "lifespan": 1
    });
    // concat message context if any
    if(message_context!=null){
      console.log("Binding message context:");
      console.log(message_context);
      context_array=context_array.concat(message_context);
    }

    // try setting response explicitly
    var response={
      // encode the response json here
      // It works when hard coded as "some string"
      "speech": speech,
      "displayText": speech,
      "messages": {
        "type": 1,
        "title": "card title",
        "subtitle": "card text",
        "imageUrl": "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png"
      },
      "contextOut": context_array,
      "source": "alexa-server-ck.com"
    }
    //res.setHeader('Content-Type', 'application/json');
    res.json(response);

  });


  // line Webhook
  // Line Channel ID: 1573527052
  // Line Channel secret: 4fa264670227e8b05095f879ed09d344
  // Access token (long lived): rnbw0w2L4LHCCHnRU07CjzH42oYYN7INtOpXoHqsSOJibHfhUpKI7UUN/t8xlZbLh8GqNefkYOtD5iFbvPLvDP3XyKPtmUdZWO2E4JWxhxNmIfSpNbjszL8uneB+eSEEmCmf9Th1KFFhKDSgQWHnKwdB04t89/1O/w1cDnyilFU=
  express.post('/line/webhook', async function(req,res){
    console.log("[line.webhook] Triggered");
    var event_arry = req.body.events;
    var event = event_arry[0];
    var user_id=event.source.userId;
    // Handle user linking (First time adding line bot as friend)
    if (event.type==='follow'){
      // User just added bot as friend
      // Start account linking processing
      console.log("[line] Start linking with user: "+user_id);
      // post request to obtain link token
      var url = "https://api.line.me/v2/bot/user/"+user_id+"/linkToken";
      // set header with channel access token
      var options = {
  			headers: {"Authorization": "Bearer rnbw0w2L4LHCCHnRU07CjzH42oYYN7INtOpXoHqsSOJibHfhUpKI7UUN/t8xlZbLh8GqNefkYOtD5iFbvPLvDP3XyKPtmUdZWO2E4JWxhxNmIfSpNbjszL8uneB+eSEEmCmf9Th1KFFhKDSgQWHnKwdB04t89/1O/w1cDnyilFU="},
  				url: url,
  				method: 'POST'
  		};
      let result = await doRequest(options);
      result=JSON.parse(result);
      var linkToken=result.linkToken;
      var login_uri="https://alexa-server-ck.herokuapp.com/auth/login?linkToken="+linkToken;
      console.log(login_uri);
      // reply user with link to login
      // TODO: code reuse, push message option
      options={
        	headers: {"Authorization": "Bearer rnbw0w2L4LHCCHnRU07CjzH42oYYN7INtOpXoHqsSOJibHfhUpKI7UUN/t8xlZbLh8GqNefkYOtD5iFbvPLvDP3XyKPtmUdZWO2E4JWxhxNmIfSpNbjszL8uneB+eSEEmCmf9Th1KFFhKDSgQWHnKwdB04t89/1O/w1cDnyilFU="},
          url: "https://api.line.me/v2/bot/message/push",
          method: 'POST',
          json:true,
          body:{
            "to": user_id,
            "messages": [{
                "type": "template",
                "altText": "Account Link",
                "template": {
                    "type": "buttons",
                    "text": "Account Link",
                    "actions": [{
                        "type": "uri",
                        "label": "Account Link",
                        "uri": login_uri
                    }]
                }
            }]
          }
      };
      // sending push message to ask user to link account
      result= await doRequest(options);
      console.log(result);

    }else{
      if(event.type==='message'){
        console.log("ready to reply the user");
        console.log(event);
        let reply = await ulala.line_request(event.source.userId,event.message.text);
        // TODO ############return reply to line
        console.log("Send reply");
        options={
          	headers: {"Authorization": "Bearer rnbw0w2L4LHCCHnRU07CjzH42oYYN7INtOpXoHqsSOJibHfhUpKI7UUN/t8xlZbLh8GqNefkYOtD5iFbvPLvDP3XyKPtmUdZWO2E4JWxhxNmIfSpNbjszL8uneB+eSEEmCmf9Th1KFFhKDSgQWHnKwdB04t89/1O/w1cDnyilFU="},
            url: "https://api.line.me/v2/bot/message/reply",
            method: 'POST',
            json:true,
            body:{
              "replyToken": event.replyToken,
              "messages": [{
                  "type": "text",
                  "text": reply
              }]
            }
        };
        result= await doRequest(options);
        console.log("Reply sent to line user");

      }
    }

    // bind line user id in database
    if(event.type==='accountLink'){
      var accessToken=event.link.nonce;
      var lineID=event.source.userId;
      console.log("binding lindID "+lineID+" with user access "+accessToken);
      let result = await model.updateUserInfo(accessToken,"lineID",lineID);
      console.log(result);
    }
    res.sendStatus(200);
  });

// making request
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

  function getDayofWeek(){
    var day;
    switch (new Date().getDay()) {
      case 0:
          day = "Sunday";
          break;
      case 1:
          day = "Monday";
          break;
      case 2:
          day = "Tuesday";
          break;
      case 3:
          day = "Wednesday";
          break;
      case 4:
          day = "Thursday";
          break;
      case 5:
          day = "Friday";
          break;
      case 6:
          day = "Saturday";
      }
      return day;
  }


};
