/* SEND NOTIFICATION PAGE */

function sendNotification() {

	// load the data from html form
	let notificationTitle = document.getElementById("notificationTitle").value;
	let notificationText = document.getElementById("notificationText").value;
	let notificationErrorDisplay = document.getElementById("notificationErrorDisplay");

	// test if all important information have been given
	if (!notificationTitle || notificationTitle === null || !notificationText || notificationText === null) {
		showErrorMessageForPopup("Title and Text necessary!", notificationErrorDisplay);
		return;
	}

	// get all bubbles as array
	let notificationFilterBubbles;
	if (!document.getElementById("notificationFilterBubbles").value) {
		notificationFilterBubbles = []
	} else {
	  notificationFilterBubbles = document.getElementById("notificationFilterBubbles").value.split(",");
	  for (i = 0; i < notificationFilterBubbles.length; i++) {
	    // remove spaces from beginning and end
	    notificationFilterBubbles[i] = notificationFilterBubbles[i].trim();
	  }
	}

	// create notification object
	let notificationJson = {
		title: notificationTitle,
		text: notificationText,
		filterBubbles: notificationFilterBubbles
	};

	// send notification object to server; clear form if response is fine (always when server is running)
	fetch('/admin/sendNotification', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(notificationJson),
	}).then(response => {
		if (response.status === 200) {
			document.getElementById("notificationTitle").value = "";
			document.getElementById("notificationText").value = "";
			document.getElementById("notificationFilterBubbles").value = "";
		}
	});
}
