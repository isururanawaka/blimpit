var config = require('../../config/config');
var pass = require('../../config/passport');

var httpStatus = require('http-status-codes');
var retailer = require('./retailer');

//Error handling framework
var boom = require('boom');


exports.registerRetailerRoutes = function (app, passport, cb) {
    // process the login form
    app.post('/addRetailerProfile', function (req, res) {

        retailer.addRetailerProfile(req,function (err, msg) {
            if(err){
                 res.status(err.output.payload.statusCode).json({"msg" :err.output.payload.message});
            }else {
                 res.json(msg);
            }
        })
    });

    cb();
}