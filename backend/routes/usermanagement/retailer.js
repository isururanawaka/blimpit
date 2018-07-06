var config = require('../../config/config');
var mongoConnector = require('../../dbconnector/mongodbConnector');
var category = require('../../routes/categorymanagement/category');
var boom = require('boom');


const retailerTable = "retailers";

exports.addRetailerProfile = function (req, done) {
    var body = req.body;
    var userId = req.body._id;
    if (body) {
        mongoConnector.insertDocument(config.mongodb.centralDB, retailerTable, body, function (err, msg) {
            if (err) {
                done(err);
            } else {
                var categories = req.body.categories;
                if (categories) {
                    var count = 0;
                    for (var catcount in categories) {
                           var id = categories[catcount].categoryId;
                           var newreq ={};
                           newreq.body= {"categoryId":id,"retailers":[{"user_id":userId}]};
                           category.addElementToChildArray(newreq, function (err,msg) {
                               if(err){
                                   done(err);
                               }else{
                                   count++;
                                   if(count ==categories.length){
                                       done(null, "msg:Successfully added the retailer");
                                   }
                               }

                           });
                    }
                }
            }
        });
    } else {
        done(boom.badRequest("Cannot find category object"));
    }
}

exports.updateRetailerProfile = function (req, done) {
    var body = req.body;
    var userId = req.body._id;
    if (body && userId) {
        var updatedbody = body;
        updatedbody._id=undefined;
        mongoConnector.updateDocument(config.mongodb.centralDB, retailerTable, {"_id":userId}, updatedbody,function (err, msg) {
            if (err) {
                done(err);
            } else {
            mongoConnector.selectSpecificDocuments(config.mongodb.centralDB,retailerTable,)





                var categories = req.body.categories;
                if (categories) {
                    var count = 0;
                    for (var catcount in categories) {
                        var id = categories[catcount].categoryId;
                        var newreq ={};
                        newreq.body= {"categoryId":id,"retailers":[{"user_id":userId}]};
                        category.deleteElementsFromChildArray(newreq, function (err,msg) {
                            if(err){
                                done(err);
                            }else{
                                count++;
                                if(count ==categories.length){
                                  category
                                }
                            }

                        });
                    }
                }
            }
        });
    } else {
        done(boom.badRequest("Cannot find category object"));
    }
}


