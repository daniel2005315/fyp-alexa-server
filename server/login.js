var path = require('path');
module.exports = function(express,alexaAppServerObject) {

	// Add ejs as templating engine
	express.set('view.engine','ejs');
	express.set('views', path.join(__dirname, '../views'));
	//console.log(__dirname);
	express.use('/login',function(req,res) {
		res.render('login.ejs',{title:'Login Page'});
	});

	express.use('/chat', function(req,res){
		res.render('chat.ejs',{title:"Let's chat!"});
	})
};
