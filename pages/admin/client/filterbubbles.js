
let newBubErrorDisplay;
let editBubErrorDisplay;
// to save which title is edited right now
let editBubbleTitle;

/*
  NEW FILTERBUBBLE FUNCTIONS
    openNewFilterbubblePopup()
    addNewFilterbubble()
*/

function openNewFilterbubblePopup() {
  // reset the input of all fields
  document.getElementById("newFilterbubbleTitle").value = "";
  document.getElementById("newFilterbubbleCategories").value = "";
  // init error display
  newBubErrorDisplay = document.getElementById("newFilterbubbleErrorDisplay");
  newBubErrorDisplay.style.display = "none";

  openPopup("newFilterbubble", "/admin/filterbubbles");
}

/*
  addNewFilterbubble
  - button function of the "New Filter Bubble" Popup
  - reads input data, formats it, sends it to server and shows response
*/
function addNewFilterbubble() {
  // check if all inputs are full
  if (!document.getElementById("newFilterbubbleTitle").value) {
    showErrorMessageForPopup("Title needed!", newBubErrorDisplay);
    return;
  }
  if (!document.getElementById("newFilterbubbleCategories").value) {
    showErrorMessageForPopup("At least one category needed!", newBubErrorDisplay);
    return;
  }

  // get all specified categories
  let categories = document.getElementById("newFilterbubbleCategories").value.split(",");
  for (i = 0; i < categories.length; i++) {
    // remove spaces from beginning and end
    categories[i] = categories[i].trim();
  }

  // create filter bubble object
  let bubble = {
    "title": document.getElementById("newFilterbubbleTitle").value,
    "categories": categories
  };

  // send filter bubble object to server and show response
  fetch('/admin/addFilterbubble', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(bubble)
	}).then(response => {
    response.text().then(data => {
      showErrorMessageForPopup(data, newBubErrorDisplay);
    });
    // if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("filterbubblesPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					filterbubblesPageContent = response;
					newContentAvailable = true;
				}
			});
		}
  });
}

/*
  EDIT FILTERBUBBLE FUNCTIONS
    openEditBubblePopup()
    editFilterbubble()
*/

function openEditBubblePopup(title) {
  // init error display
  editBubErrorDisplay = document.getElementById("editFilterbubbleErrorDisplay");
  editBubErrorDisplay.style.display = "none";

  // get the latest data from server to init the popup; then show it
  fetch("/admin/getFilterbubble" + "?title=" + title, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }).then(response => {
    if (response.status === 404) {
      response.text().then(data => {
        showErrorMessageForPopup(data, editPodErrorDisplay);
        openPopup("editFilterbubble", "/admin/filterbubbles")
      });
      return;
    }
    response.json().then(data => {
      data = data[0];
      editBubbleTitle = data.title;
      document.getElementById("editFilterbubbleTitle").value = data.title;
      document.getElementById("editFilterbubbleCategories").value = data.categories;

      openPopup("editFilterbubble", "/admin/filterbubbles")
    });
  });
}

/*
  editFilterbubble
  - button function of the "Edit Filter Bubble" Popup
  - reads input data, formats it, sends it to server and shows response
*/
function editFilterbubble() {
  // check if there is still at least one category left
  if (!document.getElementById("editFilterbubbleCategories").value) {
    showErrorMessageForPopup("At least one category needed!", editBubErrorDisplay);
    return;
  }

  // get all categories
  let categories = document.getElementById("editFilterbubbleCategories").value.split(",");
  for (i = 0; i < categories.length; i++) {
    // remove spaces from beginning and end
    categories[i] = categories[i].trim();
  }
  // create filter bubble object
  let bubble = {
    "title": editBubbleTitle,
    "categories": categories
  }

  // send filter bubble object to server and show response
  fetch('/admin/editFilterbubble', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(bubble)
	}).then(response => {
    response.text().then(data => {
      showErrorMessageForPopup(data, editBubErrorDisplay);
    });
    // if response is no error load new data
		if(response.status === 200) {
			// load the new data from the server
			loadModulePage("filterbubblesPage").then(function(response) {
				// save new page content to the variable
				// set newContentAvailable so page gets reloaded on close of modal
				if (response) {
					filterbubblesPageContent = response;
					newContentAvailable = true;
				}
			});
		}
  });
}
