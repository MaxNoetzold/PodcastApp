/*
	Downloading Module (Client)
	 handles the download of podcast episodes

	 Main Functions:
	   initDownloads():
		 - init everything that is needed for downloads to work on load:
	 	  - ask for persistent storage (so the downloaded content cant be deleted without the consent of the user)
	 	  - get max storage space
		 initDownloadButton(manifestID):
		 - change the appearence of the download button if the manifest of this button is downloaded
		 - for now for ios: dont display the button
		 - calculate the estimatedUsedStorage
		 onDownloadClick(event, manifestID, downloadSize):
		 - is the onClick function for the download buttons
		 - deletes already downloaded content
		 - downloads new content
		 - aborts downloading
*/

//downloading variables
	// string with content of downloading manifestID
	// if nothing is downloading its null
		// fyi:
		// shaka player recently changed that one can download multiple streams in parallel
		// I will not implement it as it doesnt make anything better in my case
		// its just more work
let isDownloading;
	// how much storage usable over all
let quotaStorage;
	// how much storage we actually use right now
	// (not the storage indexeddb actually uses bc chrome (maybe other browsers as well)
	// have a bug which causes them to really fuck the indexedDB cleaning up
	// https://bugs.chromium.org/p/chromium/issues/detail?id=488851
let estimatedUsedStorage;
  // shaka player now returns an "AbortableOperation" when one uses window.storage.store
	// with that it is possible to abort the download, to do so we have to safe it globally
	// so if the download button is clicked and abortableOperation is defined we abort the download
let abortableOperation;


/*
	initDownloads
		init everything that is needed for downloads to work on load:
		- ask for persistent storage (so the downloaded content cant be deleted without the consent of the user)
		- get max storage space
*/
function initDownloads() {
	isDownloading = null;
	estimatedUsedStorage = 0;

	// persistent storage stuff
	if (navigator.storage && navigator.storage.persist)
		navigator.storage.persist().then(function(persistent) {
			if (persistent)
				debugLogging("download.js-initDownloads(): Storage will not be cleared except by explicit user action");
			else
				//TODO: Test if all cells of downloaded content are still there

				// request user to give persistent storage if available
				if (!navigator.storage.requestPersistent) {
					debugLogging("download.js-initDownloads(): We cant even ask the user for persistent storage");
					return;
				}
				navigator.storage.requestPersistent().then(function(granted) {
					if (granted) {
						debugLogging("download.js-initDownloads(): We got persistent storage ma bois");
					} else {
						debugLogging("download.js-initDownloads(): Its a hard knock life (no persistent storage)");
					}
				});
	});

	// get max quotaStorage
	if (navigator.storage) {
		navigator.storage.estimate().then(function(answer) {
			quotaStorage = Math.ceil((answer.quota - 20000000)/1000000); //subtract 20mb for all other cach objects and divide to get mb
			debugLogging("download.js-initDownloads(): Available Storage Space (Storage Quota): " + quotaStorage);
		}).catch(function(error) {
			debugLogging("download.js-initDownloads(): Storage Quota could not been calculated: " + error);
		});
	} else {
		debugLogging("download.js-initDownloads(): navigator.storage not available F");
	}
}

/*
	initDownloadButton
		- for now: if isIOS: dont display button
		- if the manifest is downloaded change the design to Delete
		- calculate the estimatedUsedStorage

		gets called by renderCard() in guiLoader
*/
function initDownloadButton(manifestID) {
	let downloadButton = document.getElementById("downloadButton/" + manifestID);

	// check if ios
	// download for ios doesnt work rn so button doesnt get displayed
	if (isios) {
		downloadButton.parentNode.removeChild(downloadButton);
	}
	// is the manifest of this button downloaded?
	isManifestDownloaded(getManifestUri(manifestID)).then(function (offlineUri) {
		// if there is no offlineUri, there is no download --> return
		if (offlineUri === null) {
			return;
		}
		// otherwise change the button and calculate the new estimatedUsedStorage
		changeDownloadButtonAppearance(downloadButton, "Delete")
		estimatedUsedStorage +=	parseInt(downloadButton.getAttribute("downloadsize"));
	});
}

/*
	onDownloadClick
		function that gets called when a user clicks on the [Download] button
		depending on download status calling
		- onDownloadClickAbort
		- onDownloadClickDelete
		- onDownloadClickDownload
*/
function onDownloadClick(event, manifestID, downloadSize) {
  // this function calls itself but then without $event bc its not needed anymore
	if (event) {
		// the card should not turn if a button is clicked
		event.stopPropagation();
	}
	let manifestDownloadUri = getManifestUri(manifestID);
	let downloadButton = document.getElementById("downloadButton/" + manifestID);

	// change appearance to Waiting Button
	changeDownloadButtonAppearance(downloadButton, "Waiting");

	// only one download at a time (is possible with shaka-player)
	// wait 300ms and try again by calling this function again
	if (isDownloading) {
		// abort if the button clicked is the same as the active download
		if (isDownloading === manifestID) {
			onDownloadClickAbort(downloadButton);
			return;
		}
		setTimeout(onDownloadClick, 300, null, manifestID, downloadSize);
	} else {
		isDownloading = manifestID;

		// get offline indexedDB Link (if already downloaded)
		isManifestDownloaded(manifestDownloadUri).then(function (offlineUri) {

			// check if already downloaded -> Delete
			if (offlineUri != null) {
				// TODO Popup for confirmation
				onDownloadClickDelete(downloadButton, offlineUri, downloadSize);
				return;
			}

			// check if there is enough storage space left
			// if no tell user by changing appearance of download button
			if (!isEnoughSpaceLeft(downloadSize)) {
				changeDownloadButtonAppearance(downloadButton, "Full");
				isDownloading = null;
				return;
			}

			// download
			onDownloadClickDownload(downloadButton, manifestID, downloadSize);
		});
	}
}

// this doesnt work fully rn
// as soon as one aborts a download one can never again start this download until you reload the page
// probably a bug of shaka player bc of this issue: https://github.com/google/shaka-player/issues/2417 in combination with https://github.com/google/shaka-player/issues/2432
// so this is the state of this issue: https://github.com/google/shaka-player/issues/2781
function onDownloadClickAbort(downloadButton) {
	// if the button is actually downloading rn, we abort the download
	//  (this is the same as abortableOperation != null && isDownloading === manifestID)
	if (abortableOperation != null) {
		abortableOperation.abort().then(() => {
			abortableOperation = null;
			isDownloading = null;

			debugLogging("download.js-onDownloadClickAbort(): Download aborted");
			// probably is the storage full
			changeDownloadButtonAppearance(downloadButton, "Download");
		});

	}
}
function onDownloadClickDelete(downloadButton, offlineUri, downloadSize) {
	// change button text to deleting
	changeDownloadButtonAppearance(downloadButton, "Deleting");
	removeContent(offlineUri).then(async function()
		{
			// Removal is finished
			debugLogging("download.js-onDownloadClickDelete(): Download got removed");
			// change back to Download Button
			changeDownloadButtonAppearance(downloadButton, "Download");
			// calculate new estimatedUsedStorage
			estimatedUsedStorage -= downloadSize;
			debugLogging("download.js-onDownloadClickDelete(): new estimatedUsedStorage: " + estimatedUsedStorage);
			// Finished, next download button process can be started
			isDownloading = null;
		}
	);
}

function isEnoughSpaceLeft(downloadSize) {
	if (quotaStorage != null && quotaStorage < estimatedUsedStorage + downloadSize) {
		debugLogging("download.js-isEnoughSpaceLeft(): Actually not enough storage place left (not only chrome bug)");
		return false;
	}
	return true;
}

function onDownloadClickDownload(downloadButton, manifestID, downloadSize) {
	// change appearance to Downloading Button
	changeDownloadButtonAppearance(downloadButton, "Downloading");

	let manifestDownloadUri = getManifestUri(manifestID);

	// Construct a metadata object to be stored alongside the content.
	// This can hold any information we want to store with the content
	let metadata = {
		'title': manifestID,
		'downloaded': new Date()
	};

	abortableOperation = window.storage.store(manifestDownloadUri, metadata);
	abortableOperation.chain(function(storedContent) { onDownloadSuccess(downloadButton, downloadSize, storedContent)}, function(error) {onDownloadError(error, downloadButton)});
}

function onDownloadSuccess(downloadButton, downloadSize, storedContent) {
	// reset abortableOperation (so you cant abort it after we already finished)
	abortableOperation = null;
	//console.log(storedContent);

	debugLogging("download.js-onDownloadClickDownload(): Download finished");
	// change to Delete Button
	changeDownloadButtonAppearance(downloadButton, "Delete");
	// calculate new estimatedUsedStorage
	estimatedUsedStorage += downloadSize;
	debugLogging("download.js-onDownloadClickDownload(): new estimatedUsedStorage: " + estimatedUsedStorage);

	isDownloading = null;
	return;
}
function onDownloadError(error, downloadButton) {
	if (error === null) {
		debugLogging("download.js-onDownloadClickDownload(): Storage space full (probably chrome bug)");
		// probably is the storage full
		changeDownloadButtonAppearance(downloadButton, "Full");
	} else if (error.code === 7001) {
		console.log(error)
		// Error Code 7001: Operation Aborted
		console.log("aborted onDownloadError")
		changeDownloadButtonAppearance(downloadButton, "Download");
	} else {
		debugLogging("download.js-onDownloadClickDownload(): Error at downloading content: " + error);
	}
	abortableOperation = null;
	isDownloading = null;
	// In the case of an error, re-enable the download button so
	// that the user can try the download again.
	downloadButton.disabled = false;
}

function changeDownloadButtonAppearance(downloadButton, caseIndex) {
	switch(caseIndex) {
		case "Download":
			downloadButton.disabled = false;
			downloadButton.text = "Download";
			downloadButton.style = "background-color:var(--main-object-color);";
			break;
		case "Waiting":
			downloadButton.disabled = true;
			downloadButton.text = "Waiting";
			downloadButton.style = "background-color:#67c76b;";
			break;
		case "Delete":
			downloadButton.disabled = false;
			downloadButton.text = "Delete";
			downloadButton.style = "background-color:#678e9e;";
			break;
		case "Full":
			downloadButton.disabled = false;
			downloadButton.text = "Speicher voll";
			downloadButton.style = "background-color:red";
			break;
		case "Downloading":
			downloadButton.disabled = false;
			downloadButton.text = "Downloading";
			downloadButton.style = "background-color:#67c76b;";
			break;
		case "Deleting":
			downloadButton.disabled = false;
			downloadButton.text = "Deleting";
			downloadButton.style = "background-color:#678e9e;";
			break;
	}
}

// array of all downloaded manifests
function listContent() {
	return window.storage.list();
}

function removeContent(offlineUri) {
	return window.storage.remove(offlineUri);
}

// is the podcast already downloaded?
//	if yes return offlineUri
//	if no return null
function isManifestDownloaded(manifestUri) {
	return listContent().then(function(downloads) {
		if (!downloads || downloads === null) {
			return null;
		}

		for (let i = 0; i < downloads.length; i++) {
			if (downloads[i].originalManifestUri === manifestUri) {
				return downloads[i].offlineUri;
			}
		}
		return null;
	});
}

/*
	setDownloadProgress
	 - callback defined in player.js for downloading
	 - shows download progress as percentage on Download button
*/
function setDownloadProgress(content, progress) {
	let manifestName = content.originalManifestUri.split('/')[2].split('-')[0];
	document.getElementById("downloadButton/" + manifestName).text =
			"Downloading: " + Math.floor(progress * 100) + "%";
}
