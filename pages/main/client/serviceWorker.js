/*
	handles the installation of a new service worker
*/

/*
  checks if the service worker API is available
  if yes: registers service worker
  then subscribe user to notifications
*/
if ('serviceWorker' in navigator) {
	window.addEventListener('load', async function() {
		swRegistration = await navigator.serviceWorker.register('sw.js');

		swRegistration.addEventListener("updatefound", () => {
			// An updated service worker has appeared in swRegistration.installing!
			newWorker = swRegistration.installing;

			newWorker.addEventListener('statechange', () => {
				// Has service worker state changed?
				switch (newWorker.state) {
					case 'installed':
						// There is a new service worker available, show the notification
						if (navigator.serviceWorker.controller) {
							showNewServiceWorkerAvailable();
						}
						break;
				}
			});
		});

		subscribeUser();
	});

	// The event listener that is fired when the service worker updates
	// Here we reload the page
	navigator.serviceWorker.addEventListener('controllerchange', function () {
		if (refreshing) return;
		window.location.reload();
		refreshing = true;
	});

} else {
  debugLogging("main_client.js: Service Worker API is not available");
}

/*
  showNewServiceWorkerAvailable
   - displays the (AlertBox) Notification
   		that a new Service Worker / Page Version is available
	 - with a button "Neu laden" (reload) which will skip the waiting of the new service worker
*/
function showNewServiceWorkerAvailable() {
	debugLogging("main_client.js-showNewServiceWorkerAvailable(): New Service Worker Available, pls reload");

	let messageText = "Eine neue Version der Seite ist verfügbar!";
	let buttonText = "Neu laden";

	let clickFunction = function() {
		newWorker.postMessage({ action: 'skipWaiting' });
	};

	showAlertBox(messageText, buttonText, clickFunction, 4);
}
