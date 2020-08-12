let usernameInput;
let passwordInput;

let errorDisplay;

function initApp() {
	usernameInput = document.getElementById("username");
	passwordInput = document.getElementById("password");
	errorDisplay = document.getElementById("ErrorDisplay");

	document.getElementById("loginButton").addEventListener('click', function() {
		postLogin();
	});

	// detect enter key in password input field to trigger postLogin() function
	passwordInput.addEventListener("keyup", function(event) {
		// Number 13 is the "Enter" key on the keyboard
		if (event.keyCode === 13) {
			postLogin();
		}
	});
}

// send login attempt to server and handle the response (show error or redirect to main page)
function postLogin() {
	let username = usernameInput.value;
	if (!username) {
		showErrorMessage("Please enter a username");
		return;
	}
	let password = passwordInput.value;
	if (!password) {
		showErrorMessage("Please enter a password");
		return;
	}

  fetch('/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({username: username, password: password})
	}).then(response => {
    response.text().then(data => {
			if (data === "/") {
				window.location.href = "/";
				return;
			}
      showErrorMessage(data);
    });
  });
}

function showErrorMessage(message) {
	errorDisplay.innerHTML = message;
	errorDisplay.style.color = "var(--player-object-color)";
}

document.addEventListener('DOMContentLoaded', initApp);
