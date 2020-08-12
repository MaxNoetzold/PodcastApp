/*
  Filterbubbles Function Module
  - addFilterbubble
  - editFilterbubble
  - getFilterbubbles
  - getFilterbubblesForCategory
  - getFilterbubblesForManifestID
  - getFilterbubble

  Filterbubble: {filterBubble: "name", categories: [“categoryName1”, "“categoryName2"] }
*/

let timeLogging = require('../../app_modules/logging/timeLogging.js');
let getQueryForCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').getQueryForCollection;
let insertObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').insertObjectInCollection;
let updateManyInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateManyInCollection;
let updateObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateObjectInCollection;

/*
  addFilterbubble
  - adds Filterbubble to Collection if name wasnt used before
  - adds this filterbubble to all mentioned (as categories) podcasts
*/
function addFilterbubble(newBubble) {
  let query = {
    "title": newBubble.title
  };

  // test if bubble title already exists
  // if yes: return null;
  // else create filter bubble and update all podcasts of the mentioned categories
  return getQueryForCollection("FilterBubbles", query).then(response => {
    if (response && response.length > 0) {
      return null;
    }
    for (i = 0; i < newBubble.categories.length; i++) {
      addFilterbubbleToCategory(newBubble.title, newBubble.categories[i])
    }
    return insertObjectInCollection("FilterBubbles", newBubble).then(creationStatus => {
      return creationStatus;
    });
  });
}


/*
  editFilterbubble
  - edit Filterbubble in Collection if it exists
  - deletes filterbubble from all podcasts which category got deleted out of the bubble
  - adds this filterbubble to all mentioned (as categories) podcasts
*/
function editFilterbubble(newBubble) {
  let query = {
    "title": newBubble.title
  };

  // test if bubble title already exists
  // if no: return false;
  // else edit filter bubble and update all podcasts of the mentioned categories
  return getQueryForCollection("FilterBubbles", query).then(response => {
    if (!response || response.length <= 0) {
      timeLogging("editFilterbubble: No Filterbubble found for name: " + newBubble.title);
      return false;
    }
    if (response.length > 1) {
      timeLogging("editFilterbubble: More than one Filterbubble found for name: " + newBubble.title);
      return false;
    }

    response = response[0];
    // get all deleted categories by compairing old vs new categories array
    // update the belonging podcasts metadata
    for (i = 0; i < response.categories.length; i++) {
      if(newBubble.categories.indexOf(response.categories[i]) < 0) {
        deleteFilterbubbleFromCategory(newBubble.title, response.categories[i]);
      }
    }
    // get all new added categories by compairing old vs new categories array
    // update the belonging podcasts metadata
    for (i = 0; i < newBubble.categories.length; i++) {
      if(response.categories.indexOf(newBubble.categories[i]) < 0) {
        addFilterbubbleToCategory(newBubble.title, newBubble.categories[i]);
      }
    }

    // update filterbubble in collection
    if(!updateObjectInCollection("FilterBubbles",  { $set: { "categories": newBubble.categories } }, query)) {
      timeLogging("editFilterbubble: Error at updating filter bubble for title: " + newBubble.title);
      return false;
  	}
    return true;
  });
}


/*
  getFilterbubbles
  - returns array of all filterBubble Objects
*/
function getFilterbubbles() {
  return getQueryForCollection("FilterBubbles", {}).then(response => {
    if (!response || response === null || response.length === 0) {
      return [];
    }
    return response;
  });
}


/*
  getFilterbubblesForCategory
  - returns array of all filterBubbles for given category
*/
function getFilterbubblesForCategory(category) {
  let query = { categories: category}

  return getQueryForCollection("FilterBubbles", query).then(response => {
    if (!response || response === null || response.length === 0) {
      return [];
    }
    // extract only the name
    // one could delete all other objects, but in case I change it again I would
    // have to change this code as well, which is why I just create a new array
    // and only add the necessary information in it
    let bubbles = [];
    for (let i = 0; i < response.length; i++) {
      bubbles.push(response[i].title)
    }
    return bubbles;
  });
}


/*
  getFilterbubblesForManifestID
  - returns array of all filterBubbles for given manifestID
*/
function getFilterbubblesForManifestID(manifestID) {
  let query = { manifestID: manifestID }

  return getQueryForCollection("Podcasts", query).then(response => {
    if (!response || response === null || response.length === 0) {
      return [];
    }
    // extract only the filterBubbles
    return response[0].filterBubbles;
  });
}


/*
  getFilterbubble
  - returns filter bubble object for title
*/
function getFilterbubble(title) {
  let query = {
    title: title
  }
  return getQueryForCollection("FilterBubbles", query).then(response => {
    return response;
  });
}

module.exports = {addFilterbubble, editFilterbubble, getFilterbubbles, getFilterbubble, getFilterbubblesForCategory, getFilterbubblesForManifestID}

/*
  Helper Functions
  - addFilterbubbleToCategory
  - deleteFilterbubbleFromCategory
*/


/*
  addFilterbubbleToCategory
  - adds filterbubble to every podcast of given category
*/
function addFilterbubbleToCategory(bubbleName, category) {
  let query = {
    category : category
  };
  let update = {
    $addToSet: {
      filterBubbles: bubbleName
    }
  };
  updateManyInCollection("Podcasts", update, query);
}


/*
  deleteFilterbubbleFromCategory
  - deletes filterbubble from every podcast of given category
*/
function deleteFilterbubbleFromCategory(bubbleName, category) {
  let query = {
    category : category
  };
  let update = {
    $pull: {
      filterBubbles: bubbleName
    }
  };
  updateManyInCollection("Podcasts", update, query);
}
