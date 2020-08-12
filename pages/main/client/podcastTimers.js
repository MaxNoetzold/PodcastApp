/*
	podcastTimers is the listen-progress for each podcast episode

	this module handles everything that is involved in it
	 - every second we safe the current progress in indexeddb
	 - every minute we send it to the server
*/

// to save when updateTimers got called last
// because the onAudioPlay() in players.js gets called more often than wanted
let savePodcastTimerCalledtime;
let sendPodcastTimersCalledtime;

// ask server for podcastTimers
// if they are newer than the locally stored ones, we update the latter
function initIndexeddbTimers() {
	// get podcastTimers from server
	fetch("/podcastTimers").then(function(response) {
		if (response.redirected) {
			return null;
		}
		return response.json();
	}).then(function(data) {
		if (data) {
			if (!data.lastModified) {
				return null;
			}

			// compare online version with cached version
			podcastTimerStore.getItem('lastModified').then(function(value) {
				// no cached version -> store and display the network data
				if (!value || value === null) {
					updateAllIndexeddbTimers(data);
					return;
				}
				// network data is newer -> store and display the network data
				if (value < data.lastModified) {
					updateAllIndexeddbTimers(data);
					return;
				}
				// cached version is newer: do nothing
			}).catch(function(err) {
				debugLogging("podcastTimers.js-initIndexeddbTimers(): Error by getting lastModified info from cache: " + err);
			});
		} else {
			sessionGotClosed();
		}
	});
}

// update all cached podcastTimers because the networked version is newer
// display them right after they are stored
function updateAllIndexeddbTimers(timersJSON) {
	podcastTimerStore.setItem('lastModified', timersJSON.lastModified).catch(function(err) {
		debugLogging("podcastTimers.js-updateAllIndexeddbTimers(): Error for lastModified: " + err);
	});

	if (timersJSON.timers) {
		// write them all into the store
		// and update the displayed progress information
		for (let i = 0; i < timersJSON.timers.length; i++) {
			updateIndexeddbTimer(timersJSON.timers[i].manifestUri, timersJSON.timers[i].currentTime, null).then(() => {
				initProgress(timersJSON.timers[i].manifestUri.split('/')[2].split('-')[0]);
			});
		}
	}
}

// updated (or generate) the saved PodcastTimer entry
function updateIndexeddbTimer(manifestLink, currentTime, lastModified) {
	if (lastModified) {
		// update the lastModified
		podcastTimerStore.setItem('lastModified', lastModified).catch(function(err) {
			debugLogging("podcastTimers.js-updateIndexeddbTimer(): Error for lastModified: " + err);
		});
	}

	// update the changed entry
	return podcastTimerStore.setItem(manifestLink, currentTime).catch(function(err) {
		debugLogging("podcastTimers.js-updateIndexeddbTimer(): Error for " + manifestLink +": " + err);
	});
}

// get timer from indexeddb and set the current audio playback to that timer
function setPlayerTimer() {
	podcastTimerStore.getItem(manifestUri).then(function(value) {
		// no cached version -> we start at 0:00
		if (!value || value === null) {
			return;
		}
		// change player playback time to stored value
		audioPlayer.currentTime = value;

		// set the displayed timer to current playback time
		updateProgressInPlayerFooter(audioPlayer.currentTime);

	}).catch(function(err) {
		debugLogging("podcastTimers.js-setPlayerTimer(): Error by getting saved timers from cache: " + err);
	});
}

// save and display (in the belonging card and in the footer)
//  the current playback time every second locally (in indexeddb)
function savePodcastTimer() {
	if (!audioPlayer) {
		return;
	}

	let date = new Date();

	// display the progress in the belonging card and in the footer
	updateProgress(manifestUri, audioPlayer.currentTime);

	// on first call we dont have to save it bc its definitly the same
	if (!savePodcastTimerCalledtime || savePodcastTimerCalledtime === null) {
		savePodcastTimerCalledtime = date.getTime();
		setTimeout(savePodcastTimer, 1000);
		return;
	}
	// check that this function doesnt get called too often (more than every second)
	let calc = date.getTime() - savePodcastTimerCalledtime;
	if (savePodcastTimerCalledtime && calc < 900) {
		return;
	}

	// save the timer
	savePodcastTimerCalledtime = date.getTime();
	updateIndexeddbTimer(manifestUri, audioPlayer.currentTime, date.getTime());

	// only call this function again if the player is not paused
	if (!audioPlayer.paused) {
		setTimeout(savePodcastTimer, 1000);
	} else {
		savePodcastTimerCalledtime = null;
	}
}

// send all saved podcast timers to the server
// gets called every minute as long as the music is playing
function sendPodcastTimers() {
	if (!audioPlayer) {
		return;
	}

	let date = new Date();

	/// check that this function doesnt get called too often (more than every 60 secs)
	let calc = date.getTime() - sendPodcastTimersCalledtime;
	if (sendPodcastTimersCalledtime && calc < 59500) {
		return;
	}

	sendPodcastTimersCalledtime = date.getTime();

	let allTimers = {
		"lastModified" : "",
		"timers" : []
	};

	// go through all elements in the podcastTimers store in indexeddb
	//  and save them in the $allTimers variable which we will then send to the server
	podcastTimerStore.iterate(function(value, key, iterationNumber) {
		if (key === "lastModified") {
			allTimers.lastModified = value;
		} else {
			allTimers.timers.push(
				{
					"manifestUri" : key,
					"currentTime" : value
				}
			);
		}
	}).then(function() {
		// send $allTimers object to server
		fetch('/podcastTimers', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(allTimers),
		})
		.then(function (response) {
			// response doesnt matter right now
			debugLogging("podcastTimers.js-sendPodcastTimers(): Post /podcastTimers Respond: " + response.data);
		})
		.catch(function (error) {
			debugLogging("podcastTimers.js-sendPodcastTimers(): Error by sending allTimers: " + error);
		});
	}).catch(function(err) {
		debugLogging("podcastTimers.js-sendPodcastTimers(): Error by iterating through all timers: " + err);
	});

	// only call this function again if the player is not paused
	if (!audioPlayer.paused) {
		setTimeout(sendPodcastTimers, 60000);
	}
}

// show progress both in card and in player footer
function updateProgress(manifestLink, progress) {
	updateProgressInCard(manifestLink, progress);
	updateProgressInPlayerFooter(progress);
}

// update the displayed progress bar in card
//  $manifestLink is the whole link to the manifest and $progress is the current time played
function updateProgressInCard(manifestLink, progress) {
	if (progress === null) {
		debugLogging("podcastTimers.js-updateProgressInCard(): got called with an empty progress for: " + manifestLink);
		return;
	}

	// get the manifestName out of the manifestLink
	let manifestName = manifestLink.split('/')[2].split('-')[0];

	// update progress bar in card
	let progressBarElement = document.getElementById("progress/" + manifestName);
	if (!progressBarElement || progressBarElement === null) {
		debugLogging("podcastTimers.js-updateProgressInCard(): Progress Bar not found for manifestName: " + manifestName);
		return;
	}
	let maxLength = parseInt(progressBarElement.getAttribute("length"));
	let progressPercent = (progress/maxLength)*100;
	if (progressPercent > 0 && progressPercent < 5) {
		progressPercent = 5;
	}
	progressBarElement.style.width = progressPercent + "%";

	// update progress timer text in card
	let progressTimeElement = document.getElementById("currentTime/" + manifestName);
	if (!progressTimeElement || progressTimeElement === null) {
		debugLogging("podcastTimers.js-updateProgressInCard(): progressTimeElement not found for manifestName: " + manifestName);
		return;
	}
	progressTimeElement.innerHTML = convertSecondsToString(progress);
}

// update the displayed progress bar in footer
// (usually Plyr would do it, but I changed the whole layout and have to do it myself now)
function updateProgressInPlayerFooter(progress) {
	if (progress === null) {
		debugLogging("podcastTimers.js-updateProgressInPlayerFooter(): got called with an empty progress for: " + manifestLink);
		return;
	}

	let timeFooterCurrent = document.getElementById("timeFooterCurrent");
	timeFooterCurrent.innerHTML = convertSecondsToString(progress);
}

// gets called when a card got rendered
// it should display the progress of the cards podcast on that card
// also gets called when new data from the server arrived and shall be displayed
function initProgress(manifestID) {
	let manifestLink = getManifestUri(manifestID);

	podcastTimerStore.getItem(manifestLink).then(function(value) {
		if (value) {
			updateProgressInCard(manifestLink, value);
		}
	}).catch(function(err) {
		// This code runs if there were any errors
		debugLogging("podcastTimers.js-initProgress(): error for element: " + manifestLink + " with error: " + err);
	});
}
