/*
	FUNCTIONS OF THE SETTINGS PAGE:

	1. Logout
	 - ends server session
	 - TODO: deletes indexeddb content
	2. Change Password
	3. Debug Logging on/off
	 - client always logs into an <p> DOM element
	 - when this setting is turned on one can see the logs
	 - logs are never send to the server
	4. Notifications on/off
	5. Early Access on/off
	 - in theory it is a feature with which I can hide new features for most users
	   so only users with this enabled see those updates
	   but in reality it is barely used

*/

/*
 - gets called on startup
 - read the state of all settings from indexeddb
   - if a setting is not stored (not changed from user) use standard values:
		  notificationSetting = true;
		  debgugLoggingSetting = false;
		  earlyAccessSetting = false;
			nameColor has no default;
			 after loading it from indexeddb it always gets updated
			 with the latest version from server

*/
function initSettings() {
	generalUserDataStore.getItem("notificationSetting").then(function(value) {
		if (value !== null) {
			notificationSetting = value;
		} else {
			//standard value
			notificationSetting = true;
		}
		document.getElementById("NotificationSettingCheckbox").checked = notificationSetting;
	});
	generalUserDataStore.getItem("debgugLoggingSetting").then(function(value) {
		if (value !== null) {
			debgugLoggingSetting = value;
		} else {
			//standard value
			debgugLoggingSetting = false;
		}
		document.getElementById("DebugLoggingSettingCheckbox").checked = debgugLoggingSetting;
		// if its true, display the logging field
		switchDisplayDebugField();
	});
	generalUserDataStore.getItem("earlyAccessSetting").then(function(value) {
		if (value !== null) {
			earlyAccessSetting = value;
		} else {
			//standard value
			earlyAccessSetting = false;
		}
		document.getElementById("EarlyAccessSettingSettingCheckbox").checked = earlyAccessSetting;
	});
	// nameColor
	// first load it from cache, but always load it from server afterwards
	// after it is loaded init the Color Pickr component I use for the user to set the nameColor
	generalUserDataStore.getItem("nameColor").then(function(value) {
		if (value !== null) {
			nameColor = value;
		}
		fetch("/nameColor").then(function(response) {
			if (response.redirected) {
				return null;
			}
			return response.text();
		}).then(function(nameColor) {
			if (nameColor) {
				// safe the data from network
				generalUserDataStore.setItem('nameColor', nameColor).catch(function(err) {
					debugLogging("settings.js-initSettings(): Error at storing nameColor into indexxeddb: " + err);
				});

				// Color Picker
				const pickr = new Pickr({
					el: '.pickr',
					theme: 'classic',
					inline: true,
					showAlways: true,
					default: nameColor, // default color
					components: {
						// color preview
						preview: true,
						// enables HUE slider
						hue: true,
						// save button
						interaction: { save: true },
					},
					strings: {
						save: 'Speichern'
					}
				});
				// listener on save (button) event
				pickr.on("save", function(color) {
					let newColor = color.toHEXA();
					nameColor = "#" + newColor[0].toString() + newColor[1].toString() + newColor[2].toString();

					// save to indexeddb
					generalUserDataStore.setItem('nameColor', nameColor).catch(function(err) {
						debugLogging("settings.js-openSettings()/Callback: Error at storing nameColor into indexxeddb: " + err);
					});

					// send to server
					fetch("/nameColor", {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({"nameColor": nameColor})});
				});
			} else {
				sessionGotClosed();
			}
		});
	});
}

let errorDisplayChangePassword;

// opens modal/popup and inits all fields in there
function openSettings() {
	// Get the modal
	let modal = document.getElementById("settings");
	// Get the <span> (x) element that closes the modal
	let span = document.getElementById("settingsClose");

	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
		modal.style.display = "none";
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}

	// init error display for change password form
	errorDisplayChangePassword = document.getElementById("ErrorDisplay");

	// detect *Enter* key in last password input field to trigger changePassword() function
	document.getElementById("newPasswordRepeat").addEventListener("keyup", function(event) {
		// Number 13 is the *Enter* key on the keyboard
		if (event.keyCode === 13) {
			changePassword();
		}
	});

	// change notification setting information text
	if (!supportsNotifications) {
		// if browser/device doesnt support notifications we change the appearance of that row
		document.getElementById("NotificationSettingText").innerHTML = "Hier könntest du einstellen, ob du Benachrichtigungen erhalten willst - wenn sie dein Browser unterstützen würde. Tut er aber nicht.";
		document.getElementById("NotificationSettingCheckbox").disabled = true;
		document.getElementById("NotificationSettingCheckbox").checked = false;
	} else if (!grantedNotifications && grantedNotifications !== null) {
		// if user didnt grant us permission for notifications we change the appearance of that row
		document.getElementById("NotificationSettingText").innerHTML = "Hier könntest du einstellen, ob du Benachrichtigungen erhalten willst - sobald du mir die Rechte erteilt hast, überhaupt welche zu senden.";
		document.getElementById("NotificationSettingCheckbox").disabled = true;
		document.getElementById("NotificationSettingCheckbox").checked = false;
	}

	// show the modal
	modal.style.display = "block";
}

function changePassword() {
	// check that no fields are empty
	// check that new passwords match each other
	// check that new password is at least 8 characters long
	let oldPassword = document.getElementById("oldPassword").value;
	let newPassword = document.getElementById("newPassword").value;
	let newPasswordRepeat = document.getElementById("newPasswordRepeat").value;

	if (!oldPassword) {
		showChangePasswordErrorMessage("Please enter your old password");
		return;
	}
	if (!newPassword) {
		showChangePasswordErrorMessage("Please enter a new password");
		return;
	}
	if (!newPasswordRepeat) {
		showChangePasswordErrorMessage("Please repeat your new password");
		return;
	}
	if (newPassword !== newPasswordRepeat) {
		showChangePasswordErrorMessage("Both new passwords must match");
		return;
	}
	if (newPassword.length < 8) {
		showChangePasswordErrorMessage("Passwort muss mindestens 8 Zeichen lang sein!");
		return;
	}
	hideChangePasswordErrorMessage();

	// send data to server and display response
	let postData = {
		"oldPassword" : oldPassword,
		"newPassword" : newPassword
	}

	fetch('/changePassword', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(postData)
	})
	.then(function (response) {
		response.text().then(function (text) {
			showChangePasswordErrorMessage(text);
		});
	})
	.catch(function (error) {
		debugLogging("settings.js-changePassword(): Error at POST /changePassword: " + error);
	});
}

function showChangePasswordErrorMessage(message) {
	errorDisplayChangePassword.innerHTML = message;
	errorDisplayChangePassword.style.color = "var(--card-bg-color-2)";
	errorDisplayChangePassword.style.display = "block";
}

function hideChangePasswordErrorMessage() {
	errorDisplayChangePassword.style.display = "none";
}

// because the setting is displayed as checkbox slider
//  there are always only two options (on or off) so we just switch on click
// depending on status we subscribe or unsubscribe user from notifications afterwards
function switchNotificationSetting() {
	notificationSetting = !notificationSetting;

	if (!notificationSetting) {
		// actually unsubscribe
		unsubscribeUser();
	} else {
		// subscribe
		subscribeUser();
	}

	generalUserDataStore.setItem('notificationSetting', notificationSetting).catch(function(err) {
		debugLogging("settings.js-switchNotificationSetting(): Error at storing notificationSetting into indexxeddb: " + err);
	});
}

// because the setting is displayed as checkbox slider
//  there are always only two options (on or off) so we just switch on click
// depending on status we display or hide the logging field
function switchDebugLoggingSetting() {
	debgugLoggingSetting = !debgugLoggingSetting;

	switchDisplayDebugField();

	generalUserDataStore.setItem('debgugLoggingSetting', debgugLoggingSetting).catch(function(err) {
		debugLogging("settings.js-switchDebugLoggingSetting(): Error at storing debgugLoggingSetting into indexxeddb: " + err);
	});
}

// show or hide the debug logging field
function switchDisplayDebugField() {
	if (debgugLoggingSetting) {
		document.getElementById("DebugField").style.display = "block";
	} else {
		document.getElementById("DebugField").style.display = "none";
	}
}

// because the setting is displayed as checkbox slider
//  there are always only two options (on or off) so we just switch on click
function switchEarlyAccessSettingSetting() {
	earlyAccessSetting = !earlyAccessSetting;

	if (earlyAccessSetting) {
		showPageVersion(" EA active");
	} else {
		showPageVersion();
	}

	generalUserDataStore.setItem('earlyAccessSetting', earlyAccessSetting).catch(function(err) {
		debugLogging("settings.js-switchEarlyAccessSettingSetting(): Error at storing earlyAccessSetting into indexxeddb: " + err);
	});
}
