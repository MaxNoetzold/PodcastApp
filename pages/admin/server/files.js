/*
	Send Static Files
		- Client Statics (css, js)
		- specific libraries from node_modules
*/

let router = require('express').Router();
let path = require("path");

router.get('/admin.css', function(req, res, next) {
	res.sendFile(path.join(__dirname, "..", "client", "admin.css"));
});

router.get('/admin_client.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "..", "client", "admin_client.js"));
});

router.get('/users.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "..", "client", "users.js"));
});

router.get('/notifications.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "..", "client", "notifications.js"));
});

router.get('/podcasts.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "..", "client", "podcasts.js"));
});

router.get('/filterbubbles.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "..", "client", "filterbubbles.js"));
});

router.get('/vanilla-router.min.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "../../..", "node_modules", "vanilla-router", "dist", "vanilla-router.min.js"));
});

module.exports = router;
