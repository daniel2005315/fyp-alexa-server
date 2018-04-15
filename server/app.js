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

	// TODO: does not work
	express.use('/alexa/myfriend',oauth2.required, (req, res, next) => {
	  console.log("Middleware check\n");
	});
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
  express.post('/webhook', function (req,res){
    // take req json
    console.log('[webhoook] Triggered')
    console.log(req);
    // TODO parse JSON for
    // 1. intent
    // 2. action
    // 3. param
  });


};
