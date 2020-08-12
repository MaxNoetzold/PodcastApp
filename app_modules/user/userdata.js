/*
	USERDATA FUNCTIONS
	 - getUserdata
	 - setUserdata
	 - generateUserdata
*/


let timeLogging = require('../logging/timeLogging.js');

//MongoDB custom functions
let getQueryForCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').getQueryForCollection;
let updateObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateObjectInCollection;
let insertObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').insertObjectInCollection;


/*
  getUserdata
   - returns userdata of $username
   - which userdata will be returned is defined in $requestedData
      (which is the Collection name in the MongoDB database)
   - currently only used for podcastTimers
*/
function getUserdata(username, requestedData) {
	if (username === null || !username) {
		return null;
	}

	let query = {
		"username": username
	};

	return getQueryForCollection(requestedData, query).then(function(result) {
		// mongoDB error
		if (!result || result === null) {
			timeLogging("getUserdata in userdata.js: result from MongoDB is null with username: " + username);
			return null;
		}
		// no userdata found for $username
		if (result.length === 0) {
			return null;
		}

		// return user object
		return result[0];
	});
}


/*
  getUserdata
   - changes userdata for $username in $requestedDataChange (= Collection name in mongoDB database)
   - returns false on error and true on success
   - currently only used for podcastTimers
*/
function setUserdata(username, requestedDataChange, content) {
	if (username === null || !username) {
		return false;
	}

	let query = {
		"username": username
	};
	//How to use a variable as an Object Key
	//https://stackoverflow.com/questions/30836761/how-to-use-a-variable-as-an-object-key-mongodb
	let $push_query = {};
	$push_query[requestedDataChange] = content;

	if(!updateObjectInCollection(requestedDataChange,  { $set: $push_query }, query)) {
		timeLogging("setUserdata in userdata.js: updateObjectInCollection didnt work for: " + username);
    return false;
	}
  return true;
}


/*
  generateUserdata
   - generates all userdata that is needed for a $user
   - only generates it if not existent (we dont want to overwrite actual data)
   - if function gets actual data, it doesnt generate it but just insert it as new data
   - currently the only userdata are the PodcastTimers
*/
function generateUserdata(user, timers = null) {
	let username = user.username;
	// test if username is defined
	if (username === null || !username) {
		timeLogging("GenerateUserdata Error no username: " + username)
		return;
	}

	getUserdata(username, "PodcastTimers").then(function(result) {
		// only generate new data if there is no data
		if (result === null) {
      let podcastTimers = {};

      // without given podcastTimers we generate clean data
      if (timers === null) {
        let date = new Date();
        podcastTimers = {
          "username": username,
          "PodcastTimers": {
            "lastModified" : date.getTime(),
            "timers" : []
          }
        };
      }
      // if the function gets podcastTimers we use them as data
      else {
        podcastTimers = timers;
        podcastTimers = {
          "username": username,
          "PodcastTimers": timers
        };
      }

			insertObjectInCollection("PodcastTimers", podcastTimers);
		}
	});
}

module.exports = { getUserdata, setUserdata, generateUserdata };
