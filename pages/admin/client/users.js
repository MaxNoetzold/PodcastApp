/*
	USERS PAGE
		- Create New User
		- See all users and there account information (no userdata, no psw)
		- edit account information
		- reset password
*/

let newUserErrorDisplay;
let editUserErrorDisplay;
let editUserUsername;

/*
	NewUser Functions:
		- open popup (client)
		- create user (send to server)
*/

function openNewUserPopup() {
	// reset the input of all fields
	document.getElementById("newUserUsername").value = "";
	document.getElementById("newUserNameColor").value = "";
	document.getElementById("newUserFilterbubbles").value = "";
	document.getElementById("newUserAdminCheckbox").checked = false;
	document.getElementById("newUserErrorDisplay").style.display = "none";

	openPopup("newUser", "/admin/users")
	// init error display
	newUserErrorDisplay = document.getElementById("newUserErrorDisplay");
}

function createUser() {
	// check that necessary information has been given
	if (!document.getElementById("newUserUsername").value) {
    showErrorMessageForPopup("Username needed!", newUserErrorDisplay);
    return;
  }
	if (!document.getElementById("newUserNameColor").value) {
    showErrorMessageForPopup("NameColor needed!", newUserErrorDisplay);
    return;
  }
	if (!document.getElementById("newUserFilterbubbles").value) {
    showErrorMessageForPopup("At least one Filterbubble needed!", newUserErrorDisplay);
    return;
  }
	// load the filterBubbles
	let filterBubbles = document.getElementById("newUserFilterbubbles").value.split(",");
  for (i = 0; i < filterBubbles.length; i++) {
    // remove spaces from beginning and end
    filterBubbles[i] = filterBubbles[i].trim();
  }

	// create user object
	let newUserJson = {
		username: document.getElementById("newUserUsername").value,
		nameColor: document.getElementById("newUserNameColor").value,
		filterBubbles: filterBubbles,
		admin: document.getElementById("newUserAdminCheckbox").checked
	};

	// send user object to server and show response
	fetch('/admin/createUser', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(newUserJson),
	})
	.then(response => {
		// show response
		response.text().then(text => {
			showErrorMessageForPopup(text, newUserErrorDisplay);
		});
		// if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("usersPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					usersPageContent = response;
					newContentAvailable = true;
				}
			});
		}
	});
}

/*
	 Edit User Functions:
		- open popup (client)
		- reset password (send to server)
		- edit user (send to server)
*/

function openEditUserPopup(username, nameColor, filterBubbles, isAdmin) {
	// set the username information but also safe it intern
	// so it cant be edited as easily
	editUserUsername = username;
	document.getElementById("editUserUsername").value = editUserUsername;
	document.getElementById("editUserUsername").disabled = true;

	//set all the other information
	document.getElementById("editUserNameColor").value = nameColor;
	document.getElementById("editUserFilterbubbles").value = filterBubbles;
	if (isAdmin) {
		document.getElementById("editUserAdminCheckbox").checked = true;
	} else {
		document.getElementById("editUserAdminCheckbox").checked = false;
	}

	// init error display and reset it
	editUserErrorDisplay = document.getElementById("editUserErrorDisplay");
	editUserErrorDisplay.style.display = "none";

	openPopup("editUser", "/admin/users");
}

function resetPassword() {
	// create json object which will be send to server
	let passwordResetJson = {
		username: editUserUsername
	};

	// send object to server and show response
	fetch('/admin/resetPassword', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(passwordResetJson),
	})
	.then(response => {
		// show response
		response.text().then(text => {
			showErrorMessageForPopup(text, editUserErrorDisplay);
		});
		// if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("usersPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					usersPageContent = response;
					newContentAvailable = true;
				}
			});
		}
	});
}

function editUser() {
	// check that necessary information has been given
	if (!document.getElementById("editUserNameColor").value) {
    showErrorMessageForPopup("NameColor needed!", editUserErrorDisplay);
    return;
  }
	if (!document.getElementById("editUserFilterbubbles").value) {
    showErrorMessageForPopup("At least one Filterbubble needed!", editUserErrorDisplay);
    return;
  }

	// load the data from html form
	let nameColor = document.getElementById("editUserNameColor").value;
	let isAdmin = document.getElementById("editUserAdminCheckbox").checked;
	// load the filterBubbles
	let filterBubbles = document.getElementById("editUserFilterbubbles").value.split(",");
  for (i = 0; i < filterBubbles.length; i++) {
    // remove spaces from beginning and end
    filterBubbles[i] = filterBubbles[i].trim();
  }

	// create json object which will be send to server
	let editUserJson = {
		username: editUserUsername,
		nameColor: nameColor,
		filterBubbles: filterBubbles,
		admin: isAdmin
	};

	// send object to server and show response
	fetch('/admin/editUser', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(editUserJson),
	})
	.then(response => {
		// show response
		response.text().then(text => {
			showErrorMessageForPopup(text, editUserErrorDisplay);
		});
		// if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("usersPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					usersPageContent = response;
					newContentAvailable = true;
				}
			});
		}
	});
}
