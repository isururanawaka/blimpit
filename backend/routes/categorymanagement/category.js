var config = require('../../config/config');
var mongoConnector = require('../../dbconnector/mongodbConnector');
var boom = require('boom');

const catTable = "categories";
const catMappingTable = config.collections.catmapper;




exports.addCategory = function (req, done) {
    var category = req.body;
    if (category) {
        var position = req.body.position;
        if (position) {
            mongoConnector.selectSpecificDocuments(config.mongodb.centralDB, catMappingTable, {_id: position}, {
                "name": 1,
                "_id": 0
            }, function (err, result) {
                if (err) {
                    return done(boom.internal("Error occurred while searching categorymapping collection"));
                } else if (result.length ==0) {
                   var tableName = "categorylayer"+position;
                   var obj = {"_id":position,"name":tableName}
                   mongoConnector.insertDocument(config.mongodb.centralDB,catMappingTable,obj, function (err,msg) {
                      if(err){
                          return done(boom.internal("Error occurred while inserting into categorymapping collection"));
                      }else {
                          mongoConnector.insertDocument(config.mongodb.centralDB, tableName, req.body, function (err, msg) {
                              if (err) {
                                  return done(err);
                              }
                              if (position >1){
                                  var parentPosition = position -1;
                                  mongoConnector.selectSpecificDocuments(config.mongodb.centralDB, catMappingTable,{_id:position},{
                                      "name": 1,
                                      "_id": 0
                                  },function (err,res) {
                                      if(err){
                                          return done(boom.internal("Error occurred while searching categorymapping collection"));
                                      } else{
                                          if(res.length>0){
                                              var tableName = res[0].name;
                                              var prcatid = req.body.parent;
                                              var query = {"_id": prcatid};
                                              var array = [];
                                              var value = {"$addToSet": {"subcategories": {"$each": array}}};
                                              var childArray = [{"_id":category._id}];
                                              addToChildArray(query,value,childArray,array,tableName,function (err,result) {
                                                 if(err){
                                                     done(err);
                                                 } else{
                                                     done(null,result);
                                                 }
                                              })
                                          }
                                      }

                                  });
                              }
                          });
                      }
                   });

                }else{
                    var tableName = result[0].name;
                    mongoConnector.insertDocument(config.mongodb.centralDB, tableName, req.body, function (err, msg) {
                        if (err) {
                            return done(err);
                        }
                        if (position >1){
                            var parentPosition = position -1;
                            mongoConnector.selectSpecificDocuments(config.mongodb.centralDB, catMappingTable,{_id:parentPosition},{
                                "name": 1,
                                "_id": 0
                            },function (err,res) {
                                if(err){
                                    return done(boom.internal("Error occurred while searching categorymapping collection"));
                                } else{
                                    if(res.length>0){
                                        var tableName = res[0].name;
                                        var prcatid = req.body.parent;
                                        var query = {"_id": prcatid};
                                        var array = [];
                                        var value = {"$addToSet": {"subcategories": {"$each": array}}};
                                        var childArray = [{"_id":category}];
                                        addToChildArray(query,value,childArray,array,tableName,function (err,result) {
                                            if(err){
                                                done(err);
                                            } else{
                                                done(null, result);
                                            }
                                        })
                                    }
                                }

                            });
                        }
                    });
                }
            });
        } else {
            return done(boom.badRequest("Position attribute required"));
        }


    } else {
        return done(boom.badRequest("Cannot find category object"));
    }
}

exports.deleteCategory = function (req, done) {
    var category = req.body;
    if (category) {
        var id = category._id;
        mongoConnector.deleteOneDocument(config.mongodb.centralDB, catTable, {"_id": id}, function (err, msg) {
            if (err) {
                return done(err);
            }
            return done(null, "Successfully deleted the document");
        });
    } else {
        return done(boom.badRequest("Cannot find category object"));
    }
}

exports.addElementToChildArray = function (req, done) {
    var body = req.body;
    var array = [];
    if (body) {
        var catid = req.body.categoryId;
        var query = {"_id": catid};

        if (req.body.subcategories) {
            childArray = req.body.subcategories;
            var value = {"$addToSet": {"subcategories": {"$each": array}}};
        } else if (req.body.retailers) {
            childArray = req.body.retailers;
            var value = {"$addToSet": {"retailers": {"$each": array}}};
        }

        if (catid && childArray) {
            for (var count in childArray) {
                var subCategory = childArray[count];
                array.push(subCategory);
            }

            mongoConnector.updateDocument(config.mongodb.centralDB, catTable, query, value, function (err, msg) {
                if (err) {
                    done(err);
                } else {
                    done(null, {"msg": "Successfully updated"});
                }
            });
        } else {
            done(boom.badRequest("CategoryId and ChildArray need not to be null"));
        }
    } else {
        done(boom.badRequest("Request body is missing"));
    }
}

exports.deleteElementsFromChildArray = function (req, done) {
    var body = req.body;
    var array = [];
    if (body) {
        var catid = req.body.categoryId;
        var query = {"_id": catid};
        var childArray = null;
        if (req.body.subcategories) {
            childArray = req.body.subcategories;
            var value = {"$pullAll": {"subcategories": array}};
        } else if (req.body.retailers) {
            childArray = req.body.retailers;
            var value = {"$pullAll": {"retailers": array}};
        }

        if (catid && childArray) {
            for (var count in childArray) {
                var subCategory = childArray[count];
                array.push(subCategory);
            }

            mongoConnector.updateDocument(config.mongodb.centralDB, catTable, query, value, function (err, msg) {
                if (err) {
                    done(err);
                } else {
                    done(null, {"msg": "Successfully removed"});
                }
            });
        } else {
            done(boom.badRequest("CategoryId and ChildArray need not be null"));
        }
    } else {
        done(boom.badRequest("Request body is missing"));
    }
}

exports.getCategoryIds = function (req, done) {
    var query = {_id: 1};
    mongoConnector.selectSpecificDocuments(config.mongodb.centralDB, catTable, {}, query, function (err, result) {
        if (err) {
            done(err);
        } else if (result) {
            done(null, result);
        }

    });
}

exports.getCategory = function (req, done) {
    var id = req.query._id;
    mongoConnector.selectSpecificDocuments(config.mongodb.centralDB, catTable, {_id: id}, {}, function (err, result) {
        if (err) {
            done(err);
        } else if (result) {
            done(null, result);
        }

    });
}

exports.getSubCategories = function (req, done) {
    var id = req.query._id;
    mongoConnector.selectSpecificDocuments(config.mongodb.centralDB, catTable, {_id: id}, {
        "subcategories": 1,
        "_id": 0
    }, function (err, result) {
        if (err) {
            done(err);
        } else if (result) {
            done(null, result);
        }

    });
}

function addToChildArray(query, value, childArray,temparray, collection, done)
{
    if (childArray) {
        for (var count in childArray) {
            var subCategory = childArray[count];
            temparray.push(subCategory);
        }
        mongoConnector.updateDocument(config.mongodb.centralDB, collection, query, value, function (err, msg) {
            if (err) {
                done(err);
            } else {
                done(null, {"msg": "Successfully updated"});
            }
        });
    }
}





