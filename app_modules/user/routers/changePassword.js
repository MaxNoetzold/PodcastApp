/*
  - check that user exists
  - check that user has entered the correct old password
  - if both true: change saved password to new one
*/

let express = require('express');
let router = express.Router();
let bcrypt = require('bcrypt');
let getUser = require('../user.js').getUser;
let setUserPassword = require('../user.js').setUserPassword;
let timeLogging = require('../../logging/timeLogging.js');
let getCurrentUsername = require("../getCurrentUsername.js").getCurrentUsername;

const BCRYPT_SALT_ROUNDS = 12;

router.post('/', function(req, res, next) {
	let oldPassword = req.body.oldPassword;
	let newPassword = req.body.newPassword;
	let username = getCurrentUsername(req);

	try {
		getUser(username).then(function(user) {
      // just be sure that the user actually exists; should never happen that not
			if (!user || user == null) {
				return res.send("Username is not registered?!");
      }

			bcrypt.compare(oldPassword, user.password).then(response => {
        // check that old password has been correctly entered by user
				if (response !== true) {
					return res.send("The old password is wrong!");
				}
				// user found & correct old password -> change password to new one
				bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS).then(hashedPassword => {
					setUserPassword(username, hashedPassword).then(function(newUser) {
						if(!newUser) {
							return res.send("Server Error at password change!");
						}
						timeLogging('user ' +  username + ' changed its password');
						return res.send("Password successfully changed");
					});
				});
			});
		});
	} catch (err) {
		timeLogging("Error at changing password for username: " + username + " with error: " + err);
	}
});

module.exports = router;
