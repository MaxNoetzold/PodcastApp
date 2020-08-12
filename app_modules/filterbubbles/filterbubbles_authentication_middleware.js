/*
  Filter Bubbles Authentication Module
  - test for each podcast fragment if user is allowed to access it
*/


let getUser = require('../user/user.js').getUser;
let getCurrentUsername = require("../user/getCurrentUsername.js").getCurrentUsername;
let getFilterbubblesForManifestID = require('./filterbubbles_functions.js').getFilterbubblesForManifestID;

function filterbubbleAuthentication(req, res, next) {
  return getUser(getCurrentUsername(req)).then(user => {
    if (user) {
      // get filterbubbles for manifestID
      // manifestID := req.url.split('/')[2].split('-')[0]
      //  -> req.url.split('/')[2] is enough for non ios, but ios has -hls in the link there;
      //     so we just split it and it doesnt matter if its there or not
      return getFilterbubblesForManifestID(req.url.split('/')[2].split('-')[0]).then(bubbles => {
        // go through each allowed bubble and test if it exists in the users filterbubble list as well
        // if one exists its authenticated; if none exist send: 403 (forbidden)
        for (let i = 0; i < bubbles.length; i++) {
          if (user.filterBubbles.indexOf(bubbles[i]) > -1) {
            return next();
          }
        }
        return res.status(403).end();
      });
    } else {
      // if user not found send error 401 (unauthorized (which means unauthenticated))
      return res.status(401).end();
    }
	});
}

module.exports = { filterbubbleAuthentication };
