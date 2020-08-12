// global variables
	// general audio player variables
let audioPlayer; // the html5 <audio> DOM element
let manifestUri; // the current playing manifestUri (always the real link never the offline link)
let currentPlayingName; // the name of the currently playing podcast
let currentPlayingDuration; // the duration of the currently playing podcast

	// indexedDB stores
let podcastTimerStore; // stores the current progress of this user for every podcast episode in seconds
let generalUserDataStore; // stores the different settings of the settings page
let cardStore; // the DOM element that displays the card of every podcast as string
let podcastsMetaStore; // stores an ordered array (for every category) that consists of all podcast names (of that category)

	//Service Worker
let swRegistration = null; // current service worker
let newWorker; // next service worker
let refreshing; // when we swap to next service worker we set this true to be sure we dont refresh multiple times

	// is device ios?
let isios;

	// does the browser/device support notifications
	// only used to display another information text in the settings page
let supportsNotifications;
	// does the user granted us the permission to notify him
	// this is not the same as notificationSetting
	// grantedNotifications is the browser/os permission to show notifications
	// and notificationSetting is the current state of the setting in the settings page
let grantedNotifications;

	//settings
let notificationSetting;
let debgugLoggingSetting;
let earlyAccessSetting;
let nameColor; // color of the name when displayed in the comments section

	// we safe secrets in a file which is in gitignore
let secrets;

const PAGE_VERSION = 24;

let errorBoxShown;


function initApp() {
	// prototype functions that will return *current real date + time* on later use
	// currently only used in comments.js
	Date.prototype.today = function () {
		return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
	}
	Date.prototype.timeNow = function () {
		return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
	}

	// init global variables
	audioPlayer = document.querySelector('#player');
	manifestUri = '';
	allCards = [];
	secrets = getSecrets();

	// in this file
	isios = iOS();
	initIndexeddb();

	// in players.js
	initPlayers();

	// in guiLoader.js
	showPageVersion();
	renderOneRowOfCards();

	// in settings.js
	initSettings();

	// in download.js
	initDownloads();

	// in podcastTimers.js
	initIndexeddbTimers();

	// notifications.js
	initNotifications();

	// in guiLoader.js
	getNewPodcasts();

	// now load the last podcast the user listened to on this device
	loadLastPlayed();

	// in comments.js
	initCommentInfos();
}

/*
	debugLogging
	 logs are written in html element
	 which can be shown by user (in settings page)
*/
function debugLogging(message) {
	let debugP = document.getElementById("DebugText");
	debugP.innerHTML += message + " ||<br>";
	debugP.style.color = "white";
}

/*
	initIndexeddb
	 initialise the indexedDB stores
*/
function initIndexeddb() {
	localforage.config({
		driver: localforage.INDEXEDDB,
		name: 'UserData',
	});
	podcastTimerStore = localforage.createInstance({
		storeName: 'PodcastTimers'
	});
	generalUserDataStore = localforage.createInstance({
		storeName: 'GeneralUserData'
	});
	podcastsMetaStore = localforage.createInstance({
		storeName: 'PodcastsMetaStore'
	});
	cardStore = localforage.createInstance({
		storeName: 'CardStore'
	});
}

/*
	iOS
	 returns if device is an ios device
*/
function iOS() {

	var iDevices = [
		'iPad',
		'iPhone',
		'iPod'
	];

	if (!!navigator.platform) {
		while (iDevices.length) {
			if (navigator.platform === iDevices.pop()){ return true; }
		}
	}

	return false;
}

/*
	showAlertBox
	 shows the alertbox on top of the screen
	 $priority: 1 (highest) -> 4 (lowest)
*/
function showAlertBox(messageText, buttonText, clickFunction, priority) {
	// only show one error box at a time
	if (errorBoxShown) {
		return;
	}
	errorBoxShown = true;
	let color;
	switch (priority) {
		case 1:
			color = "var(--card-bg-color-2)";
			break;
		case 2:
			color = "var(--card-bg-color-3)";
			break;
		case 3:
			color = "var(--card-bg-color-4)";
			break;
		default:
			color = "var(--card-bg-color-1)";
			break;
	}

	let alertBox = document.getElementById("alertBox");
	alertBox.style.backgroundColor = color;

	let message = document.createElement("p");
	message.classList.add("alertLeft");
	message.innerHTML = messageText;
	alertBox.appendChild(message);

	if (clickFunction) {
		let loginButton = document.createElement("a");
		loginButton.classList.add("alertRight");
		loginButton.classList.add("button");
		loginButton.style.width = "auto";
		loginButton.innerHTML = buttonText;
		//add onClick
		loginButton.addEventListener('click', clickFunction);
		alertBox.appendChild(loginButton);
	}

	alertBox.style.visibility = "visible";
}

/*
	sessionGotClosed
	 inform user with an alert box that session got closed
	 (the session cookie times out after one month)
*/
function sessionGotClosed() {
	debugLogging("main_client.js-sessionGotClosed(): Session got closed pls relogg");

	let messageText = "Session serverseitig beendet. Bitte neu einloggen, damit du auch die aktuellsten Podcasts erhalten kannst.";
	let buttonText = "Login";

	let clickFunction = function() {
		window.location.href = "/login";
	};

	showAlertBox(messageText, buttonText, clickFunction, 1);
}

/*
	convertSecondsToString
	 converts a rational number that represents seconds
	 (thats how we save times of the podcast (length & progress))
	 to string in hh:mm:ss format
*/
function convertSecondsToString(fullTime) {
	let completeMinutes = Math.floor(fullTime / 60);
	let completeSeconds = Math.floor(fullTime % 60);
	// add a zero in front if needed (seconds < 10)
	if (completeSeconds < 10) {
		completeSeconds = "0" + completeSeconds;
	}
	if (completeMinutes === 0) {
		return "00:" + completeSeconds;
	}
	if (completeMinutes <= 59) {
		return (completeMinutes + ":" + completeSeconds);
	}
	if (completeMinutes > 59) {
		let completeHours = Math.floor(completeMinutes / 60);
		completeMinutes = completeMinutes % 60;
		// add a zero in front if needed (minutes < 10)
		if (completeMinutes < 10) {
			completeMinutes = "0" + completeMinutes;
		}
		return (completeHours + ":" + completeMinutes + ":" + completeSeconds);
	}
}

/*
	getManifestUri
	 returns uri for the podcast manifest for manifestID
*/
function getManifestUri(manifestID) {
	if (isios) {
		return "/podcast-episodes/" + manifestID + "-hls/main.m3u8";
	} else {
		return "/podcast-episodes/" + manifestID + "/out_audio_dash.mpd";
	}
}


document.addEventListener('DOMContentLoaded', initApp);
