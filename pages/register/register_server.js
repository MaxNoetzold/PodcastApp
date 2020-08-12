let router = require('express').Router();
let passport = require('passport');
let generateUserdata = require('../../app_modules/user/userdata.js').generateUserdata;
let timeLogging = require('../../app_modules/logging/timeLogging.js');

/* handles the register trials of the client
    - checks with passport if user is predefined (= allowed to create an account),
    - generates needed userdata in mongoDB,
    - registers suer by hashing passport
    - if error: error gets send to client; else: redirect client to main page
*/
router.post('/', function(req, res, next) {
	passport.authenticate('register', (err, user, info) => {
		if (err) {
			timeLogging("Error at register: " + err, req);
		}
    // only undefined if error occured
    // send error message to client to display it there
		if (info != undefined) {
			timeLogging("Register info: " + info.message, req);
			res.send(info.message);
		} else {
			// generate userdata
			generateUserdata(user);
      // login user/create session for user and reditect client to main page if no error
			req.login(user, function(user, err) {
				if (err) { return next(err); }
				return res.send('/');
			});
		}
	})(req, res, next);
});

// sends rendered login page to client
router.get('/', function(req, res, next) {
  res.render("pages/register/register.pug", { title: "Register" });
});

module.exports = router;
