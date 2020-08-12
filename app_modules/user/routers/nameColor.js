/*
  nameColor
   - the color the username has for all users in the comment section
   - color doesnt change afterwards;
      (the username regarding a comment has always the color at the time the comment was send)
  get
   - sends a string with the current color of [the users name in the comment section]
  set/post
   - stores the new name color of the accessing user
*/

let express = require('express');
let router = express.Router();
let getCurrentUsername = require("../getCurrentUsername.js").getCurrentUsername;
let getUser = require("../user.js").getUser;
let updateObjectInCollection = require("../../mongoDB_CustomFunctions/mongoDB_customFunctions.js").updateObjectInCollection;
let timeLogging = require('../../logging/timeLogging.js');

// sends a string with the current color of [the users name in the comment section]
router.get('/', function(req, res) {
	// get user object to then send the color setting
	getUser(getCurrentUsername(req)).then(function(user) {
		if (user && user.nameColor) {
			res.send(user.nameColor);
		} else {
			res.send("error at getting the color data from server");
		}
	});

});

// stores the new name color of the accessing user
router.post("/", function(req, res) {
	let username = getCurrentUsername(req);
	let query = {
		"username": username
	};
	if(!updateObjectInCollection("Users",  { $set: { "nameColor": req.body.nameColor } }, query)) {
		timeLogging("nameColor.js-post: Error at setting color: " + req.body.nameColor + " for username: " + username);
	}
	res.end();
});

module.exports = router;
