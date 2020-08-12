/*
 static files
  i serve them like that so they can easily be in the same folder
  and not a seperate statics folder,
  but at the same time I can decide which files of that folder are accessible
*/

let router = require('express').Router();
let path = require("path");

// LOGIN PAGE
router.get('/login_client.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "pages", "login", "client", "login_client.js"));
});
router.get('/login.css', function(req, res, next) {
	res.sendFile(path.join(__dirname, "pages", "login", "client", "login.css"));
});

// REGISTER PAGE
router.get('/register_client.js', function(req, res, next) {
	res.sendFile(path.join(__dirname, "pages", "register", "client", "register_client.js"));
});
router.get('/register.css', function(req, res, next) {
	res.sendFile(path.join(__dirname, "pages", "login", "client", "login.css"));
});

// MAIN PAGE
router.get('/main/*', function(req, res, next) {
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?')[0];
	// cut away everything but the name of the file
	cleanURL = cleanURL.split('/');
	cleanURL = cleanURL[cleanURL.length-1]
	res.sendFile(path.join(__dirname, "pages", "main", "client", cleanURL));
});

// PWA FILES
router.get("/manifest.json", function(req, res){
	// send the correct headers
	res.header("Content-Type", "text/cache-manifest");

	res.sendFile(path.join(__dirname, "manifest.json"));
});
router.get("/sw.js", function(req, res){
	//send the correct headers
	res.header("Content-Type", "text/javascript");

	res.sendFile(path.join(__dirname, "sw.js"));
});


// NODE_MODULE LIBRARIES
// (those will be checked for authentication because its not explicitly stated otherwise)
router.get('/font-awesome/*', function(req, res, next) {
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	res.sendFile(path.join(__dirname, "node_modules", cleanURL[0]));
});
router.get('/localforage/*', function(req, res, next) {
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	// i dont want anyone to access all files in the localforage folder (idk why actually)
	// so I only allow access to the dist folder and redirecting the traffic here
	cleanURL = cleanURL[0].split('/');
	cleanURL.splice(2, 0, "dist");

	res.sendFile(path.join(__dirname, "node_modules", cleanURL.join('/')));
});
router.get('/mux.js/*', function(req, res, next) {
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	// i dont want anyone to access all files in the mux.js folder (idk why actually)
	// so I only allow access to the dist folder and redirecting the traffic here
	cleanURL = cleanURL[0].split('/');
	cleanURL.splice(2, 0, "dist");

	res.sendFile(path.join(__dirname, "node_modules", cleanURL.join('/')));
});
router.get('/plyr/*', function(req, res, next) {
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	// i dont want anyone to access all files in the mux.js folder (idk why actually)
	// so I only allow access to the dist folder and redirecting the traffic here
	cleanURL = cleanURL[0].split('/');
	cleanURL.splice(2, 0, "dist");

	res.sendFile(path.join(__dirname, "node_modules", cleanURL.join('/')));
});
router.get('/shaka-player/*', function(req, res, next) {
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	// i dont want anyone to access all files in the mux.js folder (idk why actually)
	// so I only allow access to the dist folder and redirecting the traffic here
	cleanURL = cleanURL[0].split('/');
	cleanURL.splice(2, 0, "dist");

	res.sendFile(path.join(__dirname, "node_modules", cleanURL.join('/')));
});
router.get("/socket.io-client/*", function(req, res){
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	// i dont want anyone to access all files in the mux.js folder (idk why actually)
	// so I only allow access to the dist folder and redirecting the traffic here
	cleanURL = cleanURL[0].split('/');
	cleanURL.splice(2, 0, "dist");

	res.sendFile(path.join(__dirname, "node_modules", cleanURL.join('/')));
});
router.get("/pickr/*", function(req, res){
	// cut away all parameters (e.g. version of the file, bc we always only have the latest version)
	cleanURL = req.url.split('?');
	// i dont want anyone to access all files in the mux.js folder (idk why actually)
	// so I only allow access to the dist folder and redirecting the traffic here
	cleanURL = cleanURL[0].split('/');
	cleanURL.splice(2, 0, "dist");
	// pickr is special / their folder is called "@simonwep"
	cleanURL.splice(1, 0, "@simonwep");

	res.sendFile(path.join(__dirname, "node_modules", cleanURL.join('/')));
});

// PODCASTS SEGMENTS
router.get('/podcast-episodes/*', function(req, res, next) {
	res.sendFile(path.join(__dirname, req.url))
});

module.exports = router;
