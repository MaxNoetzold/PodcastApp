/*
  podcastTimers
   - progress of an user for a podcast episode
   - is an array of all progresses of all ever started podcasts
  get
    - sends all podcastTimers of accessing user
  set/post
    - changes stored podcastTimers of accessing user if stored data is older
*/

let express = require('express');
let router = express.Router();
let getUserdata = require("../userdata.js").getUserdata;
let setUserdata = require("../userdata.js").setUserdata;
let generateUserdata = require("../userdata.js").generateUserdata;

// sends all podcastTimers of accessing user
router.get('/', function(req, res, next) {
	// to be sure that username is defined
	if (!req.session.passport.user.username) {
		return next();
	}
	let username = req.session.passport.user.username;

	getUserdata(username, "PodcastTimers").then(function (result) {
		if (!result || result === null) {
			// on error we return dummy variables that will never result in overwriting of the clients data
			return res.json('{"lastModified":1,"timers":[]}');
		}
		return res.json(result.PodcastTimers);
	});
});

// changes stored podcastTimers of accessing user if stored data is older
router.post('/', function(req, res, next) {
	// to be sure that username is defined
	if (!req.session.passport.user.username) {
		return next();
	}
	let username = req.session.passport.user.username;

	// check that the new data is (probably) valid
	if (!req.body.lastModified || req.body.lastModified === null) {
		return res.send("Data not valid");
	}
	getUserdata(username, "PodcastTimers").then(function(result) {
		if (!result || result === null) {
			// no data on server -> insert new data
			generateUserdata(req.session.passport.user, req.body);
			return res.send("Userdata generated");
		}
		timersList = result.PodcastTimers;

		// test if server version is newer (not possible i think)
		if (timersList.lastModified > req.body.lastModified) {
			return res.send("Server data newer");
		}

		setUserdata(username, "PodcastTimers", req.body);

		res.send("Userdata updated");
	});
});

module.exports = router;
