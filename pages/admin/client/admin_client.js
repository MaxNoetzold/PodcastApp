/* GENERAL ADMIN PAGE */

let router; // client side routing with vanilla-router

// content of the $admin-container div block for each pages
let usersPageContent;
let notificationPageContent;
let podcastsPageContent;
let filterbubblesPageContent;

let newContentAvailable;

window.addEventListener('load', () => {
	initRouter();

	initModulePages()
});

/*
	Client-side Routing
		(with vanilla-router)
		- init routing pages
*/
function initRouter() {
	let divContainer = document.getElementById("adminContainer");

	router = new Router({
	    mode: 'history',
	    page404: function (path) {
	        console.log('"/' + path + '" Page not found');
	    }
	});

	router.add('/admin', () => {
		divContainer.innerHTML = podcastsPageContent;
	});

	router.add('/admin/notification', () => {
		divContainer.innerHTML = notificationPageContent;
	});

	router.add('/admin/users', () => {
		divContainer.innerHTML = usersPageContent;
	});

	router.add('/admin/filterbubbles', () => {
		divContainer.innerHTML = filterbubblesPageContent;
	});
}

function routePage(event) {
	// Block browser page load
	event.preventDefault();

	// Highlight Active Menu on Click
	let target = event.target;
	let activeNav = document.getElementById("topnav").getElementsByClassName("active");
	for (var i = 0; i < activeNav.length; i++) {
		activeNav[i].classList.remove("active");
	}
	target.classList.add("active");

	// "Navigate" to clicked url
  let href = target.getAttribute("href");
	router.navigateTo(href);
}

// General function to fetch a module page from server
function loadModulePage(name) {
	return fetch("/admin/" + name).then(function(response) {
		if (response.redirected) {
			return null;
		}
		return response.text();
	}).then(function(data) {
		if (data) {
			return data;
		} else {
			console.error("session got probably closed"); // or you are not logged in as admin, which should not be possible at that point
			return null;
		}
	});
}

// load content of all admin pages from server
function initModulePages() {
	loadModulePage("podcastsPage").then(function(response) {
		if (response) {
			podcastsPageContent = response;
			// reload as soon as its loaded to this page
			// to display the "main" page (podcasts) on open
			router.navigateTo("/admin");
		}
	});
	loadModulePage("notificationPage").then(function(response) {
		if (response) {
			notificationPageContent = response;
		}
	});
	loadModulePage("usersPage").then(function(response) {
		if (response) {
			usersPageContent = response;
		}
	});
	loadModulePage("filterbubblesPage").then(function(response) {
		if (response) {
			filterbubblesPageContent = response;
		}
	});
}

/*
	openPopup()
	 - General function to open popups
	 - $name: name of the popup modal
	 - $page: name of the page which should be reloaded after close (if new content is available)
*/
function openPopup(name, page) {
	// Get the popupModal
	let modal = document.getElementById(name);
	// Get the <span> element that closes the popupModal
	let span = document.getElementById(name + "Close");

	// When the user clicks on <span> [x], close the modal
	span.onclick = function() {
		closePopup(modal, page);
	}

	// show the popupModal
	modal.style.display = "block";

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) {
		if (event.target == modal) {
		closePopup(modal, page);
		}
	}
}

// close popup and reload page content if new content is available
function closePopup(modal, page) {
	modal.style.display = "none";
	if (newContentAvailable) {
		router.navigateTo(page);
		newContentAvailable = false;
	}
}

// display error display of specific popup with message
function showErrorMessageForPopup(message, errorModule) {
	errorModule.innerHTML = message;
  errorModule.style.display = "block";
}
