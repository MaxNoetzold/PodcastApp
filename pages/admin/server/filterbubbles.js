/*
	Filter Bubbles Admin Page Router
		to
		- add new Filter Bubbles
    - edit existent Filter Bubbles
    to specify which podcast categories are accessible for each user
*/


let router = require('express').Router();
let getFilterbubbles = require('../../../app_modules/filterbubbles/filterbubbles_functions.js').getFilterbubbles;
let getFilterbubble = require('../../../app_modules/filterbubbles/filterbubbles_functions.js').getFilterbubble;
let addFilterbubble = require('../../../app_modules/filterbubbles/filterbubbles_functions.js').addFilterbubble;
let editFilterbubble = require('../../../app_modules/filterbubbles/filterbubbles_functions.js').editFilterbubble;


/*
  filterbubblesPage
  - returns a string that is the whole "Filter Bubbles" admin page
    so that the client router can render it
*/
router.get('/filterbubblesPage', function(req, res) {
  let filterbubblesPage = "<h1>Filter Bubbles</h1>";

  // button to open the "New Filterbubble" Popup
  filterbubblesPage += "<button onclick='openNewFilterbubblePopup()'>New Filter Bubble</button>"
  // header of the popup
  filterbubblesPage += "<div class='modal' id='newFilterbubble' style='display:none;'><div class='modal-content'><div class='modal-header'><span class='close' id='newFilterbubbleClose'>×</span><h2>New Filter Bubble</h2></div>"
  // errorDisplay
  filterbubblesPage += "<div class='modal-body'><p class='errorDisplay' id='newFilterbubbleErrorDisplay'></p>"
  // input fields
  filterbubblesPage += "<div class='form'><input id='newFilterbubbleTitle' type='text' placeholder='Title'>"
  filterbubblesPage += "<input id='newFilterbubbleCategories' type='text' placeholder='Categories; separated by commas'>"
  // save button and end of the popup
  filterbubblesPage += "<a class='button' onclick='addNewFilterbubble()'>Create Filter Bubble</a></div></div></div></div>";

  // "Edit Filter Bubble" Popup; nearly the same as the "New Filter Bubble" Popup
  filterbubblesPage += "<div class='modal' id='editFilterbubble' style='display:none;'><div class='modal-content'><div class='modal-header'><span class='close' id='editFilterbubbleClose'>×</span><h2>Edit Filter Bubble</h2></div><div class='modal-body'><p class='errorDisplay' id='editFilterbubbleErrorDisplay'></p><div class='form'><input id='editFilterbubbleTitle' type='text' placeholder='Title' readonly><input id='editFilterbubbleCategories' type='text' placeholder='Categories; seperated by commas'><a class='button' onclick='editFilterbubble()'>Edit Filter Bubble</a></div></div></div></div>";
  // table with all filter bubbles
  getFilterbubbles().then(bubbles => {
    // table head: Title | Categories | Edit (button)
    filterbubblesPage += "<div style='overflow-x:auto;'><table><tr><th>Title</th><th>Categories</th><th>Edit</th></tr>"

    // add a table row for every podcast
    for (let i = 0; i < bubbles.length; i++) {
      filterbubblesPage += "<tr><td>" + bubbles[i].title + "</td><td>" + bubbles[i].categories + "</td><td><button onclick='openEditBubblePopup(\"" + bubbles[i].title + "\")'>Edit Filter Bubble</button></tr>"
    }
    filterbubblesPage += "</table></div>";

    res.send(filterbubblesPage)
  });
});


/*
  addFilterbubble
  - gets called when a new filterBubble gets created
  - adds filterBubble to collection FilterBubbles
  - adds filterBubble as metadata to every specified podcast
*/
router.post('/addFilterbubble', function(req, res) {
  if (!req.body || req.body === null) {
    res.status(500).send("No information body found!")
		return;
	}

  addFilterbubble(req.body).then(response => {
		if (response) {
			res.send("Filterbubble created!");
		} else if (response === null) {
			res.status(409).send("title already in use!");
		} else {
			res.status(500).send("Filterbubble creation failed!");
		}
  });
});


/*
  getFilterbubble
  - returns metadata of one filterBubble that was requested
*/
router.get('/getFilterbubble', function(req, res) {
  let query = decodeURI(req._parsedOriginalUrl.query);
  let title = query.split("=")[1];

  getFilterbubble(title).then(response => {
    if (response) {
			res.send(response);
		} else {
			res.status(404).send("No Filter Bubble found with this category!");
		}
  });
});


/*
  editFilterbubble
  - edits filterBubble in collection FilterBubbles
  - deletes filterBubble from all no more specified categories
  - adds filterBubble to new specified categories
*/
router.post('/editFilterbubble', function(req, res) {
  if (!req.body || req.body === null) {
    res.status(500).send("No information body found!")
		return;
	}
  editFilterbubble(req.body).then(response => {
		if (response) {
			res.send("Filterbubble edited!");
		} else {
			res.status(500).send("Edit of Filterbubble failed!");
		}
  });

})

module.exports = router;
