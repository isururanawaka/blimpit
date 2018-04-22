
var config = require('../config/configLocal.js');
var environment = process.argv[2];

var MongoClient = require('mongodb').MongoClient
    , Server = require('mongodb').Server;
// var cache = require('./cache.js');
var dbClient, retryCount = 0;
// var userManager = require('./userManager');
//var client = new Db(config.mongodb.centralDB, new Server('192.248.8.246', 27017, {auto_reconnect: false, poolSize: 4}), {w:0, native_parser: false});
//var mongoClient = new MongoClient(new Server(config.mongodb.host, config.mongodb.port, {auto_reconnect: true, poolSize: 6}));

exports.openConnection = function () {
    var options = '/?replicaSet=blimpIt&readPreference=primaryPreferred';
    //MongoClient.connect("mongodb://" + config.mongodb.username + ":" + config.mongodb.pwd + "@" + config.mongodb.host + ',' + config.mongodb.host1 + ',' + config.mongodb.host2 + options, function (err, mongoClient) {
    MongoClient.connect(config.mongodb.connectionString, function (err, mongoClient) {
        if (err) {
            console.log('Cannot connect to Mongo DB! Retrying');
            //console.log(err);
            retryCount++;
            if (retryCount <= 20) {
                setTimeout(function () {
                    exports.openConnection();
                }, 5000);
            }
        } else {
            //db1 = mongoClient.db(config.mongodb.database);
            dbClient = mongoClient;
            console.log('Connected to Mongo DB');
        }
    });
}

//insert a document to the specified collection
exports.insertDocument = function (collection, doc, db, fn) {
    var fn1 = function () {
        },
        fn1 = fn || fn1,
        db1 = dbClient.db(db);
    db1.collection(collection, function (err, col) {
        //console.log(collection);
        //console.log(col);
        col.insert(doc, {safe: true}, function (err, records) {
            if (err) {
                fn1(err);
                return;
            }
            fn1(null, records.insertedIds[0]);
        });
    });
};
//Retrieve the first object that matches the query
exports.getSingleDocument = function (query, collectionV, db, fn) {

    query["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collectionV, function (err, collection) {
        collection.findOne(query, function (err, doc) {
            //console.log("................................................");
            //console.log("getSingleDocument - query"+JSON.stringify(query));
            //console.log("getSingleDocument - collection"+collectionV);
            //console.log("getSingleDocument - db"+db);
            //console.log("getSingleDocument - err"+JSON.stringify(err));
            //console.log("getSingleDocument - doc"+JSON.stringify(doc));
            //console.log("................................................");

            if (err) {
                fn(null, err);
                return;
            }
            fn(doc, null);
        });
    });
};

//Retrieve multiple documents that matches the given query
exports.getDocuments = function (query, collection, db, fn) {
    query["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.find(query).toArray(function (err, doc) {
            if (err) {
                fn([], err);
                return;
            }
            fn(doc, null);
        });
    });
};

//get documents sorted ina order
exports.getSortedDocuments = function (query, collection, sortkey, limit, projection, db, fn) {
    query["deleted"] = {$ne: true};

    if (typeof limit === "undefined") {
        limit = 0;
    }
    //console.log("Connected to UoM server");
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        if (err) {
            console.log(err);
            fn([], err);
        }
        collection.find(query, projection).sort(sortkey).limit(limit).toArray(function (err, doc) {
            if (err) {
                fn([], err);
                return;
            }
            fn(doc, null);
        });
    });
};

//get documents sorted ina order
exports.getSortedDocumentsWithSkipLimit = function (query, collection, sortkey, skip, limit, projection, db, fn) {
    query["deleted"] = {$ne: true};

    if (typeof limit === "undefined") {
        limit = 0;
    }
    if (typeof skip === "undefined") {
        skip = 0;
    }
    //console.log("Connected to UoM server");
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        if (err) {
            console.log(err);
            fn([], err);
        }
        collection.find(query, projection).sort(sortkey).skip(skip).limit(limit).toArray(function (err, doc) {
            if (err) {
                fn([], err);
                return;
            }
            fn(doc, null);
        });
    });
};
//get last document of a group sorted on a key
exports.getLastDocumentProcessedInGroupBy = function (collection, filter, project, sort, group, db, callback) {
    filter["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, col) {
        if (!project) {
            col.aggregate([
                    {$match: filter},
                    {$sort: sort},
                    {
                        $group: {
                            '_id': '$' + group,
                            'document': {"$last": "$$ROOT"}
                        }
                    }
                ],
                function (err, doc) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, doc);
                    }
                });
        } else {
            project['existing'] = "$$ROOT";
            col.aggregate([
                    {$match: filter},
                    {
                        $project: project
                    },
                    {$sort: sort},
                    {
                        $group: {
                            '_id': '$existing.' + group,
                            'document': {"$last": "$existing"}
                        }
                    }
                ],
                function (err, doc) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, doc);
                    }
                });
        }
    });
}

exports.updateSelectedFields = function (collection, selector, fieldSelector, db, fn) {
    selector["deleted"] = {$ne: true};

    // Db(config.mongodb.database, new Server(config.mongodb.host, config.mongodb.port, {auto_reconnect: false, poolSize: 7}), {w:0, native_parser: false}).open(function(err,db){
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.update(selector, {$set: fieldSelector}, function (err, result) {
            if (err) {
                fn(err);
                return;
            }
            fn(null);
        });
    });
    // });
}
//delete a specific document from a collection
exports.deleteDocument = function (collection, query, db, errorFunc) {
    //var db1 = dbClient.db(db);
    //db1.collection(collection, function (err, collection) {
    //    collection.remove(query, function (err, numberOfRemovedDocs) {
    //        if (err) {
    //            errorFunc(new Error(err.message), null);
    //            return;
    //        }
    //        errorFunc(null, numberOfRemovedDocs);
    //    });
    //});
    exports.updateAllDocuments(collection, query, {deleted: true}, db, errorFunc);
}

exports.findAndModify = function (collection, query, sort, doc, options, db, errorFunc) {
    query["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.findAndModify(query, sort, doc, options, function (err, result) {
            if (err) {
                errorFunc(new Error(err.message), null);
                return;
            }
            errorFunc(null, result.value);
        });
    });
};
//retrieve documents with projection of certain fields
exports.getProjection = function (collection, query, projection, db, fn) {
    query["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.find(query, projection).toArray(function (err, doc) {
            if (err) {
                fn(null, err);
                return;
            }
            fn(doc, null);
        });
    });
};

//Dropping a specific collection
exports.dropCollection = function (name, db, fn) {
    var db1 = dbClient.db(db);
    db1.dropCollection(name, function (err, collection) {
        if (err) {
            fn(err);
            return;
        }
    });
}

exports.createCollection = function (name, db, fn) {
    var db = dbClient.db(db);
    db.createCollection(name, function (err, collection) {
        if (err) {
            fn(null, err);
            return;
        }
        fn(collection, null);
    });
}

exports.incrementSelectedFields = function (collection, selector, incrementSelector, db, fn) {
    selector["deleted"] = {$ne: true};

    // Db(config.mongodb.database, new Server(config.mongodb.host, config.mongodb.port, {auto_reconnect: false, poolSize: 7}), {w:0, native_parser: false}).open(function(err,db){
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.update(selector, {$inc: incrementSelector}, function (err, result) {
            if (err) {
                fn(err);
                return;
            }
            fn(null);
        }, true);
    });
    // });
}

//For Adding up Elements into an array field
exports.pushSelectedFields = function (collection, selector, pushSelector, db, fn) {
    selector["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.update(selector, {$push: pushSelector}, function (err, result) {
            if (err) {
                fn(err);
                return;
            }
            fn(null);
        }, true);
    });
}

//For removing up Elements from an array field
exports.pullSelectedFields = function (collection, selector, pullSelector, db, fn) {
    selector["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.update(selector, {$pull: pullSelector}, {multi: true}, function (err, result) {
            if (err) {
                fn(err);
                return;
            }
            fn(null);
        }, true);
    });
}

exports.updateDocument = function (collection, selector, updateAction, options, db, fn) {
    selector ["deleted"]= {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.update(selector, updateAction, options, function (err, result) {
            if (err) {
                fn(err);
                return;
            }
            fn(null, result);
        });
    });
};

exports.updateAllDocuments = function (collection, selector, field, db, fn) {
    selector["deleted"] = {$ne: true};
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.update(selector, {$set: field}, {multi: true}, function (err, result) {
            if (err) {
                fn(err, null);
                return;
            }
            fn(null, result.result.nModified);
        });
    });
}

//count documents of a collection
exports.countDocuments = function (query, collection, db, fn) {

    query["deleted"] = {$ne: true};

    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {
        collection.count(query, function (err, count) {
            if (err) {
                fn(null, err);
                return;
            }
            fn(count);
        });
    });
}

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
exports.createIndexes = function (indexes, collection, db, fn) {
    var db = dbClient.db(db);
    db.collection(collection, function (err, collection) {
        collection.createIndexes(indexes, function (err, result) {
            fn(result);
        })
    });
};

exports.aggregate = function (collection, pipeline, db, fn) {
    var db = dbClient.db(db);
    db.collection(collection, function (err, collection) {
        collection.aggregate(pipeline, function (err, result) {
            if (err) {
                fn(null, err);
            } else {
                fn(result, null);
            }
        })
    });

}
exports.mapReduceInline = function (collection, db, map, reduce, query, fn, scope) {
    query["deleted"] = {$ne: true};

    var db = dbClient.db(db);
    if (typeof scope == 'undefined') {
        scope = {};
    }
    var out = {out: {inline: 1}, scope: scope};
    db.collection(collection, function (err, collection) {
        out['query'] = query;
        collection.mapReduce(map, reduce, out, function (err, results, stats) {
            if (err) {
                fn(err, null);
            } else {
                fn(null, results);
            }
        });

    });
};
exports.mapReduceOutToCollection = function (collection, db, map, reduce, query, outCollectionKey, fn) {
    query["deleted"] = {$ne: true};

    var db = dbClient.db(db);
    var out = {out: outCollectionKey};
    db.collection(collection, function (err, collection) {
        out['query'] = query;
        collection.mapReduce(map, reduce, out, function (err, results, stats) {
            if (err) {
                fn(err, null);
            } else {
                fn(null, results);
            }
        });

    });
};

//This is used for email report
exports.getUniqueAndTotalViewsBySensor = function (collection, db, activityID, startTime, endTime, fn) {
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {

        collection.aggregate([
            {
                $match: {
                    activityID: activityID, 'date': {
                        $gte: new Date(startTime),
                        $lte: new Date(endTime)
                    }, deleted: {$ne: true}
                }
            },
            {
                $group: {
                    _id: {userID: "$userID"},
                    count: {$sum: 1}
                }
            },
            {
                "$group": {
                    "_id": {
                        userID: "$_id.userID"
                    }, totalViews: {$sum: "$count"},
                    "users": {
                        "$push": {
                            user: "$_id.userID",
                            "count": "$count"
                        }
                    }
                }
            }, {
                $project: {
                    "_id": {
                        userID: "$_id.userID"
                    }, uniqueViews: {$size: "$users"},
                    totalViews: "$totalViews"
                }
            }
        ], function (err, doc) {
            if (err)
                throw err;
            fn(doc);
        });

    });
}

//This is used for email report
exports.getUniqueEmotesAndTotalEmotesBySensor = function (collection, db, activityID, startTime, endTime, fn) {
    var db1 = dbClient.db(db);
    db1.collection(collection, function (err, collection) {

        collection.aggregate([
            {
                $match: {
                    activityID: activityID, 'date': {
                        $gte: new Date(startTime),
                        $lte: new Date(endTime)
                    }, deleted: {$ne: true}
                }
            },
            {
                $group: {
                    _id: {activityID: "$activityID", userID: "$userID"},
                    count: {$sum: 1}
                }
            },
            {
                "$group": {
                    "_id": {
                        activityID: "$_id.activityID"
                    }, totalEmotes: {$sum: "$count"},
                    "users": {
                        "$push": {
                            user: "$_id.userID",
                            "count": "$count"
                        }
                    }
                }
            }, {
                $project: {
                    "_id": {
                        activityID: "$_id.activityID"
                    }, uniqueEmotes: {$size: "$users"},
                    totalEmotes: "$totalEmotes"
                }
            }
        ], function (err, doc) {
            if (err)
                throw err;
            fn(doc);
        });

    });
}

exports.insertMultipleDocuments = function (collection, doc, order, db, fn) {
    var fn1 = function () {
        },
        fn1 = fn || fn1,
        db1 = dbClient.db(db);

    db1.collection(collection, function (err, col) {
        //console.log(collection);
        //console.log(col);
        col.insertMany(doc, {ordered: order}, function (err, records) {
            if (err) {
                fn1(err);
                return;
            }
            fn1(null, doc);
        });
    });
};



