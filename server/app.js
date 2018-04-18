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
  express.post('/webhook', function (req,res){
    console.log('[webhoook] Triggered')
    var speech;
    var result=req.body.result;
    var param=result.parameters;
    // output context
    var context_array=[];
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
    // c.
    // 3. param
    // Body check webhook
    // b. body.problem => parameters:{symtom:string, body_part:string}
    if(result.action==="body.problem"){
      // Just for record, no further processing needed
      //speech=result.fulfillment.speech;
      // The above line works
      speech="body problem";
    }

    console.log("[webhook] sending speech and context array:");
    context_array=context_array.concat({
      "name": context_name,
      "lifespan": 1
    });

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
