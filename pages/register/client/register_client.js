let usernameInput;
let passwordInput;
let passwortRepeat;

let errorDisplay;

function initApp() {
	usernameInput = document.getElementById("username");
	passwordInput = document.getElementById("password");
	passwortRepeat = document.getElementById("passwordRepeat");
	errorDisplay = document.getElementById("ErrorDisplay");

	document.getElementById("registerButton").addEventListener('click', function() {
		postRegister();
	});

	// detect enter key in last password input field to trigger postRegister() function
	passwortRepeat.addEventListener("keyup", function(event) {
		// Number 13 is the "Enter" key on the keyboard
		if (event.keyCode === 13) {
			postRegister();
		}
	});
}

// send register attempt to server and handle the response (show error or redirect to main page)
function postRegister() {
	let username = usernameInput.value;
	if (!username) {
		showErrorMessage("Please enter a username");
		return;
	}
	if (!passwordInput.value) {
		showErrorMessage("Please enter a password");
		return;
	}
	if (!passwortRepeat.value) {
		showErrorMessage("Please repeat your password");
		return;
	}
	if (passwordInput.value !== passwortRepeat.value) {
		showErrorMessage("Both passwords must match");
		return;
	}
	if (passwordInput.value.length < 8) {
		showErrorMessage("Passwort muss mindestens 8 Zeichen lang sein!");
		return;
	}
	let password = passwordInput.value;

  fetch('/register', {
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
