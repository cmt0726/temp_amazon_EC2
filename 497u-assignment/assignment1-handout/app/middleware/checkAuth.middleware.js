const passport = require('passport');
const ddbGet = require('../dynamo/ddb_getitem.js');

const isAuthenticatedMiddleware = (req, res, next) => {
	console.log('middleware entered');
	if (req.isAuthenticated()) {
		console.log('user authenticated');
		return next();
	} else {
		console.log('user redirected');
		res.redirect('/user/login');
	}
};

const authenticateUserMiddleware = async (req,res) => {
	 passport.authenticate('local', { failureRedirect: '/user/login', failureMessage: true })(req, res, function(){
		res.redirect('/post');
	});
}

module.exports = {
	isAuthenticatedMiddleware,
	authenticateUserMiddleware,
};
