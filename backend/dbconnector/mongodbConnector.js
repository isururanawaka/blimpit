var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var config = require('../config/config');
var dbClient; retryCount =0;
var errorHandler = require('../errorhandler/errorHandler');

//opens a connection to a given DB Server.
// If connection fails it retries until max count reaches.
exports.openConnection =  function(cb) {
    var url = config.mongodb.connectionString;
    mongoClient.connect(url,function (err, client) {
        if(err) {
            console.log('Cannot connect to mongoDB retrying')
            retryCount++;
            if(retryCount <= config.mongodb.maxRetries){
                setTimeout(function(){
                    exports.openConnection(cb);
                }, config.mongodb.connectionTimeout);

            } else{
                errorHandler.handleError('Maximum retries are exceeded still unable to connect to server, check whether' +
                    ' mongo service up and running and network is alive ', err);
                cb(true,false);
            }

        }else{
            dbClient = client;
            dbClient.on('disconnected',function () {
                console.log('Mongodb default connection disconnected');
                cb(false,true);
            });
            console.log("Successfully connected to the mongo server using mongodb");
            cb(false,false);
        }

    })
}


/**
 * create a collection in the given DB. if DB does not exist
 * it creates a new one and create collection
 * @param db
 * @param collectionName
 * @param cb callback
 */
exports.createCollection = function (db, collectionName, cb){
    var dbIns = dbClient.db(db);
    dbIns.createCollection(collectionName, function (err, collection) {
        if(err){
            errorHandler.handleError('cannot create collection '+ collectionName, err);
            throw err;
            return;
        }else{
            console.debug('Successfully create the collection '+ collection);
            cb();
        }
    });

}

/**
 * Insert a document to a given collection under given DB .
 * if DB and collection not exisits it create a new one
 * @param db
 * @param collection
 * @param document
 * @param cb
 */
exports.insertDocument = function (db,collection,document,cb){
    var dbIns = dbClient.db(db);
    dbIns.collection(collection).insertOne(document, function(err, res) {
        if (err) {
            errorHandler.handleError('cannot insert into '+collection, err);
            throw err;
            return;
        }else{
            console.debug('Successfully inserted the document to the collection '+
                collection + 'in the DB ' + db);
            cb();
        }

    });

}
/**
 * Insert array of documents to a given collection under given DB
 * @param db
 * @param collection
 * @param documentArray
 * @param cb
 */
exports.insertMultipleDocuments = function (db,collection,documentArray,cb){
   var dbo = dbClient.db(db);
    dbo.collection(collection).insertMany(documentArray, function(err, res) {
        if (err) {
            errorHandler.handleError('cannot insert into '+collection, err);
            throw err;
            return;
        }else{
            console.debug('Successfully inserted the documents to the collection '+
                collection + 'in the DB' + db );
            cb();
        }

    });
}

/**
 * Fetch all the documents of the given db under given collection
 * @param db
 * @param collection
 * @param cb
 */
exports.selectAll = function (db, collection, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).find({}).toArray(function(err, result) {
        if (err){
            errorHandler.handleError('Error when retreving data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            cb(null, result);
        }

    });
}

/**
 * select select records according to given query
 * @param db
 * @param collection
 * @param query record selection query.
 * @param includeQuery fields included in the result.
 * @param cb
 */
exports.selectSpecificDocuments = function (db, collection, query,includeQuery, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).find(query,includeQuery).toArray(function(err, result) {
        if (err){
            errorHandler.handleError('Error when retreving data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log(result);
            cb(null, result);
        }

    });
}

/**
 * select  records according to given query and return limited numbers
 * @param db
 * @param collection
 * @param query record selection query.
 * @param includeQuery fields included in the result.
 * @param cb
 */
exports.selectSpecificDocuments = function (db, collection, query,includeQuery, count, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).find(query,includeQuery).limit(count).toArray(function(err, result) {
        if (err){
            errorHandler.handleError('Error when retreving data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log(result);
            cb(null, result);
        }

    });
}

/**
 * Sort selected records according to given query .
 * @param db
 * @param collection
 * @param query
 * @param sortQuery
 * @param cb
 */
exports.sortDocuments = function (db, collection, query, sortQuery, cb) {
  var dbo = dbClient.db(db);
  dbo.collection(collection).find(query).sort(sortQuery).toArray(function (err, result) {
      if (err){
          errorHandler.handleError('Error when retreving data from '+
              collection +'in DB '+db);
          cb(err,null);
      } else {
          console.log(result);
          cb(null, result);
      }
  });
}

/**
 * Sort selected records according to given query and presents only requested values.
 * @param db
 * @param collection
 * @param query
 * @param includeQuery
 * @param sortQuery
 * @param cb
 */
exports.sortSpecificDocuments = function (db, collection, query,includeQuery, sortQuery, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).find(query,includeQuery).sort(sortQuery).toArray(function (err, result) {
        if (err){
            errorHandler.handleError('Error when retreving data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log(result);
            cb(null, result);
        }
    });

}

/**
 * Delete matching queries from the given documents
 * @param db
 * @param collection
 * @param query
 * @param cb
 */
exports.deleteManyDocuments = function (db,collection,query,cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).deleteMany(query,function (err, obj) {
        if (err){
            errorHandler.handleError('Error when deleting data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log(obj.result.n +" Documentes deleted")
            cb(null, obj.result);
        }
    });
}

/**
 * Delete the first record matchcing the given query
 * @param db
 * @param collection
 * @param query
 * @param cb
 */
exports.deleteOneDocument = function (db,collection,query,cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).deleteOne(query,function (err, obj) {
        if (err){
            errorHandler.handleError('Error when deleting data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log(obj.result.n +" Document deleted")
            cb(null, obj.result);
        }
    });
}

/**
 * Drop the given collection
 * @param db
 * @param collection
 * @param cb
 */
exports.dropCollection = function (db, collection, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).drop(function(err, delOK) {
        if (err) {
            errorHandler.handleError('Error when deleting data from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
           console.debug("Collection "+ collection+  " deleted");
           cb(null,delOK);
        }

    });

}


/**
 * Update a given Document of a collection
 * @param db
 * @param collection
 * @param query
 * @param newValues
 * @param cb
 */
exports.updateDocument = function (db,collection,query,newValues, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).updateOne(query,newValues,function(err, updated) {
        if (err) {
            errorHandler.handleError('Error when Updating document from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log("Successfully updated");
            cb(null,updated);
        }

    });

}

/**
 * Update multiple documents in a given collection
 * @param db
 * @param collection
 * @param query
 * @param newValues
 * @param cb
 */
exports.updateManyDocuments = function (db,collection,query,newValues, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).updateMany(query,newValues,function(err, updated) {
        if (err) {
            errorHandler.handleError('Error when Updating document from '+
                collection +'in DB '+db);
            cb(err,null);
        } else {
            console.log("Successfully updated");
            cb(null,updated);
        }

    });

}

/**
 * Aggregate records from one collection to another
 * @param db
 * @param collection
 * @param query
 * @param cb
 */
exports.aggregateCollections = function (db,collection,query, cb) {
    var dbo = dbClient.db(db);
    dbo.collection(collection).aggregate([query]).toArray(function(err, result) {
        if (err) {
            errorHandler.handleError('Error when aggregrating collectionsc'+ collection);
            cb(err,null);
        } else {
            console.log(JSON.stringify(result));

        }

    });
}

/**
 * Drop the given database
 * @param db
 * @param fn
 */
exports.deleteDatabase = function (db, fn) {
    var db = dbClient.db(db);
    db.dropDatabase(function (err, result) {
        if (err) {
            fn(null, err);
        } else {
            fn(result, null);
        }
    });
}

/**
 * Create Indexing
 * @param indexes
 * @param collection
 * @param db
 * @param fn
 */
exports.createIndexes = function (indexes, collection, db, fn) {
    var db = dbClient.db(db);
    db.collection(collection, function (err, collection) {
        collection.createIndexes(indexes, function (err, result) {
            fn(result);
        })
    });
};
