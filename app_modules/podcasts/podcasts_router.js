/*
  Podcasts Metadata are saved together with the DOM element that will be displayed on client,
  which is called "card"

  Send Podcasts and any needed information to user
  - /getLatestPodcastID
    - sends latest PodcastID so the client nows if he has to load new data
    - it may be more conveniet to safe for every user if new data was added since their last request
  - /getCards
    - sends all cards of a given category as an array
  - /getCard
    - sends one card element
  - /getManifestIDs
    - sends all manifestIDs of a given category as an array
    - so the user knows in which order the cards has to be loaded
*/

let router = require('express').Router();
let getUser = require('../user/user.js').getUser;
let getCurrentUsername = require("../user/getCurrentUsername.js").getCurrentUsername;
let getPodcastByID = require('./podcasts.js').getPodcastByID;
let getLatestPodcastIDByCategory = require('./podcasts.js').getLatestPodcastIDByCategory;
let getPodcastsByCategory = require('./podcasts.js').getPodcastsByCategory;

router.get('/getLatestPodcastID', function(req, res) {
  // decode the uri to be able to use utf8 characters (e.g. ü,ä,ö)
  let query = decodeURI(req._parsedOriginalUrl.query);
  let category = query.split("=")[1];

  getUser(getCurrentUsername(req)).then(user => {
    if (user) {
      getLatestPodcastIDByCategory(category, user.filterBubbles).then(response => {
        if (response) {
          res.send(response);
        } else {
          res.status(404).send("No Podcast found with this category!");
        }
      });
    } else {
      res.status(500).send("User not found!");
    }
  });
});

// sends all cards of a given category as an array
router.get('/getCards', function(req, res) {
	// decode the uri to be able to use utf8 characters (e.g. ü,ä,ö)
	let query = decodeURI(req._parsedOriginalUrl.query);
  let category = query.split("=")[1];

  // load all podcasts but only transmit the card and manifestID info
  getUser(getCurrentUsername(req)).then(user => {
    if (user) {
      getPodcastsByCategory(category, user.filterBubbles).then(podcasts => {
        // delete all data that is not necessary to send
        // (but without using the delete keyword in case the structure of the element changes in the future)
        podcasts.forEach((podcast, index) => {
          let temp = {
            manifestID: podcast.manifestID,
            card: podcast.card
          };
          podcasts[index] = temp;
        });
        res.json(podcasts);
      });
    } else {
      res.status(500).send("User not found!");
    }
  });
});

// sends one card element
router.get('/getCard', function(req, res) {
  // decode the uri to be able to use utf8 characters (e.g. ü,ä,ö)
  let query = decodeURI(req._parsedOriginalUrl.query);
  let id = query.split("=")[1];

  getUser(getCurrentUsername(req)).then(user => {
    if (user) {
      getPodcastByID(id, user.filterBubbles).then(response => {
        if (response) {
          res.send(response.card);
        } else {
          res.status(404).send("No Podcast found with this category!");
        }
      });
    } else {
      res.status(500).send("User not found!");
    }
  });
});

// sends all manifestIDs of a given category as an array
router.get('/getManifestIDs', function(req, res) {
	// decode the uri to be able to use utf8 characters (e.g. ü,ä,ö)
	let query = decodeURI(req._parsedOriginalUrl.query);
  let category = query.split("=")[1];

  getUser(getCurrentUsername(req)).then(user => {
    if (user) {
      // load all podcasts but only transmit the manifestID info
      getPodcastsByCategory(category, user.filterBubbles).then(podcasts => {
        let manifestIDs = []
        podcasts.forEach(podcast => {
          manifestIDs.push(podcast.manifestID);
        });
        res.json(manifestIDs);
      });
    } else {
      res.status(500).send("User not found!");
    }
  });
});

module.exports = router;
