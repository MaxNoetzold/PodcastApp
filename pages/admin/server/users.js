/*
	Users Module
		to handle admin/users functionality:
		- show all users
		- create new user
		- reset password of user
		- edit user
*/

let router = require('express').Router();

let getAllUsers = require('../../../app_modules/user/user.js').getAllUsers;
let getUser = require('../../../app_modules/user/user.js').getUser;
let insertObjectInCollection = require('../../../app_modules/mongoDB_CustomFunctions/mongoDB_customFunctions.js').insertObjectInCollection;
let updateObjectInCollection = require('../../../app_modules/mongoDB_CustomFunctions/mongoDB_customFunctions.js').updateObjectInCollection;

/*
	usersPage
	- returns a string that is the whole "Users" admin page
		so that the client router can render it
*/
router.get('/usersPage', function(req, res) {
		let usersPage = "<h1>Users</h1>";
		// add newUser component: button + popup
		usersPage += "<button onclick='openNewUserPopup()'>New User</button><div class='modal' id='newUser' style='display:none;'><div class='modal-content'><div class='modal-header'><span class='close' id='newUserClose'>×</span><h2>New User</h2></div><div class='modal-body'><p class='errorDisplay' id='newUserErrorDisplay'></p><div class='form'><input id='newUserUsername' type='text' placeholder='Username'><input id='newUserNameColor' type='text' placeholder='Namecolor'><input id='newUserFilterbubbles' type='text' placeholder='Filter Bubbles; seperated by comma'><input class='checkbox' id='newUserAdminCheckbox' type='checkbox' name='newUserAdminCheckbox'><label for='newUserAdminCheckbox'>Admin</label><a class='button' onclick='createUser()'>Create User</a></div></div></div></div>";

		// add editUser component: popup
		usersPage += "<div class='modal' id='editUser' style='display:none;'><div class='modal-content'><div class='modal-header'><span class='close' id='editUserClose'>×</span><h2>Edit User</h2></div><div class='modal-body'><p class='errorDisplay' id='editUserErrorDisplay'></p><div class='form'><input id='editUserUsername' type='text' placeholder='Username'><input id='editUserNameColor' type='text' placeholder='Namecolor'><input id='editUserFilterbubbles' type='text' placeholder='Filter Bubbles; seperated by comma'><input class='checkbox' id='editUserAdminCheckbox' type='checkbox' name='editUserAdminCheckbox'><label for='editUserAdminCheckbox'>Admin</label><a class='button' onclick='editUser()'>Edit User</a><a class='button' onclick='resetPassword()'>Reset Password</a></div></div></div></div>";

		// add list of all users as basic table
		getAllUsers().then(function(users) {
			if (users) {
        // table head: Username | Namecolor | Filterbubbles | Registered | Admin | Edit (button)
				usersPage += "<div style='overflow-x:auto;'><table><tr><th>Username</th><th>Namecolor</th><th>Filter Bubbles</th><th>Registered</th><th>Admin</th><th>Edit</th></tr>"
				// add a table row for every user
				for (let i = 0; i < users.length; i++) {
					usersPage += "<tr><td>" + users[i].username + "</td><td style='background:" + users[i].nameColor + "'>" + users[i].nameColor + "</td><td>" + users[i].filterBubbles + "</td><td>" + (users[i].password !== null && users[i].password !== "") + "</td><td>" + (users[i].admin) + "</td><td><button onclick='openEditUserPopup(\"" + users[i].username + "\", \"" + users[i].nameColor + "\", \"" + users[i].filterBubbles + "\", " + users[i].admin + ")'>Edit User</button></tr>"
				}
				usersPage += "</table></div>"
			}
			res.send(usersPage);
		});
});

router.post('/createUser', function(req, res, next) {
		// test if user already exists
		getUser(req.body.username).then(function(user) {
			if (user) {
				res.status(409).send("User already exists!");
			} else {
				// create user object
				newUser = req.body;
				newUser.password = "";

        // create user in db
				insertObjectInCollection("Users", newUser);
				res.send("User created!")
			}
		});
});

router.post('/resetPassword', function(req, res, next) {
		// test if user already exists
		getUser(req.body.username).then(function(user) {
			if (user) {
				// reset password of user to empty
				// which means that he can set a new password at the registration page
				let query = {
					"username": user.username
				};
				if(updateObjectInCollection("Users",  { $set: { "password": "" } }, query)) {
					res.send("Password resetted!")
				}
			} else {
				res.status(409).send("User does not exist!")
			}
		});
});

router.post('/editUser', function(req, res, next) {
		// test if user already exists
		getUser(req.body.username).then(function(user) {
			if (user) {
				// change $namecolor, $admin and filterBubbles for $username
				let query = {
					"username": user.username
				};
				if(updateObjectInCollection("Users",  { $set: { "nameColor": req.body.nameColor, "admin": req.body.admin, "filterBubbles": req.body.filterBubbles } }, query)) {
					res.send("User edited!")
				}
			} else {
				res.status(409).send("User does not exist!")
			}
		});
});

module.exports = router;
