
let newPodErrorDisplay;
let editPodErrorDisplay;

/*
  NEW PODCAST FUNCTIONS
    openNewPodcastPopup()
    saveNewPodcast()
*/
function openNewPodcastPopup() {
  // reset the input of all fields
  document.getElementById("newPodTitle").value = "";
  document.getElementById("newPodCategory").value = "";
  document.getElementById("newPodDate").value = "";
  document.getElementById("newPodManifestID").value = "";
  document.getElementById("newPodSize").value = "";
  document.getElementById("newPodLength").value = "";
  document.getElementById("newPodcastErrorDisplay").style.display = "none";

  openPopup("newPodcast", "/admin");
  // init error display
  newPodErrorDisplay = document.getElementById("newPodcastErrorDisplay");
}

function saveNewPodcast() {
  // check if all inputs are specified
  if (!document.getElementById("newPodTitle").value) {
    showErrorMessageForPopup("Title needed!", newPodErrorDisplay);
    return;
  }
  if (!document.getElementById("newPodCategory").value) {
    showErrorMessageForPopup("Category needed!", newPodErrorDisplay);
    return;
  }
  if (!document.getElementById("newPodDate").value) {
    showErrorMessageForPopup("Date needed!", newPodErrorDisplay);
    return;
  }
  if (!document.getElementById("newPodManifestID").value) {
    showErrorMessageForPopup("Manifest ID needed!", newPodErrorDisplay);
    return;
  }
  if (!document.getElementById("newPodSize").value) {
    showErrorMessageForPopup("Size needed!", newPodErrorDisplay);
    return;
  }
  if (!document.getElementById("newPodLength").value) {
    showErrorMessageForPopup("Length needed!", newPodErrorDisplay);
    return;
  }

  // create podcast object
  let podcast = {
    "title" : document.getElementById("newPodTitle").value,
    "category" : document.getElementById("newPodCategory").value,
    "date" : parseInt(document.getElementById("newPodDate").value),
    "manifestID": document.getElementById("newPodManifestID").value ,
    "size": parseInt(document.getElementById("newPodSize").value),
    "length": parseInt(document.getElementById("newPodLength").value)
  };

  // send podcast object to server and show response
  fetch('/admin/saveNewPodcast', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(podcast),
	}).then(response => {
    response.text().then(data => {
      showErrorMessageForPopup(data, newPodErrorDisplay);
    });
    // if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("podcastsPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					podcastsPageContent = response;
					newContentAvailable = true;
				}
			});
		}
  });
}

/*
  EDIT PODCAST FUNCTIONS
    openEditPodPopup()
    editPodcast()
*/
function openEditPodPopup(manifestID) {
  // init error display
  editPodErrorDisplay = document.getElementById("editPodcastErrorDisplay");
  editPodErrorDisplay.style.display = "none";

  // get the latest data from server to init the popup; then show it
  fetch("/admin/getPodcast" + "?id=" + manifestID, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }).then(response => {
    if (response.status === 404) {
      response.text().then(data => {
        showErrorMessageForPopup(data, editPodErrorDisplay);
        openPopup("editPodcast", "/admin")
      });
      return;
    }
    response.json().then(data => {
      data = data[0]
      document.getElementById("editPodTitle").value = data.title;
      document.getElementById("editPodCategory").value = data.category;
      document.getElementById("editPodDate").value = data.date;
      document.getElementById("editPodManifestID").value = data.manifestID;
      document.getElementById("editPodSize").value = data.size;
      document.getElementById("editPodLength").value = data.length;

      openPopup("editPodcast", "/admin")
    });
  });
}

function editPodcast() {
  // check if all inputs are specified
  if (!document.getElementById("editPodTitle").value) {
    showErrorMessageForPopup("Title needed!", editPodErrorDisplay);
    return;
  }
  if (!document.getElementById("editPodCategory").value) {
    showErrorMessageForPopup("Category needed!", editPodErrorDisplay);
    return;
  }
  if (!document.getElementById("editPodDate").value) {
    showErrorMessageForPopup("Date needed!", editPodErrorDisplay);
    return;
  }
  if (!document.getElementById("editPodManifestID").value) {
    showErrorMessageForPopup("Manifest ID needed!", editPodErrorDisplay);
    return;
  }
  if (!document.getElementById("editPodSize").value) {
    showErrorMessageForPopup("Size needed!", editPodErrorDisplay);
    return;
  }
  if (!document.getElementById("editPodLength").value) {
    showErrorMessageForPopup("Length needed!", editPodErrorDisplay);
    return;
  }

  // create podcast object
  let podcast = {
    "title" : document.getElementById("editPodTitle").value,
    "category" : document.getElementById("editPodCategory").value,
    "date" : parseInt(document.getElementById("editPodDate").value),
    "manifestID": document.getElementById("editPodManifestID").value ,
    "size": parseInt(document.getElementById("editPodSize").value),
    "length": parseInt(document.getElementById("editPodLength").value)
  };

  fetch('/admin/editPodcast', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(podcast),
	}).then(response => {
    response.text().then(data => {
      showErrorMessageForPopup(data, editPodErrorDisplay);
    });
    // if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("podcastsPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					podcastsPageContent = response;
					newContentAvailable = true;
				}
			});
		}
  });
}
