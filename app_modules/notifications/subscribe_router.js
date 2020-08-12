let express = require('express');
let router = express.Router();
let subscribeToNotifications = require('./notifications.js').subscribeToNotifications;
let timeLogging = require('../logging/timeLogging.js');

// router to subscribe user to NotificationSubscriptions
router.post('/', (req, res, next) => {
	const subscription = req.body;

	// save subscription in NotificationSubscriptions collection on mongoDB
	subscribeToNotifications(subscription, req);

	// send a "it worked" response
	res.status(201).send();
});

module.exports = router;
