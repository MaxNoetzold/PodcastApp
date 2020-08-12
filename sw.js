const DEBUG = false;

const CACHE_NAME_STATIC = 'static-cache-v53';
// files or pages that are definitly needed for a full experience
const coreUrlsToCache = [
//general
	'/favicon.ico',
	'/fonts.css',
	'/properties.css',
	'/style.css',
	'/manifest.json',
//archive page
	'/',
	'/main/main_client.js',
	'/main/cardStyle.css',
	'/main/download.js',
	'/main/guiFunctions.js',
	'/main/guiLoader.js',
	'/main/notifications.js',
	'/main/players.js',
	'/main/podcastTimers.js',
	'/main/secrets.js',
	'/main/serviceWorker.js',
	'/main/settings.css',
	'/main/settings.js',
// archive page libraries
	'/shaka-player/shaka-player.compiled.js',
	'/plyr/plyr.js',
	'/plyr/plyr.css',
	'/localforage/localforage.min.js',
	'/mux.js/mux.min.js'
];
// files or pages that will be needed but not instantly
const additionalUrlsToCache = [
//notification pictures
	'/images/notifications/notification-flat.png',
	'/images/comments_turn_white.png',
//more libraries
	'/popupmodal.css',
	'/pickr/themes/classic.min.css',
	'/font-awesome/css/font-awesome.min.css',
	'/socket.io-client/socket.io.js',
	'/pickr/pickr.min.js',
	'/main/comments.css',
	'/main/comments.js'
];
const fontsToCache = [
	//Catamaran zur zeit nicht benutzt
	/*'font/Catamaran/Catamaran-Thin.ttf',
	'font/Catamaran/Catamaran-ExtraLight.ttf',
	'font/Catamaran/Catamaran-Light.ttf',
	'font/Catamaran/Catamaran-Regular.ttf',
	'font/Catamaran/Catamaran-Medium.ttf',
	'font/Catamaran/Catamaran-SemiBold.ttf',
	'font/Catamaran/Catamaran-Bold.ttf',
	'font/Catamaran/Catamaran-ExtraBold.ttf',
	'font/Catamaran/Catamaran-Black.ttf',*/
	'/font/TheSans_Plain/TheSans-B5Plain.otf'
];
// files or pages that should never be added to the cache (after the install event)
const urlsNotToCache = [
	'/podcast-episodes',
	'/podcastTimers',
	'/subscribe',
	'/getMessages',
	'/admin',
	'/getCards',
	'/getLatestPodcastID',
	'/getManifestIDs',
	'/changePassword',
	'/logout',
	'/nameColor',
	'/socket.io',
	'/login',
	'/register'
];

// download and store all defined files in cache
// as soon as the core files are cached the install event is finished
// (all other files can be cached afterwards)
self.addEventListener('install', (event) => {
	// Perform install steps
		event.waitUntil(
			caches.open(CACHE_NAME_STATIC)
			.then(function(cache) {
				//cache optional files
				cache.addAll(additionalUrlsToCache)
				.then(() => {
					if (DEBUG) {
						console.info('All optional files are cached');
					}
				})
				.catch((error) =>	{
					if (DEBUG) {
						console.error('Failed to cache optional files', error);
					}
				});
				//cache fonts
				cache.addAll(fontsToCache)
				.then(() => {
					if (DEBUG) {
						console.info('All fonts are cached');
					}
				})
				.catch((error) =>	{
					if (DEBUG) {
						console.error('Failed to cache fonts', error);
					}
				});
				//cache all important files
				return cache.addAll(coreUrlsToCache)
				.then(() => {
					if (DEBUG) {
						console.info('All core files are cached');
					}
					return; // self.skipWaiting(); //To forces the waiting service worker to become the active service worker //We dont want that; we let the user decide when to reload
				})
				.catch((error) =>	{
					if (DEBUG) {
						console.error('Failed to cache core files', error);
					}
				});
			})
		);
	});

// check if requested item is in cache and response with that if it is
// else: load from server
// store the downloaded item if it is not in the urlsNotToCache array
self.addEventListener('fetch', event => {
	/*
		- check if the requested url is in the list of do-not-cache-urls
		- test if it is already cached; if yes send that; else: fetch from server
		- but never add the result to cache
		- if its a js file we always want to cache it
	*/
	if (urlsNotToCache.find(element => event.request.url.includes(element)) && !event.request.url.endsWith(".js")) {
		return event.respondWith(
			caches.match(event.request)
			.then(response => {
				if (response) {
					return response;
				}
			return fetch(event.request);
			})
		);
	}

	/*
		- if the url is not in urlsNotToCache
		- check if it is already cached: if yes send that; else: fetch from server
		- add the downloaded item to the cache
	*/
	event.respondWith(
		caches.match(event.request)
		.then(response => {
			if (response) {
				//console.log('Found ', event.request.url, ' in cache');
				return response;
			}
			if (DEBUG) {
				console.log('Network request for ', event.request.url);
			}
			return fetch(event.request)
			.then(response => {
				if (response.status === 404) {
					if (DEBUG) {
						console.error("Fetch Event 404");
					}
					return;
				}
				return caches.open(CACHE_NAME_STATIC)
				.then(cache => {
					cache.put(event.request.url, response.clone());
					return response;
				});
			});
		}).catch(error => {
			if (DEBUG) {
				console.error("Error at Network Fetch Request: " + error);
			}
		})
	);
});

// when the user reloads page after new service worker got installed this gets called
// it just deletes all old caches
self.addEventListener('activate', function(event) {
	if (DEBUG) {
		console.log("activate event");
	}
	var cacheWhitelist = [CACHE_NAME_STATIC];

	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName) {
					if (cacheWhitelist.indexOf(cacheName) === -1) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

// when the install event is done the serviceWorker.js file of the main page will show a notification
// if the user clicks on the reload button there it will emit a message event with the action 'skipWaiting'
// this here gets called by it and activates the new service worker
self.addEventListener('message', function (event) {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});

/*
	NOTIFICATIONS
*/

// this is not needed right now
// but you may want to do sth if the user closes a notification
/*self.addEventListener('notificationclose', event => {
	const notification = event.notification;
	const primaryKey = notification.data.primaryKey;
});*/

self.addEventListener('notificationclick', event => {
	const notification = event.notification;
	//const primaryKey = notification.data.primaryKey; //this is used when one wants to know which notification got clicked
	//const action = event.action; // we dont use buttons with different actions right now; user can only click on it or just not do it

	clients.openWindow('/');
	notification.close();
});

// wait for push event from server which indicates a new notification
self.addEventListener('push', event => {
	let data;

	if (event.data) {
		data = event.data.json();
	} else {
		return;
	}

	const options = {
		body: data.text,
		icon: '/images/notifications/notification-flat.png',
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
		}
	};

	event.waitUntil(
		self.registration.showNotification(data.title, options)
	);
});
