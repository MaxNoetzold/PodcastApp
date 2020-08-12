/*
	- I use shaka-player as backend system for the playback of DASH and HLS streams
	   (there would have been Dash.js as well, but their download/offline system is
	   not working well yet)
	- I use Plyr player as frontend system; it handles the visuals
*/

// init shaka-player and plyr player
function initPlayers() {
	// Install built-in polyfills to patch browser incompatibilities.
	shaka.polyfill.installAll();
	// Check to see if the browser supports the basic APIs Shaka needs.
	if (!shaka.Player.isBrowserSupported()) {
		// This browser does not have the minimum set of APIs we need.
		debugLogging("players.js-initPlayers(): Browser does not support shaka player!");
		return;
	}
	// Everything looks good!

	// init shaka player
	initShakaPlayer();
	// init Plyr Player Overlay
	initPlyr();
}

function initShakaPlayer() {
	let player = new shaka.Player(audioPlayer);

	// configure error listener
	player.addEventListener('error', onErrorEvent);
	// Attach player to the window to make it easy to access in the JS console.
	window.player = player;

	// ios does not support the way of playback shakas offline solution needs: MediaSource
	if (!isios) {
		// init storage incl. progress callback
		window.storage = new shaka.offline.Storage(player);
		window.storage.configure({offline: { progressCallback: setDownloadProgress }});
	}
}
function onErrorEvent(event) {
	// Extract the shaka.util.Error object from the event.
	onError(event.detail);
}
async function onError(error) {
	// Log the error.
	debugLogging("players.js-onError(): Shaka Player Error code: " + error.code + " object: " + error);

	if (error === null) {
		debugLogging("players.js-onError(): Shaka Player Error == null");
	}
}

function initPlyr() {
	// define which controls will be shown
	let controls = [
		'rewind', // Rewind by the seek time (default 10 seconds)
		'play', // Play/pause playback
		'fast-forward', // Fast forward by the seek time (default 10 seconds)
		'progress', // The progress bar and scrubber for playback and buffering
		'mute', // Toggle mute
		'volume', // Volume control
		'settings', // Settings menu (which will be in my case only speed)
		'airplay', // Airplay (currently Safari only)
	];
	// initialize plyr player on top of the shaka player
	let player = new Plyr('#player', {
		'controls': controls,
		'speed': { selected: 1, options: [0.5, 0.75, 1, 1.5, 2, 2.5, 3] },
		'settings': ['speed']
		});
}

// load the last podcast the user listened to on this device
// but without start playing it
function loadLastPlayed() {
	getLastPlayed().then(function(result) {
		if (result) {
			loadNewManifestIntoPlayer(true);
		}
	});
}

// load manifest into player and make the player visible
function loadNewManifestIntoPlayer(initLoad = false) {
	if (isios) {
		/* ios is so fucked up */
		audioPlayer.src = manifestUri; // to be able to stream through ios own streammanager
		startNewPlay(initLoad);
	} else {
		// load offline manifest if downloaded or online manifest if not
		isManifestDownloaded(manifestUri).then(function (offlineUri) {
			// online manifest
			if (offlineUri === null) {
				window.player.load(manifestUri).then(function() {
					debugLogging("players.js-loadNewManifestIntoPlayer(): The online audio has now been loaded!");
					// when finished show player
					startNewPlay(initLoad);
				}).catch(onError);
			// offlinemanifest
			} else {
				window.player.load(offlineUri).then(function() {
					debugLogging("players.js-loadNewManifestIntoPlayer(): The offline audio has now been loaded!");
					// when finished show player
					startNewPlay(initLoad);
				}).catch(onError);
			}
		});
	}
}

// display the player DOM element and start play as long as its not the init load
function startNewPlay(initLoad) {
	// set footer width depending on scroll bar width
	initFooterWidth();

	// display name of current playing podcast
	document.getElementById("informationFooter").innerHTML = currentPlayingName;
	// display the duration of the podcast
	document.getElementById("timeFooterDuration").innerHTML = currentPlayingDuration;

	// make the whole footer visible (information + plyr player css)
	document.getElementById("footer").style.visibility = "visible";
	// fast-forward to stored time in podcastTimers.js
	setPlayerTimer();
	// play :)
	if (!initLoad) {
		audioPlayer.play();
	}
}

// when the play event happens (on play and skip) this gets called
// to store the progress of the current podcast episode
// every 60 seconds we send the current podcastTimers to the server
function onAudioPlay() {
	// skipping in the play will call this again
	// start the saving of the times
	savePodcastTimer();
	setTimeout(sendPodcastTimers, 60000); //on server all 60secs
}

// loads lastPlayedManifest, lastPlayedName, lastPlayedDuration from indexeddb
//  and stores the information into the corresponding global variables
function getLastPlayed() {
	return generalUserDataStore.getItem("lastPlayedManifest").then(function(value) {
		if (value) {
			manifestUri = value;
			return generalUserDataStore.getItem("lastPlayedName").then(function(value) {
				if (value) {
					currentPlayingName = value;
					return generalUserDataStore.getItem("lastPlayedDuration").then(function(value) {
						if (value) {
							currentPlayingDuration = value;
							return true;
						} else {
							return false;
						}
					}).catch(function(err) {
						debugLogging("players.js-getLastPlayed(): Error for lastPlayedDuration: " + err);
					});
				} else {
					return false;
				}
			}).catch(function(err) {
				debugLogging("players.js-getLastPlayed(): Error for lastPlayedName: " + err);
			});
		} else {
			return false;
		}
	}).catch(function(err) {
		debugLogging("players.js-getLastPlayed(): Error for lastPlayedManifest: " + err);
	});
}

// stores lastPlayedManifest, lastPlayedName, lastPlayedDuration in indexeddb
// gets called by onClick function of the play button in guiFunctions.js
function storeLastPlayed() {
	generalUserDataStore.setItem('lastPlayedManifest', manifestUri).catch(function(err) {
		debugLogging("players.js-storeLastPlayed(): Error for lastPlayedManifest: " + err);
	});
	generalUserDataStore.setItem('lastPlayedName', currentPlayingName).catch(function(err) {
		debugLogging("players.js-storeLastPlayed(): Error for lastPlayedName: " + err);
	});
	generalUserDataStore.setItem('lastPlayedDuration', currentPlayingDuration).catch(function(err) {
		debugLogging("players.js-storeLastPlayed(): Error for lastPlayedDuration: " + err);
	});
}
