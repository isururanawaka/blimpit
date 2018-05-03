var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var https = require('https');
var fs = require('fs');

var mongooseConnector = require('./dbconnector/mongooseConnector');
var passport = require('passport');
var flash    = require('connect-flash');


var bodyParser   = require('body-parser');
var session      = require('express-session');

var sslOptions = {
    key: fs.readFileSync('./utilities/securitykeys/key.pem'),
    cert: fs.readFileSync('./utilities/securitykeys/cert.pem'),
    passphrase: 'blimpit'
};




var config = require('./config/config');
var mongoConnector = require('./dbconnector/mongodbConnector');

var mongoose = require('mongoose');

var pass = require('./config/passport');

var gateway = require('./routes/gateway');

var app = express();

var server ;

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({
    secret: 'blimpIt', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session




console.log('Configuring passport module for identity management')
pass.configureStrategies(passport, function () {
    console.log(' Successfully configured the passport module')
});

console.log('Registering routes')
gateway.registerRoutes(app,passport, function () {
console.log('Router registration completed');
});



mongooseConnector.openConnection(function (err, condrop) {
    if(!err & !condrop){
        mongoConnector.openConnection(function (mongoerr, mongocondrop) {
            if(!mongoerr & ! mongocondrop){
                server =   app.listen(config.blimpit.httpport, function (err) {
                    if (err){
                        console.log('BlimpIt http server failed to start on port '+ config.blimpit.httpport);
                    } else{
                        console.log('BlimpIt http server started to listen  on port '+ config.blimpit.httpport);
                    }
                });


https.createServer(sslOptions,app).listen(config.blimpit.httpsport, function (err) {
    if (err){
        console.log('BlimpIt https server failed to start on port '+ config.blimpit.httpsport);
    } else{
        console.log('BlimpIt https server started to listen  on port '+ config.blimpit.httpsport);
    }
});


            }else  if(!mongocondrop){
                console.log('Cannot connect to mongo server using mongodb adapter');
                shutdownServer();
            } if(mongocondrop){
                mongoConnector.openConnection(function (mongoerr, mongocondrop) {
                    if(mongoerr & !mongocondrop){
                        shutdownServer();
                    }
                });
            }

        });
    }else if(!condrop){
        console.log('Cannot connect to mongo server')
        shutdownServer();
    }
    if(condrop){
        mongooseConnector.openConnection(function (err, condrop) {
            if(err & !condrop){
                  shutdownServer();
            }
        });

    }
});



function shutdownServer() {
    console.log('Shutting down BlimpIt server...');
    try {
        server.close(function () {
            process.exit(0);
        });
    }catch (err){

    }

    module.exports = app;
}
