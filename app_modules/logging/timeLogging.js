/*
  Custom Logging Module
   - add the current time and user (if $req is specified) infront of the log $message
*/

let getCurrentUsername = require("../user/getCurrentUsername.js").getCurrentUsername;

function timeLogging(message, req = null) {
	var newDate = new Date();
  if (req) {
    console.log(newDate.today() + " @ " + newDate.timeNow() + " for user " + getCurrentUsername(req) + ": " + message);
  } else {
    console.log(newDate.today() + " @ " + newDate.timeNow() + ": " + message);
  }
}

module.exports = timeLogging;
