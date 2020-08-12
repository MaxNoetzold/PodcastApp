/*
	Send Notification Module
		to send notifications to every user in a specified filterBubble
		uses webPush API
*/


let router = require('express').Router();
let timeLogging = require('../../../app_modules/logging/timeLogging.js');

let getAllNotificationSubscriptions = require('../../../app_modules/notifications/notifications.js').getAllNotificationSubscriptions;
let unsubscribeFromNotification = require('../../../app_modules/notifications/notifications.js').unsubscribeFromNotification;
let webPush = require('web-push');


/*
  notificationPage
  - returns a string that is the whole "Send Notification" admin page
    so that the client router can render it
*/
router.get('/notificationPage', function(req, res) {
	// header
	let notificationPage = "<h1>Send Notification</h1>";
	// form
	notificationPage += '<div class="form">'
	notificationPage += '<p class="errorDisplay" id="notificationErrorDisplay"></p>';
	notificationPage += '<input id="notificationTitle" type="text" placeholder="Title">';
	notificationPage += '<textarea id="notificationText" type="text" placeholder="Text"></textarea>';
	notificationPage += '<input id="notificationFilterBubbles" type="text" placeholder="Filter Bubbles; seperated by commas">';
	notificationPage += '<a class="button" onclick="sendNotification()">Send Notification</a></div>';
	res.send(notificationPage);
});

router.post('/sendNotification', function(req, res, next) {
	res.status(200).end();

	// get the filterbubbles for which it should be send
	// delete this information afterwards so it doesnt get send to the clients
	// (it would not be processed there, but it safes bandwith)
	let filterBubbles = req.body.filterBubbles;
	delete req.body.filterBubbles;
	let payload = JSON.stringify(req.body);

	getAllNotificationSubscriptions(filterBubbles).then(function (allSubscriptions) {
		// go through each saved client endpoint
		// send the notification to each via webPush API
		allSubscriptions.forEach(function(subscription) {
			webPush.sendNotification(subscription, payload)
			.catch(function(error) {
				timeLogging("Send Notifications Error: " + error);
				if (error.statusCode === 410) {
					// unsubscribe expired user
					unsubscribeFromNotification(error.endpoint);
				} else {
					timeLogging("Send Notifications Unsubscribe Error: " + error);
				}
			});
		});
	});
});

module.exports = router;
