/*
	Admin Page functionalities:
		every admin can
		- edit and create podcasts metadata
		- send notifications (to specific filterbubbles)
		- edit and create users
		- edit and create filterbubbles
*/

let router = require('express').Router();

//admin component routers
let fileAdminRouter = require('./server/files.js')
let usersAdminRouter = require('./server/users.js');
let notificationsAdminRouter = require('./server/notifications.js');
let podcastsAdminRouter = require('./server/podcasts.js');
let filterbubblesAdminRouter = require('./server/filterbubbles.js')

/*
	Middleware
		to test if user is admin
		and redirect any traffic to the main page if user is not admin
*/
let authenticationMiddleware = require('../../app_modules/authenticationMiddlewares/authenticationMiddlewares.js');
router.get('*', function(req, res, next) {
	authenticationMiddleware.checkAdmin(req, res, next);
});

/*
	Send basic page with:
  	- scripts and styles
		- nav element
		- main div block
*/
function indexPage(req, res) {
		res.render("pages/admin/admin.pug");
}

/*
	Redirect to Main Page in case of reload
		(without that we would get a server error on reload
		bc the page admin/? doesnt exist)
*/
router.get('/', function(req, res) {
	indexPage(req, res)
});

router.get('/notification', function(req, res) {
	indexPage(req, res)
});

router.get('/users', function(req, res) {
	indexPage(req, res)
});

router.get('/filterbubbles', function(req, res) {
	indexPage(req, res)
});

/*
	Users Module
		to handle users functionality:
		- show all users
		- create new user
		- reset password of user
		- edit user
*/
router.use('/', usersAdminRouter);

/*
	Send Notification Module
		to send notifications to specific filterBubbles
*/
router.use('/', notificationsAdminRouter);

/*
	Podcasts Module
		to
		- see all podcasts (metadata)
		- edit podcasts metadata
		- create metadata for new podcasts
		- TODO: fully automate upload and creation of podcasts
*/
router.use('/', podcastsAdminRouter);

/*
	Filter Bubbles Module
		to
		- add new Filter Bubbles
    - edit existent Filter Bubbles
    to specify which podcast categories are accessible for each user
*/
router.use('/', filterbubblesAdminRouter);


/*
	Send Static Files
		- Client Statics (css, js)
		- specific libraries from node_modules
*/
router.use('/', fileAdminRouter);


module.exports = router;
