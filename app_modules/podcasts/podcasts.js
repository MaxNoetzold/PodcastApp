/*
  Podcasts Function Module
  - getPodcastByID
  - getPodcastsByCategory | with no category: all podcasts
  - getLatestPodcastIDByCategory | with no category: all podcasts
  - createPodcast
  - editPodcast
*/

let insertObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').insertObjectInCollection;
let updateObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateObjectInCollection;
let getQueryForCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').getQueryForCollection;
let getFilterbubblesForCategory = require('../filterbubbles/filterbubbles_functions.js').getFilterbubblesForCategory;
const COLLECTIONNAME = "Podcasts"


function getPodcastByID(id, filterBubbles) {
  let query = {
    "manifestID": id,
    "filterBubbles": { $in: filterBubbles }
  };

  return getQueryForCollection(COLLECTIONNAME, query);
}

// if no category return all podcasts; sorted from latest to first
function getPodcastsByCategory(category, filterBubbles) {
  let query = {
    "filterBubbles": { $in: filterBubbles }
  };
  if (category) {
    query.category = category;
  }

  return getQueryForCollection(COLLECTIONNAME, query).then(response => {
    if (!response || response === null || response.length === 0) {
      return [];
    }
    //sort date, latest first
    return response.sort(function(a, b) {
      return b.date - a.date;
    });
  });
}

// if no category return latest ID of all podcasts
function getLatestPodcastIDByCategory(category, filterBubbles) {
  let query = {
    "filterBubbles": { $in: filterBubbles }
  };
  if (category) {
    query.category = category;
  }

  return getQueryForCollection(COLLECTIONNAME, query).then(response => {
    if (!response || response === null || response.length === 0) {
      return null;
    }

    //sort date, latest first
    response.sort(function(a, b) {
      return b.date - a.date;
    });

    //return id of latest podcast
    return response[0].manifestID;
  });
}

/*
  Functions only accessed by admin
   - createPodcast
   - editPodcast
*/
// create a podcast metadata in collection "Podcasts"
// and add DOM card element as new string field
function createPodcast(podcast) {
  let query = {
    "manifestID": podcast.manifestID
  };
  // test if podcast manifestID already exists
  // if yes: return null; else create podcast
  return getQueryForCollection(COLLECTIONNAME, query).then(response => {
    if (response && response.length > 0) {
      return null;
    }
    // add necessary information that gets generated/collected by the server
    // - html code of the belonging card
    // - filterbubbles
    podcast.card = generateCardFromPodcast(podcast);
    return getFilterbubblesForCategory(podcast.category).then(result => {
      podcast.filterBubbles = result;

      // insert the object into the Collection
      return insertObjectInCollection(COLLECTIONNAME, podcast).then(creationStatus => {
        return creationStatus;
      });
    });
  });
}

function editPodcast(podcast) {
  let query = {
    "manifestID": podcast.manifestID
  };

  // add necessary information that gets generated/collected by the server
  // - html code of the belonging card
  // - filterbubbles
  podcast.card = generateCardFromPodcast(podcast);
  return getFilterbubblesForCategory(podcast.category).then(result => {
    podcast.filterBubbles = result;

    // update the podcast object in the collection
    return updateObjectInCollection(COLLECTIONNAME, { $set: podcast }, query);
  });

}

module.exports = {getPodcastByID, getPodcastsByCategory, getLatestPodcastIDByCategory, createPodcast, editPodcast}

/*
  Helper functions
*/

function getDateObjFromDateInt(dateInt) {
  dateStr = "" + dateInt;
  return {
    year: dateStr.slice(0,4),
    month: dateStr.slice(4,6),
    day: dateStr.slice(-2)
  }
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

//convert seconds (thats how we save times of the podcast (length & progress)) to hh:mm:ss format
function convertSecondsToString(fullTime) {
	let completeMinutes = Math.floor(fullTime / 60);
	let completeSeconds = Math.floor(fullTime % 60);
	//vorangestellte Null hinzufügen falls benötigt
	if (completeSeconds < 10) {
		completeSeconds = "0" + completeSeconds;
	}
	if (completeMinutes === 0) {
		return "00:" + completeSeconds;
	}
	if (completeMinutes <= 59) {
		return (completeMinutes + ":" + completeSeconds);
	}
	if (completeMinutes > 59) {
		let completeHours = Math.floor(completeMinutes / 60);
		completeMinutes = completeMinutes % 60;
		//vorangestellte Null hinzufügen falls benötigt
		if (completeMinutes < 10) {
			completeMinutes = "0" + completeMinutes;
		}
		return (completeHours + ":" + completeMinutes + ":" + completeSeconds);
	}
}

// generate DOM object: podcast card from json(podcast) object
function generateCardFromPodcast(podcast) {
  // every card gets a random (1 of 4) background color
	let randomColor = getRandomInt(4) + 1;

  let date = getDateObjFromDateInt(podcast.date);

  // generate card
  let podcastCard = "<div class=\"card-body cardBG" + randomColor + "\" onClick=\"toggleCard(this, \'" + podcast.manifestID + "\')\">";

  // card-front stuff from here
  podcastCard += "<div class=\"card-front\">";

  // date part
  podcastCard += "<div class=\"date\" id=\"date/" + podcast.manifestID + "\"><p class=\"time\">";
  podcastCard += "<span class=\"day\">" + date.day + "<br></span>";
  podcastCard += "<span class=\"month\">" + date.month + "<br></span>";
  podcastCard += "<span class=\"year\">" + date.year + "<br></span>";
  podcastCard += "</p></div>";

  // comments turn picture
  podcastCard += "<img src=\"images/comments_turn_white.png\" class=\"commentsTurn\" id=\"commentsTurn/" + podcast.manifestID + "\">";

  // front-card table
  podcastCard += "<table class=\"cardTable\">";
  // category
  podcastCard += "<tr><td valign=\"top\"><p class=\"category\">" + podcast.category + "<br></p></td></tr>";
  // title
  podcastCard += "<tr><td><p class=\"title\">" + podcast.title + "<br></p></td></tr>";
  // progress bar
  podcastCard += "<tr><td valign=\"bottom\"><div class=\"progressBar\">"
  podcastCard += "<div class=\"progress\" id=\"progress/" + podcast.manifestID + "\" length=\"" + podcast.length + "\"></div>"
  //    time information on progressBar
  podcastCard += "<div class=\"timeInformation\"><p id=\"currentTime/" + podcast.manifestID + "\" style=\"display: inline;\">00:00</p><p style=\"display: inline;\"> / " + convertSecondsToString(podcast.length) + "</p></div></div>"
  // play button
  podcastCard += "<a class=\"button\" onClick=\"playPodcast(event, \'" + podcast.manifestID + "\', \'" + podcast.title + "\', \'" + podcast.length + "\')\">Play</a>";
  // download button
  podcastCard += "<a class=\"button\" id=\"downloadButton/" + podcast.manifestID + "\" onClick=\"onDownloadClick(event, \'" + podcast.manifestID + "\', " + podcast.size + ")\">Download</a>"
  // end of table-front
  podcastCard += "</td></tr></table></div>";

  // card-back stuff from here
  podcastCard += "<div class=\"card-back\">";
  podcastCard += "<table class=\"cardTable\">";
  // title of the podcast
  podcastCard += "<tr><td><p class=\"backTitle\">" + podcast.title + "</p></td></tr>";
    // add onClick that user can click on comments without the card turning
  podcastCard += "<tr onClick=\"(function(event){event.stopPropagation();})(event)\">"
  // div container for comments on this podcast
  podcastCard += "<td><div id=\"messageBox/" + podcast.manifestID + "\" class=\"messageBox\" onscroll=\"detectScrollTop(this.id)\"></div></td></tr>";
    // add onClick that user can click on comments without the card turning
  podcastCard += "<tr onClick=\"(function(event){event.stopPropagation();})(event)\">"
  // inputBox: textArea for commenting
  podcastCard += "<td valign=\"bottom\">"
    // add onClick that user can click on comments without the card turning
  podcastCard += "<div class=\"commentInputBox\" onClick=\"(function(event){event.stopPropagation();})(event)\">";
  podcastCard += "<textarea type=\"input\" id=\"textArea/" + podcast.manifestID + "\" class=\"commentInputField inputFieldLine1\" placeholder=\"Kommentar schreiben\" onfocus=\"this.placeholder = \'\'\" onblur=\"this.placeholder = \'Kommentar schreiben\'\"></textarea>";
  podcastCard += "<button class=\"commentInputButton\" onClick=\"sendComment(\'" + podcast.manifestID + "\');\"><i class=\"fa fa-send-o\"></i></button>";
  // end of card-back
  podcastCard += "</div></td></tr></table></div>";

  //end of card
  podcastCard += "</div></div>";

  return podcastCard;
}
