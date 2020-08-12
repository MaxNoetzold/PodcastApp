/*
	Main Server file
	 - basically just linking the real functions together
*/

/*
	Required Modules
*/
	/*
		general express modules
		 - express, http: to start the server
		 - path: to use os paths for accessing files
		 - session, MongoDBStore: to use sessions as client management
		 - bodyParser, cookieParser: to be able to read the respective group
	*/
let express = require("express");
let http = require('http');
let path = require("path");

let session = require('express-session');
let MongoDBStore = require('connect-mongodb-session')(session);

let bodyParser = require('body-parser');
let cookieParser = require("cookie-parser");
	/*
		more special libraries
		 - webPush: to send notifications
		 - socketio, socketChat (own): to use a live chat with web sockets
		 - passport, passportSocketIo: to authenticate everything and as user system
	*/
let webPush = require('web-push');

let socketio = require("socket.io");
let socketChat = require("./app_modules/socketChat/socketChat.js");

let passport = require('passport');
let passportSocketIo = require("passport.socketio");
	/*
		own routers
		 - staticRouter: route static files (for some files a pure express.static just isnt fitting well)
		 - login, register: login/register page incl. handling the login/register attempts
		 - cardRouter: cards are the DOM elements of each podcast episode; they get rendered on server and send to client
		 - podcastTimers: for each user we store the progress of each podcast episode; this recieves and sends those informations
		 - subscribe: handles subscriptions to the notifications; if activated on client, it sends its webPush Endpoint every time it gets opened
		 - changePassword: handles the change password request of the settings popup on main page
		 - getMessages: route that sends the (usually latest) 10 requested messages of a room
		 - nameColor: set and get the color of the username (when displayed above messages)
		 - adminPage: the whole admin page router
	*/
let staticRouter = require("./staticRouter.js");
let login = require("./pages/login/login_server.js");
let register = require("./pages/register/register_server.js");
let cardRouter = require("./app_modules/podcasts/podcasts_router.js");
let podcastTimers = require("./app_modules/user/routers/podcastTimers.js");
let subscribe = require("./app_modules/notifications/subscribe_router.js");
let changePassword = require("./app_modules/user/routers/changePassword.js");
let getMessages = socketChat.router;
let nameColor = require("./app_modules/user/routers/nameColor.js");
let adminPage = require("./pages/admin/admin_server.js");
let mainPage = require("./pages/main/main_server.js");
	/*
		own functions
		 - initPassport: defines the register and login rules
		 - socketChatInit: inits socket chat; surprise
		 - timeLogging: instead of console.log() i use timeLogging() which is the same but adds a time and optionally the current user infront of the message
	*/
let initPassport = require("./app_modules/user/passport.js");
let timeLogging = require('./app_modules/logging/timeLogging.js');
let socketChatInit = socketChat.socketChatInit;
/*
	own Middlewares
	 - checkAuthenticated: checks on /login and /register page if user is already authenticated and redirects to main page if true
	 - checkNotAuthenticated: checks if user is authenticated; if not he gets redirected to /login; is used nearly everywhere
	 - filterbubbleAuthentication: every user is only allowed to see/access certain podcast categories (defined in filterbubbles); this middleware enforces it
*/
let checkAuthenticated = require('./app_modules/authenticationMiddlewares/authenticationMiddlewares.js').checkAuthenticated;
let checkNotAuthenticated = require('./app_modules/authenticationMiddlewares/authenticationMiddlewares.js').checkNotAuthenticated;
let filterbubbleAuthentication = require("./app_modules/filterbubbles/filterbubbles_authentication_middleware.js").filterbubbleAuthentication;
/*
	secrets
	 - information that should not get stored on github
	 - are stored in an object in a secrets.js file
*/
let secrets = require('./secrets.js');
/*
	App Variables
*/
let app = express();
let port = "3000";

// generated vapi keys for webPush
// ./node_modules/.bin/web-push generate-vapid-keys
const publicVapidKey= secrets.publicVapidKey;
const privateVapidKey= secrets.privateVapidKey;

/*
	App Configuration
*/
// to store the current active express sessions
var sessionStore = new MongoDBStore({
	uri: 'mongodb://localhost:27017/podcastApp',
	collection: 'mySessions'
});

// to read the req.body
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());
// static directory for everything that does not need to be protected
app.use(express.static(path.join(__dirname, "static")));
// pug layout folder
app.set('view-engine', 'pug');
app.set("views", __dirname);
// express-session init (a session timeouts after 1 month)
app.use(session({
	secret: secrets.sessionSecret,
	resave: true,
	saveUninitialized: false,
	cookie: {
		maxAge: 30 * 86400 * 1000, //1 month
	},
	store: sessionStore
}))
// passport inits
app.use(passport.initialize());
app.use(passport.session());
initPassport();
// web-push init
webPush.setVapidDetails(secrets.mail, publicVapidKey, privateVapidKey);

// prototype functions that will return *current real date + time* on later use
Date.prototype.today = function () {
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

// for socket.io
let server = http.createServer(app);
let io = socketio(server);
io.use(passportSocketIo.authorize({
  key: 'connect.sid',
  secret: secrets.passportSocketSecret,
  store: sessionStore,
  passport: passport,
  cookieParser: cookieParser
}));

// own socket.io function/event handling
socketChatInit(io);

/*
	Middlewares
	 - we dont check authentication on /logout and /manifest.json (bc it throws errors if we do)
	 - on /login and /register we test if client is already authenticated and if yes we redirect to main page
	 - user can only access /podcast-episodes/ fragments if they are allowed to / in the appropriate filterbubble
	 - for everything else you need to be logged in
*/
app.get("*", function(req, res, next){
	if (req.url == "/logout" || req.url == "/manifest.json" )
		return next();
	if (req.url.startsWith("/login") || req.url.startsWith("/register")) {
		return checkNotAuthenticated(req, res, next); //test if authenticated and if yes redirect to "/"
	}
	if (req.url.startsWith('/podcast-episodes/')) {
		return filterbubbleAuthentication(req, res, next); //Filterbubble authentication Middleware
	}
	checkAuthenticated(req, res, next); //test if authenticated and if not redirect to "/login"
});

/*
	Routes Definitions
*/
app.use("/", staticRouter);

app.use("/admin", adminPage);

app.use("/login", login);

app.use("/register", register);

//archive page
app.get("/", mainPage);
app.use("/", cardRouter);
app.use("/changePassword", changePassword);
app.use("/podcastTimers", podcastTimers);
app.use("/subscribe", subscribe);
app.use("/getMessages", getMessages);
app.use("/nameColor", nameColor);

//logout
app.get('/logout', function(req, res) {
	req.logout();
	res.redirect("/login");
});

/*
	Server Activation
*/
server.listen(port, () => {
	timeLogging("Listening to requests on http://localhost:" + port);
});
