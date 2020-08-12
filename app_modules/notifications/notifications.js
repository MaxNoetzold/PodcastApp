/*
	NOTIFICATION FUNCTIONS
	 - getNotificationSubscriptions
	 - subscribeToNotifications
	 - unsubscribeFromNotification
*/

let timeLogging = require('../logging/timeLogging.js');
let getUser = require("../user/user.js").getUser;
let getCurrentUsername = require("../user/getCurrentUsername.js").getCurrentUsername;


//MongoDB custom functions
let getQueryForCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').getQueryForCollection;
let insertObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').insertObjectInCollection;
let deleteObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').deleteObjectInCollection;
let updateObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateObjectInCollection;

let STORENAME = "NotificationSubscriptions";

/*
  getAllNotificationSubscriptions
   - returns all stored notification subscriptions
   - if $filterBubbles is not empty, it only returns all subscriptions with the given filterBubbles
*/
function getAllNotificationSubscriptions(filterBubbles = []) {
	let query = {};
	if (filterBubbles.length > 0) {
		query.filterBubbles = { $in: filterBubbles };
	}
	return getQueryForCollection(STORENAME, query);
}


/*
  subscribeToNotifications
   - subscribe user/client to notifications (:add it to the mongoDB collection)
   - store the webPush API endpoint together with the current filterBubbles of the user
   - if user is already subscribed we dont add it, but just update it
      (so we dont send multiple notifications bc the endpoint is stored multiple times)
*/
function subscribeToNotifications(subscription, req) {
	// add the filterbubbles of the user to the subscription object
	getUser(getCurrentUsername(req)).then(user => {
		if (user) {
			subscription.filterBubbles = user.filterBubbles;

			// test if already subscribed, so we dont add it more than once, but just update the existing one
			let query = {
				"endpoint" : subscription.endpoint
			};
			getQueryForCollection(STORENAME, query).then(function (result) {
				if (!result || result === null) {
					timeLogging("MongoDB Error at subscribeToNotifications by checking if device is already subscribed");
					return;
				}
				// if the endpoint is already subscribed, we update the old
				if (result.length > 0) {
					if(!updateObjectInCollection(STORENAME,  { $set: subscription }, query)) {
			      timeLogging("subscribeToNotificationsn: Error at updating subscription", req);
			      return;
			  	}
					timeLogging("Notification subscription updated", req);
					return;
				}

				// else: subscribe the user
				insertObjectInCollection(STORENAME, subscription);
				timeLogging("User added to notification subscription", req);
			});
		} else {
			timeLogging("User wasnt found and could not be subscribed to notifications", req);
			return;
		}
	});
}


/*
  unsubscribeFromNotification
   - delete subscription from collection
   - usually used when user manually unsubscribes or when endpoint returns error on send
*/
let unsubscribeFromNotification = function (endpoint) {
	let query = {
		"endpoint" : endpoint
	};
	if (deleteObjectInCollection(STORENAME, query)) {
		timeLogging("User unsubscribed from notifications");
	} else {
		timeLogging("Error at unsubscribeFromNotification");
	}
}

module.exports = { subscribeToNotifications, getAllNotificationSubscriptions, unsubscribeFromNotification };
