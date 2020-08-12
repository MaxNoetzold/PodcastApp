/*
	Comments Module (Client)
		- this is not working offline
		- every card (= every podcast episode) gets its own socket room
		- when toggling a card the client joins this room and thereupon is able to receive data from the server
		   (e.g. when a new message was send and needs to be shown)
		- every message gets stored in an mongoDB collection
			 - on toggle the latest 10 get loaded and displayed
			 - as soon as the user scrolls on top of the message field the next 10 get loaded
	  - a message consists of name, nameColor (added on server), message and timestamp (added on server)
*/

// the socket element, which is used to connect and receive
let socket;

// if activeConnections (number of connections to different rooms) reaches 0 the socket disconnects from the server
let activeConnections;

// array of send messages to know if a message was send (it should not really get bigger than length 1)
// bc we wait to delete entered message (in the input field) until sends this message back (which means that it got processed and stored)
let messageSend;

function initCommentInfos() {
	activeConnections = [];
	messageSend = [];
}

/*
	loadMessagesFromServer
	 - every message gets stored in an mongoDB collection
		  - on toggle the latest 10 get loaded and displayed ($init===true, $index===0)
	 	  - as soon as the user scrolls on top of the message field the next 10 get loaded
*/
function loadMessagesFromServer(room, index, init=false) {
	fetch("/getMessages?room=" + room + "?index=" + index).then(function(response) {
		//debugLogging(response);
		if (response.redirected) {
			return null;
		}
		return response.json();
	}).then(function(data) {
		if (data) {
			// display them
			for (i = 0; i < data.length; i++) {
				addComment(data[i], init);
			}
		} else {
			sessionGotClosed();
		}
	});
}

/*
	detectScrollTop
	 - as soon as the user scrolls on top of the message field the next 10 messages get loaded
*/
function detectScrollTop(id) {
	let room = id.split("/")[1];

	let messageBox = document.getElementById(id);
	if (messageBox === null) {
		debugLogging("comments.js-detectScrollTop: messageBox is null, which is literally not possible btw, unlucky");
		return;
	}

	if (messageBox.scrollTop === 0) {
		// this always loads to the next 10 messages (it loads at least one message (as long as they are some left))
		// always round up to get the next index number
		let index = Math.ceil(messageBox.childNodes.length/10);

		// in case the current amount is 10/20/30... we have to manually add 1
		if (index === messageBox.childNodes.length/10) {
			index++;
		}

		// load old messages
		loadMessagesFromServer(room, index);
	}
}

/*
	toggleCard
	 - toggle card when clicked
	 - handle commenting feature
	 		- load latest messages from server
			- establish socket connection
*/
function toggleCard(card, id) {
	card.classList.toggle("is-flipped");

	// figure out if the card-front ($isFlipped = false) or card-back ($isFlipped = true) is visible
	let cardBodyClasses = card.className.split(" ");
	let isFlipped = false;
	cardBodyClasses.forEach(function(clssNm) {
		if (clssNm === "is-flipped") {
			isFlipped = true;
		}
	});

	// card-back visible -->
	//  - load latest 10 messages from server and display them
	//  - establish a socket connection to server to always load all new comments
	if (isFlipped) {
		toggleCardBack(id);
	}
	// card-front visible --> close connection to room; and to server if there are no active rooms left
	else {
		toggleCardFront(id);
	}
}

/*
	toggleCardBack
		gets called when a card gets toggled and backside faces the user
	  - load latest 10 messages of that chatroom from server
	  - establish a socket connection to server for live chat
			 including event listener for: reconnecting, disconnect, message (received), message-handled (for send messages), joinRoom
*/
function toggleCardBack(id) {
	// hide date and comment turn png (for all browsers but chrome pc necessary)
	let dateElement = document.getElementById("date/" + id);
	if (dateElement) {
		dateElement.style.display = "none";
	}
	let commentTurnImg = document.getElementById("commentsTurn/" + id);
	if (commentTurnImg) {
		commentTurnImg.style.display = "none";
	}

	// get the latest 10 messages from server
	loadMessagesFromServer(id, 1, true);

	// connect to socket
	// generate new connection if no connection active
	//	the event handlers are in here as well so they dont get called each time a card is flipped, but only when the $socket gets initialized
	if (!socket || socket === null || activeConnections.length <= 0) {
		debugLogging("init socket connection");

		try {
			socket = io();
		} catch (error) {
			debugLogging("Error at socket initialization");
			debugLogging(error)
		}

		// after the socket reconnecting we need to reconnect to each room as well
		// because we safe all active connections in activeConnections we can easily do this
		// by just joining each room again
		socket.on("reconnecting", function() {
			activeConnections.forEach(function(roomNumber) {
				socket.emit('joinRoom', {
					room: roomNumber
				});
				debugLogging("re-connected to room " + roomNumber);
			});
		});

		// add room to $activeConnections and delete the dc message if existent
		socket.on("joinRoom", function(room) {
			// on reconnect it will already be in the array (so we know to which rooms we want to reconnect)
			// but we dont want to add them here again in that case
			if (activeConnections.indexOf(room) < 0) {
				activeConnections.push(room);
			}
			// delete the disconnect info message if there is one
			let dcmessageElement = document.getElementById("comment/" + room + "/disconnect");
			if (dcmessageElement) {
				dcmessageElement.parentNode.removeChild(dcmessageElement);
			}
		});

		// what to do if we get a message: insert it into message box container
		socket.on("message", function(message) {
			addComment(message);
		});

		// send user a disconnect information message on each room he is connected to
		socket.on("disconnect", function() {
			debugLogging("disconnected");

			timenow = new Date();
			// send disconnect message to user in chat
			// so he knows whats going on
			// it gets deleted on toggle to front and/or on reconnect
			activeConnections.forEach((room, index) => {
				let dcMessage = {
					id: "disconnect",
					name: "SYSTEM",
					room: room,
					text: "You have been disconnected from the chat. Wait until the automatic reconnection triggers or try to manually reconnect by flipping the card.",
					timestamp: timenow.today() + " " + timenow.timeNow(),
					nameColor: "red"
				};
				addComment(dcMessage);
			});
		});

		// delete the send text out of the comment field after it got handled by the server
		//  -> if it did not get handled, dont delete it
		socket.on("message-handled", function(room) {
			for (i = 0; i < messageSend.length; i++) {
				if (messageSend[i] == room) {
					document.getElementById("textArea/" + room).value = "";
					messageSend.splice(i, 1);
				}
			}
		});
	}
	// after the socket is fully initialized we connect to the fitting room (id of this card)
	joinRoom(id);
}

/*
toggleCardFront
	gets called when a card gets toggled and frontside faces the user
	 - disconnect that room
	 - check if there are active rooms left; if no: disconnect the whole socket
*/
function toggleCardFront(id) {
	// show date and comment turn png again
	let dateElement = document.getElementById("date/" + id)
	if (dateElement) {
		dateElement.style.display = "block";
	}
	let commentTurnImg = document.getElementById("commentsTurn/" + id);
	if (commentTurnImg) {
		commentTurnImg.style.display = "block";
	}

	debugLogging("send request to leave room " + id);
	socket.emit('leaveRoom', {
		room: id
	});
	// remove that connection from the list
	let index = activeConnections.indexOf(id);
	if (index > -1) {
		activeConnections.splice(index, 1);
	}

	// check if there are active rooms left; if no: disconnect the whole socket
	if (activeConnections.length <= 0) {
		socket.disconnect();

		// delete the disconnect info right after it will be there, bc it was a intended dc
		let dcmessageElement = document.getElementById("comment/" + id + "/disconnect");
		if (dcmessageElement) {
			dcmessageElement.parentNode.removeChild(dcmessageElement);
		} else {
			// wait 5sec to try once again; just in case that the disconnect message was not yet rendered
			setTimeout(function() {
				let dcmessageElement = document.getElementById("comment/" + id + "/disconnect");
				if (dcmessageElement) {
					dcmessageElement.parentNode.removeChild(dcmessageElement);
				}
			}, 5000);
		}
	}
}

/*
	joinRoom
	 - send to server that we please want to join
*/
function joinRoom(room) {
	debugLogging("Join chatroom " + room);
	socket.emit('joinRoom', {
		room: room
	});
}

// generate comment DOM element out of message object
function generateCommentElement(message) {
	let comment = document.createElement("div");
	comment.classList.add("message");
	comment.setAttribute("id", "comment/" + message.room + "/" + message.id);
		let messageHeader = document.createElement("h2");
		messageHeader.classList.add("messageHeader");
		comment.appendChild(messageHeader);
			let messageUsername = document.createElement("span");
			messageUsername.classList.add("messageUsername");
			messageUsername.innerHTML = message.name;
			messageUsername.style.color = message.nameColor;
			messageHeader.appendChild(messageUsername);
			let messageTimestamp = document.createElement("span");
			messageTimestamp.classList.add("messageTimestamp");
			messageTimestamp.innerHTML = message.timestamp;
			messageHeader.appendChild(messageTimestamp);
		let messageContent = document.createElement("div");
		messageContent.classList.add("messageContent");
		messageContent.innerHTML = message.text;
		comment.appendChild(messageContent);

	return comment;
}

// insert comment DOM element into the message container
function addComment(message, init = false) {
	// first detect if this message is already loaded
	if(document.getElementById("comment/" + message.room + "/" + (message.id))) {
		return;
	}

	// div container in which the messages get inserted
	let messageBox = document.getElementById("messageBox/" + message.room);
	// is the box scrolled down to the bottom?
	// (so we know if we have to reset the scrollposition after the insertion)
	let scrolledDown = messageBox.scrollTop === (messageBox.scrollHeight - messageBox.offsetHeight);
	// new message as html DOM element
	let messageElement = generateCommentElement(message);
	// if there is a newer message, this will be it
	let biggerChild = document.getElementById("comment/" + message.room + "/" + (message.id+1));

	// new messages should get inserted in the bottom while old messages should be in the right position
	if (biggerChild) {
		messageBox.insertBefore(messageElement, biggerChild);
		// we dont want to change the scroll position if a new element gets added
		// this is the closest I get to not changing the position
		messageBox.scrollTop += 1; // if we add 1, in fact we add 1+messageElement.offsetHeight. if we add 0, we add 0. i dont get it
	} else {
		messageBox.appendChild(messageElement);
	}

	// only scroll to the bottom on the initial loading
	// and if the scrollbar was on the bottom before
	if (init || scrolledDown) {
		messageBox.scrollTop = messageBox.scrollHeight;
	}
}

// send new message to server so he can handle it
// (we wait with the clearing of the input field until the message got handled)
function sendComment(id) {
	let message = document.getElementById("textArea/" + id).value;
	if (message) {
		socket.emit("message", {
			text: message,
			room: id
		});
		messageSend.push(id);
	}
}
