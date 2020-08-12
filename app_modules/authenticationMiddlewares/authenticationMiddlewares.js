/*
  authentication Middlewares
   - three Middlewares for various authentication tests
   - checkAuthenticated (to be sure that user is logged in while accessing stuff)
   - checkNotAuthenticated (for possible redirect if user visits /login or /register while logged in)
   - checkAdmin (to check that user that accesses admin page is actually admin)
*/

let timeLogging = require('../logging/timeLogging.js');
let getUser = require('../user/user.js').getUser;
let getCurrentUsername = require("../user/getCurrentUsername.js").getCurrentUsername;


/*
	checkAuthenticated
	 - checks if user is authenticated (used on every page but /login, /logout, /register)
	 - if yes: nothing; if no: redirect to /login
*/
function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	return res.status(403).redirect('/login');
}


/*
	checkNotAuthenticated
	 - checks if user is already authenticated (used on /login and /register)
	 - if yes: redirect to main page; if no: nothing
*/
function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/');
	}
	return next();
}


/*
	checkAdmin
	 - checks if user is admin (used on all admin pages)
	 - if yes: nothing; if no: redirect to main page
*/
function checkAdmin(req, res, next) {
	return getUser(getCurrentUsername(req)).then(function(user) {
		if (user && user.admin === true) {
			return next();
		}
		return res.status(403).redirect('/');
	});
}

module.exports = { checkAuthenticated, checkNotAuthenticated, checkAdmin };
