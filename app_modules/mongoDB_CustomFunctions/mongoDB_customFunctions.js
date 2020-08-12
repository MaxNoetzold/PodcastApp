/*
  MongoDB Module/Custom Functions
   - createCollection
   - deleteObjectInCollection (async)
   - doesCollectionExist (async)
   - getQueryForCollection (async)
   - insertObjectInCollection (async)
   - updateObjectInCollection (async)
   - updateManyInCollection (async)
*/

let MongoClient = require("mongodb").MongoClient;
let timeLogging = require("../logging/timeLogging.js");

const dbName = "podcastApp";
const url = "mongodb://localhost:27017";


/*
  createCollection()
   - creates MongoDB Collection
   - returns true on success and false on error
*/
function createCollection(collectionName, options) {
  try {
    return MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(function(dbConnection) {
			let db = dbConnection.db(dbName);

			return db.createCollection(collectionName, options).then(function(res) {
				timeLogging("Collection created: " + collectionName);

				dbConnection.close();
				return true;
			});
		});
  } catch (exception) {
    timeLogging("Error at createCollection in mongoDB_CustomFunctions: " + exception);
    return false;
  }
}


/*
  deleteObjectInCollection()
   - deletes one object (specified by $query) in $collectionName
   - returns true on success and false on error
   - async
*/
async function deleteObjectInCollection(collectionName, query) {
  try {
    let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    let db = dbConnection.db(dbName);
    let queryResult = await db.collection(collectionName).deleteOne(query);

    dbConnection.close();

    return true;
  } catch (exception) {
    timeLogging("Error at deleteObjectInCollection in mongoDB_CustomFunctions: " + exception);
    return false;
  }
}


/*
  doesCollectionExist()
   - test if there is a collection with $collectionName
   - returns true if exists and false if not
   - async
*/
async function doesCollectionExist(collectionName) {
  try {
    let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    let db = dbConnection.db(dbName);

    temp = await db.listCollections({name: collectionName}).toArray();

    dbConnection.close();
    return (temp.length > 0);
  } catch (exception) {
    timeLogging("Error at doesCollectionExist in mongoDB_CustomFunctions: " + exception);
    return false;
  }
}


/*
  getQueryForCollection
   - returns Array with all elements in $collectionName that match $query
*/
async function getQueryForCollection(collectionName, query) {
    try {
        let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        let db = dbConnection.db(dbName);
        let queryResult = await db.collection(collectionName).find(query).toArray();

        //copy array to use it after db connection close()
        let returnArray = Array.from(queryResult);

        dbConnection.close();

        return returnArray;
    } catch (exception) {
        timeLogging("Error at getQueryForCollection in mongoDB_CustomFunctions: " + exception);
    }
}


/*
  insertObjectInCollection
   - inserts one or many (if $object is array) $object s into $collectionName
   - returns true on success and false on error
*/
async function insertObjectInCollection(collectionName, object) {
    try {
        let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        let db = dbConnection.db(dbName);
        if (!Array.isArray(object)){
            let queryResult = await db.collection(collectionName).insertOne(object);
        } else {
            let queryResult = await db.collection(collectionName).insertMany(object);
        }
        dbConnection.close();
        return true;
    } catch (exception) {
        timeLogging("Error at insertObjectInCollection in mongoDB_CustomFunctions: " + exception);
        return false;
    }
}


/*
  updateObjectInCollection
   - updates one $object in $collectionName if it matchs $filter
   - returns true on success and false on error
*/
async function updateObjectInCollection(collectionName, object, filter) {
  try {
    let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    let db = dbConnection.db(dbName);
    let queryResult = await db.collection(collectionName).updateOne(filter, object);

    dbConnection.close();
    return true;
  } catch (exception) {
    timeLogging("Error at updateObjectInCollection in mongoDB_CustomFunctions: " + exception);
    return false;
  }
}


/*
  updateManyInCollection
   - updates many $object s in $collectionName if they match $filter
   - returns true on success and false on error
*/
async function updateManyInCollection(collectionName, objects, filter) {
  try {
    let dbConnection = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    let db = dbConnection.db(dbName);
    let queryResult = await db.collection(collectionName).updateMany(filter, objects);

    dbConnection.close();
    return true;
  } catch (exception) {
    timeLogging("Error at updateManyInCollection in mongoDB_CustomFunctions: " + exception);
    return false;
  }
}
module.exports = { createCollection, deleteObjectInCollection, doesCollectionExist,
                    getQueryForCollection, insertObjectInCollection, updateManyInCollection,
                    updateObjectInCollection };
