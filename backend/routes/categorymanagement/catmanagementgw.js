var config = require('../../config/config');
var pass = require('../../config/passport');

var httpStatus = require('http-status-codes');
var category = require('./category');

//Error handling framework
var boom = require('boom');


exports.registerCategoryRoutes = function (app, passport, cb) {
    // process the login form
    app.post('/addCategory', function (req, res) {

        category.addCategory(req,function (err, msg) {
            if(err){
               return res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
               return res.json(msg);
            }
        })
    });
    app.post('/deleteCategory', function (req, res) {

        category.deleteCategory(req,function (err, msg) {
            if(err){
              return  res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
              return  res.json(msg);
            }
        })
    });

    app.post('/addSubCategory', function (req, res) {

        category.addElementToChildArray(req,"subcategories",req.body.subcategories,function (err, msg) {
            if(err){
             return   res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
              return  res.json(msg);
            }
        })
    });


    app.post('/deleteSubCategory', function (req, res) {

        category.deleteElementsFromChildArray(req,function (err, msg) {
            if(err){
               return res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
               return res.json(msg);
            }
        })
    });

    app.post('/addRetailer', function (req, res) {

        category.addElementToChildArray(req,function (err, msg) {
            if(err){
              return  res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
               return res.json(msg);
            }
        })
    });


    app.post('/deleteRetailer', function (req, res) {

        category.deleteElementsFromChildArray(req,function (err, msg) {
            if(err){
               return  res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
              return  res.json(msg);
            }
        })
    });

    app.get('/getCategoryIds',function (req,res) {
       category.getCategoryIds(req,function (err,msg) {
           if(err){
               return  res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
           }else {
               return  res.json(msg);
           }
       });
    })


    app.get('/getCategory',function (req,res) {
        category.getCategory(req,function (err,msg) {
            if(err){
                return  res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
                return  res.json(msg);
            }
        });
    });


    app.get('/getSubCategories',function (req,res) {
        category.getSubCategories(req,function (err,msg) {
            if(err){
                return  res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
                return  res.json(msg);
            }
        });
    });

    cb();
}




