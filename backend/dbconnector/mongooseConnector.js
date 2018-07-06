var mongoose = require('mongoose');

var config = require('../config/config');

var retryCount = 0;
var connection;
var errorHandler = require('../errorhandler/errorHandler');
exports.openConnection = function (cb) {

        mongoose.connect(config.mongodb.centralDBString).then(()=>{
                logger.info("Successfuly connected to mongodb using mongoose");
                retryCount = 0;
                mongoose.connection.on('disconnected', function () {
                    logger.info('Mongoose default connection disconnected');
                    cb(false, true);
                });
                cb(false, false);

    }).catch( err =>{
        logger.info('Cannot connect to mongoDB using mongoose, retrying')
               retryCount++;
               if (retryCount <= config.mongodb.maxRetries) {
                   setTimeout(function () {
                       exports.openConnection(cb);
                   }, config.mongodb.connectionTimeout);

               } else {
                   errorHandler.handleError('Maximum retries are exceeded still unable to connect to server, check whether' +
                       ' mongo service up and running and network is alive ', err);
                   cb(true,false);
               }
           });

}

