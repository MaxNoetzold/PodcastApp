let publicVapidKey;
let waitSWCounter;

/*
	- check if client browser supports notifications; if no: return
	- add event listener for the notifications permission so we notice a change
	- ask user to grant us this permission
	- load the current permission status
*/
function initNotifications() {
	publicVapidKey =  secrets.publicVapidKey;
	waitSWCounter = 0;
	// are notifications available in this browser?
	// if not just return
	if (!('Notification' in window)) {
		debugLogging("notifications.js-initNotifications(): This browser does not support notifications!");
		supportsNotifications = false;
		notificationSetting = false;
		return;
	}
	supportsNotifications = true;

	// add an event listener for permission change
	// if the user grants us a permission to receive notifications (via the browser settings)
	// we subscribe him; and if he denies we unsubscribe him
	// we also store it in indexeddb
	navigator.permissions.query({name:'notifications'}).then(function(permissionStatus) {
		permissionStatus.onchange = function() {
			debugLogging("notifications.js-initNotifications(): notifications permission state has changed to " + this.state);
			if (this.state === "granted") {
				grantedNotifications = true;
				notificationSetting = true;
				subscribeUser();
			} else {
				grantedNotifications = false;
				notificationSetting = false;
				unsubscribeUser();
			}
			generalUserDataStore.setItem('notificationSetting', notificationSetting).catch(function(err) {
				debugLogging("settings.js-switchNotificationSetting(): Error at storing notificationSetting into indexxeddb: " + err);
			});
		};
	});


	// ask user for permissions to send notifications
	// but only ask him if he did not decide yet
	// (this will trigger the event listener above)
	if (Notification.permission !== "granted" && Notification.permission !== "denied") {
		Notification.requestPermission();
		return;
	}

	// if he already decided before we just load the data
	if (Notification.permission === "granted") {
		grantedNotifications = true;
		notificationSetting = true;
	}
	if (Notification.permission === "denied") {
		grantedNotifications = false;
		notificationSetting = false;
	}
}

function subscribeUser() {
	// do not subscribe if its turned off
	if (!notificationSetting && notificationSetting !== null) {
		return;
	}
	// wait till we have a service worker registered (bc he is doing the job here)
	if (!swRegistration || swRegistration === null || !swRegistration.active) {
		if (waitSWCounter < 5) {
			setTimeout(subscribeUser, 20000);
			waitSWCounter++;
		}
		return;
	}

	swRegistration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
	})
	.then(subscription => {
		debugLogging("notifications.js-subscribeUser(): User is subscribed");
		updateSubscriptionOnServer(subscription);
	})
	.catch(err => {
		if (Notification.permission === 'denied') {
			debugLogging("notifications.js-subscribeUser(): Permission for notifications was denied");
		} else {
			debugLogging("notifications.js-subscribeUser(): Failed to subscribe the user: " + err);
		}
	});
	}

/*
	- unsubscribe user on clientside via serviceWorker
	- we dont have to send this information to the server:
	 	- as soon as the server sends a push notification to us when we already unsubscribed he will get an error
		- this error leads to the unsubscribe on server-level without the user noticing anything
*/
function unsubscribeUser() {
	navigator.serviceWorker.ready.then(function(reg) {
		reg.pushManager.getSubscription().then(function(subscription) {
			if (!subscription || subscription === null) { return; } // no subscription to be unsubscribed from
			subscription.unsubscribe().then(function(successful) {
				debugLogging("notifications.js-unsubscribeUser(): successfully unsubscribed from notifications: " + successful);
			}).catch(function(e) {
				debugLogging("notifications.js-unsubscribeUser(): Error at unsubscribe from notification: " + e);
			})
		})
	});
}

/*
	- send server the endpoint (= this client)
		 (so he knows where to send the notifications)
*/
function updateSubscriptionOnServer(subscription) {
	fetch('/subscribe', {
		method: 'POST',
		body: JSON.stringify(subscription),
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

// i did not write this, but I forgot from where I copied it
function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
