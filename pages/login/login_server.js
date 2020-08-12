let router = require('express').Router();
let passport = require('passport');
let timeLogging = require('../../app_modules/logging/timeLogging.js');

// handles the login trials of the client
// checks with passport if login is accepted; if not send error message
router.post('/', function(req, res, next) {
	//console.log(req.body);
	passport.authenticate('login', (err, user, info) => {
		if (err) {
			timeLogging("Error at Login: " + err, req);
		}
		// only undefined if error occured
    // send error message to client to display it there
		if (info != undefined) {
			timeLogging("Login info: " + info.message, req);
			res.send(info.message);
			if (err) {
				return;
			}
		}
		else {
			req.login(user, function(err) {
				if (err) { return next(err); }
				return res.send('/');
			});
		}
	})(req, res, next);
});

// sends rendered login page to client
router.get('/', function(req, res, next) {
  res.render("pages/login/login.pug", { title: "Login" });
});

module.exports = router;
