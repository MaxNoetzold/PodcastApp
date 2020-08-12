/*
	Podcasts Module
		to
		- see all podcasts (metadata)
		- edit podcasts metadata
		- create metadata for new podcasts
		- TODO: fully automate upload and creation of podcasts
*/


let router = require('express').Router();

let createPodcast = require('../../../app_modules/podcasts/podcasts.js').createPodcast;
let editPodcast = require('../../../app_modules/podcasts/podcasts.js').editPodcast;
let getPodcastsByCategory = require('../../../app_modules/podcasts/podcasts.js').getPodcastsByCategory;
let getPodcastByID = require('../../../app_modules/podcasts/podcasts.js').getPodcastByID;


/*
  podcastsPage
  - returns a string that is the whole "Podcasts" admin page
    so that the client router can render it
*/
router.get('/podcastsPage', function(req, res) {
		let podcastsPage = "<h1>Podcasts</h1>";

		// button to open the "New Podcast" Popup
		podcastsPage += "<button onclick='openNewPodcastPopup()'>New Podcast</button>"
		// header of the popup
		podcastsPage += "<div class='modal' id='newPodcast' style='display:none;'><div class='modal-content'><div class='modal-header'><span class='close' id='newPodcastClose'>×</span><h2>New Podcast</h2></div>"
		// errorDisplay
		podcastsPage += "<div class='modal-body'><p class='errorDisplay' id='newPodcastErrorDisplay'></p>"
		// input fields
		podcastsPage += "<div class='form'><input id='newPodTitle' type='text' placeholder='Title'>"
		podcastsPage += "<input id='newPodCategory' type='text' placeholder='Category'>"
		podcastsPage += "<input id='newPodDate' type='text' placeholder='Date'>"
		podcastsPage += "<input id='newPodManifestID' type='text' placeholder='Manifest ID'>"
		podcastsPage += "<input id='newPodSize' type='text' placeholder='Size in MB'>"
		podcastsPage += "<input id='newPodLength' type='text' placeholder='Length in seconds'>"
		// save button and end of the popup
		podcastsPage += "<a class='button' onclick='saveNewPodcast()'>Create Podcast</a></div></div></div></div>";

		// "Edit Podcast" Popup; nearly the same as the "New Podcast" Popup
		podcastsPage += "<div class='modal' id='editPodcast' style='display:none;'><div class='modal-content'><div class='modal-header'><span class='close' id='editPodcastClose'>×</span><h2>Edit Podcast</h2></div><div class='modal-body'><p class='errorDisplay' id='editPodcastErrorDisplay'></p><div class='form'><input id='editPodTitle' type='text' placeholder='Title'><input id='editPodCategory' type='text' placeholder='Category'><input id='editPodDate' type='text' placeholder='Date'><input id='editPodManifestID' type='text' placeholder='Manifest ID'><input id='editPodSize' type='text' placeholder='Size in MB'><input id='editPodLength' type='text' placeholder='Length in seconds'><a class='button' onclick='editPodcast()'>Edit Podcast</a></div></div></div></div>";
		// table with all podcasts
		getPodcastsByCategory(null, ['admin']).then(podcasts => {
			// table head: Title | Category | Date | Mainfest ID | Size in MB | Length in seconds | Filter Bubbles | Edit (button)
			podcastsPage += "<div style='overflow-x:auto;'><table><tr><th>Title</th><th>Category</th><th>Date</th><th>Manifest ID</th><th>Size in MB</th><th>Length in Seconds</th><th>Filter Bubbles</th><th>Edit</th></tr>"

			// add a table row for every podcast
			for (let i = 0; i < podcasts.length; i++) {
				podcastsPage += "<tr><td>" + podcasts[i].title + "</td><td>" + podcasts[i].category + "</td><td>" + podcasts[i].date + "</td><td>" + podcasts[i].manifestID + "</td><td>" + podcasts[i].size + "</td><td>" + podcasts[i].length + "</td><td>" + podcasts[i].filterBubbles + "</td><td><button onclick='openEditPodPopup(\"" + podcasts[i].manifestID + "\")'>Edit Podcast</button></tr>"
			}
			podcastsPage += "</table></div>";

			res.send(podcastsPage)
		});
});

router.post('/saveNewPodcast', function(req, res) {
	if (!req.body || req.body === null) {
		res.status(500).send("No information body found!")
		return;
	}

	createPodcast(req.body).then(response => {
		if (response) {
			res.send("Podcast created!");
		} else if (response === null) {
			res.status(409).send("manifestID already in use!");
		} else {
			res.status(500).send("Podcast creation failed!");
		}
	});
});

router.post('/editPodcast', function(req, res) {
	if (!req.body || req.body === null) {
		res.status(500).send("No information body found!")
		return;
	}

	editPodcast(req.body).then(response => {
		if (response) {
			res.send("Podcast edited!");
		} else {
			res.status(500).send("Podcast could not be edited!");
		}
	});
});

router.get('/getPodcast', function(req, res) {
	// decode the uri to be able to use utf8 characters (e.g. ü,ä,ö)
	let query = decodeURI(req._parsedOriginalUrl.query);
  let id = query.split("=")[1];

	getPodcastByID(id, ['admin']).then(response => {
		if (response) {
			res.send(response);
		} else {
			res.status(404).send("No Podcast found with this category!");
		}
	});
});

module.exports = router;
