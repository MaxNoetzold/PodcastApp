let MongoClient = require("mongodb").MongoClient;
let express = require('express');
let router = express.Router();

let getUser = require('../user/user.js').getUser;

//MongoDB custom functions
let doesCollectionExist = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').doesCollectionExist;
let createCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').createCollection;
let insertObjectInCollection = require('../mongoDB_CustomFunctions/mongoDB_customFunctions.js').insertObjectInCollection;

let timeLogging = require('../logging/timeLogging.js');

/*
	building some event listeners
	 - connection
	 - joinRoom
	 - leaveRoom
	 - message
*/
function socketChat(io) {
	io.on("connection", function(socket) {
		// we dont want to stack those
		socket.removeAllListeners();
		//console.log("User is connected");

		if (socket.request.user.loggind_in || !socket.request.user) {
			timeLogging("Socket Authentication Failed!");
			return;
		}

		// server sends the messages of a room to everyone in the room
		// so clients have to connect to those
		socket.on('joinRoom', function(req) {
			socket.join(req.room, function () {
				//console.log(socket.request.user.username + " joined room " + req.room);
				//console.log(socket.rooms); //which rooms he is subscribed too
				socket.emit("joinRoom", req.room);
			});
		});

		// leave the room again so the server dont send the messages anymore to the client
		socket.on('leaveRoom', function(req) {
			socket.leave(req.room, function () {
				//console.log(socket.request.user.username + " disconnected from room " + req.room);
			});
		});

		// listen for client messages
		// set the username and timestamp to be sure they are correct
		// and broadcast the message to all in the same room (including the user himself)
		socket.on("message", function(message) {
			var newDate = new Date();

			// set the username of the message (and implicitly check that user is authenticated)
			if (socket.request.user && socket.request.user.username) {
				message.name = socket.request.user.username;
			} else {
				// because this should not really happen we log it
				timeLogging("Message send but user not authenticated!");
				timeLogging(message.room + ": " + message.text);
				// Inform user if not authenticated
				systemMessage = {
					text: "You are not authenticated! Close the Browsertab and try again.",
					room: message.room,
					name: "SYSTEM",
					timestamp: newDate.today() + " " + newDate.timeNow()
				}
				socket.emit("message", systemMessage);

				// force disconnect him from all rooms
				socket.disconnect();
				return;
			}

			// set the timestamp of the message
			// we dont let the client set it because it may get really weird (timezones etc.)
			message.timestamp = newDate.today() + " " + newDate.timeNow();

			// set the name color of the message (to the current stored color of the user)
			getUser(message.name).then(function(user) {
				if (user && user.nameColor) {
					message.nameColor = user.nameColor;
				} else {
					message.nameColor = "#ffffff";
				}
			});

			// set the message id (so the client can easily insert it in the correct place)
			getLatestMessageID("chatroom_" + message.room).then(function(id) {
				message.id = id+1;
				// sending to all clients in room, including sender
				// (client does not clear the input field until the message is received)
				io.in(message.room).emit("message", message);

				// Save message in db
				// so everyone can read the whole conversation even if he wasnt connected at the time the message was send
				saveMessage(message).then(function(result) {
					if (result) {
						socket.emit("message-handled", message.room);
					}
				});
			});
		});
	});
}

// store message in collection
// each room has an own collection (capped (so its always ordered))
// if collection does not exist, create one
function saveMessage(message) {
	let roomName = "chatroom_" + message.room;
	// does collection for chatroom already exists?
	return doesCollectionExist(roomName).then(async function(exists) {
		// if no create collection
		if (exists === false) {
			result = await createCollection(roomName, {'capped':true, 'size':200000000, 'max':100000});
			if (!result) {
				timeLogging("socketChat.js - saveMessage(): Create Collection errored");
				return false;
			}
		}
		// store message in collection
		return insertObjectInCollection(roomName, message).then(function(result) {
			return result;
		});
	});
}

// returns max 10 messages of a room
// $index is always x*10, so index 1 would mean the first 10, index 2 10-20 messages
async function getMessages(collectionName, index) {
	const dbName = "podcastApp";

	try {
	  let url = 'mongodb://localhost:27017';

	  let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
	  let db = dbConnection.db(dbName);
		// get the latest (bc we sort it) index*10 messages
	  let queryResult = await db.collection(collectionName).find({}).sort({$natural: -1}).limit(index * 10).toArray();

		// cut array so we always only get the correct 10 messages
		queryResult = queryResult.slice((index-1)*10);

	  // copy array to use it after db connection close()
	  let returnArray = Array.from(queryResult);

	  dbConnection.close();

	  return returnArray;
  } catch (exception) {
      timeLogging("socketChat.js getMessages(" + collectionName + ", " + index + ") Error: " + exception);
  }
}

async function getLatestMessage(collectionName) {
	const dbName = "podcastApp";
	try {
        let url = 'mongodb://localhost:27017';

        let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        let db = dbConnection.db(dbName);
				// get the latest (bc we sort it) message (because we limit it to 1)
        let queryResult = await db.collection(collectionName).find({}).sort({$natural: -1}).limit(1).toArray();

        // copy array to use it after db connection close()
        let msg = Array.from(queryResult)[0];

        dbConnection.close();

        return msg;
    } catch (exception) {
        timeLogging("socketChat.js getLatestMessage(" + collectionName + ") Error: " + exception);
    }
}

function getLatestMessageID(collectionName) {
	return getLatestMessage(collectionName).then(function(msg) {
		if (msg) {
			return msg.id;
		}
		else {
			return 0;
		}
	});
}

// sends the requested messages (depending on query)
router.get("/", function(req, res) {
	if (!req._parsedOriginalUrl.query) {
		return res.status(500).send("no query parameters available");
	}

	// get query properties
	let query = req._parsedOriginalUrl.query;
	let roomName = "chatroom_" + query.split("?")[0].split("=")[1];
	let index = parseInt(query.split("?")[1].split("=")[1]);

	getMessages(roomName, index).then(function(msgs) {
		res.json(msgs);
	});
});

module.exports = { socketChatInit:socketChat, router:router };
