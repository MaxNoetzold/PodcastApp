// returns username of current logged-in/accessing user

function getCurrentUsername(req) {
	let username = "";
	if (req && req.session && req.session.passport && req.session.passport.user && req.session.passport.user.username) {
		username = req.session.passport.user.username;
	}
	return username;
}

module.exports = { getCurrentUsername }

// it would fit much better into the user.js module, but then I would get a
// circular dependency (user.js needs timeLogging.js, timeLogging.js needs user.js)
// which results in an error, this is why getCurrentUsername got an extra file
