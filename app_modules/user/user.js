/*
	USER FUNCTIONS
   - getUser(username)
   - getAllUsers()
   - setUserPassword(username, newPassword)
*/


let timeLogging = require('../logging/timeLogging.js');

//MongoDB custom functions
let getQueryForCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').getQueryForCollection;
let updateObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateObjectInCollection;

let STORENAME = "Users";


/*
  getUser
   - returns a promise that will be an user object with $username as property
   - on error it will return null
*/
function getUser(username) {
	let query = {
		"username": username
	};
	return getQueryForCollection(STORENAME, query).then(function(result) {
		// mongoDB error
		if (!result || result === null) {
			timeLogging("getUser in user.js: result from MongoDB is null for username: " + username);
			return null;
		}

    // no user found with that username
		if (result.length === 0) {
			return null;
		}

    // in case that are multiple users with same username we throw an error
    // this should never happen
    if (result.length > 1) {
      timeLogging("more than one user found for username: " + username);
      return null;
    }

		// return user object
		return result[0];
	});
}


/*
  getAllUsers
   - returns a promise that will be an array of all user objects
   - on error it will return null
*/
function getAllUsers() {
	let query = {}; // No parameters in the find() method gives you the same result as SELECT * in MySQL.
	return getQueryForCollection(STORENAME, query).then(function(result) {
		// mongoDB error
		if (!result || result === null) {
			timeLogging("getAllUsers in user.js: result from MongoDB is null");
			return null;
		}
		//no user found
		if (result.length === 0) {
			return null;
		}
		return result;
	});
}


/*
  setUserPassword
   - updates password of user with $username
   - used for registering user and when user changes the password
   - return edited user object on success and null on error
*/
function setUserPassword(username, newPass) {
	let query = {
		"username": username
	};
	// get the user object which we want to update; only to test if it exists
	return getUser(username).then(function(user) {
		if (!user || user === null) {
			timeLogging("setUser in user.js: this username is not predefined: " + username);
			return null;
		}

    // change the password of that user
		if(updateObjectInCollection(STORENAME,  { $set: { "password": newPass } }, query)) {
			return user;
		}
		timeLogging("setUser in user.js: updateObjectInCollection didnt work for: " + username);
		return null;
	});
}

module.exports = { getUser, getAllUsers, setUserPassword };
