/**
 * A node file responsible for start the server and configure express app
 */

//web framework
var express = require('express');

//file handler library
var fs = require('fs');

var app = express();

//***********************Security Configurations********************//
//security handler of express
var helmet = require('helmet');

//enabling dnsPrefetchControl to improve the performance
app.use(helmet({ dnsPrefetchControl: { allow: true }}));

//the CSP module sets the Content-Security-Policy header
// which can help protect against malicious injection of JavaScript, CSS, plugins.
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'https://cloudinary.com/']
    }
}))

// Enable this for HTTP Public Key Pining
//var ninetyDaysInSeconds = 7776000
// app.use(helmet.hpkp({
//     maxAge: ninetyDaysInSeconds,
//     sha256s: ['AbCdEf123=', 'ZyXwVu456='],
//     reportUri: 'https://example.com/hpkp-report',
//     reportOnly: true
// }))

//disabling caching at the browser
app.use(helmet.noCache());

// Referer header allows among cross domains
app.use(helmet.referrerPolicy({ policy: 'same-origin' }));

try {
    var sslOptions = {
        key: fs.readFileSync('./utilities/securitykeys/key.pem'),
        cert: fs.readFileSync('./utilities/securitykeys/cert.pem'),
        passphrase: 'blimpit'
    };
}catch (error){
    logger.error('Cannot read private key and certificate files due to '+er.stack);
}
var https = require('https');
//**************************Performance Improvements*******************//


//used for improve performance, used it in reverse proxy level at production (e.g Nginx)
var compression = require('compression');
app.use(compression());

//**************************Logger ***********************************//

var winston = require('winston');
logger = winston.createLogger({
    format: winston.format.simple(),
    transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'server.log' })
]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

//*****************************Error Handling******************************//
var mailHandler = require('./utilities/email/emailhandler');
var config = require("./config/config");
if (process.env.NODE_ENV === 'production') { // [2]
    process.on('uncaughtException', function (er) {
        logger.error(er.stack)
        mailHandler.sendMail({
            to: config.email.user,
            subject: er.message,
            text: er.stack // [4]
        }, function (er) {
            if (er) logger.error(er)
            process.exit(1) // [5]
        })
    })
}

//*************************Passport Related Configurations******************//

//var session      = require('express-session');
//var flash    = require('connect-flash');

// required for passport
// app.use(session({
//     secret: 'blimpIt', // session secret
//     resave: true,
//     saveUninitialized: true
// }));

var passport = require('passport');
app.use(passport.initialize());

logger.info('Configuring passport module for identity management');
var pass = require('./config/passport');
pass.configureStrategies(passport, function () {
    logger.info(' Successfully configured the passport module')
});

//Disable passport session for JWT
// app.use(passport.session()); // persistent login sessions'
//app.use(flash()); // use connect-flash for flash messages stored in session

var cookieParser = require('cookie-parser');
app.use(cookieParser()); // read cookies (needed for auth)

//********************************Database Configuration and Server Startup******************************//



var mongooseConnector = require('./dbconnector/mongooseConnector');
var mongoConnector = require('./dbconnector/mongodbConnector');
var bodyParser   = require('body-parser');


var oauthGateway = require('./routes/identitymanagement/authenticationgateway');

var server ;


app.use(bodyParser.json());
// get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs'); // set up ejs for templating


logger.info('Registering routes ................');
oauthGateway.registerRoutes(app,passport, function () {
logger.info('Authentication routers registration completed');
});

var catGW = require('./routes/categorymanagement/catmanagementgw');
catGW.registerCategoryRoutes(app,passport,function () {
    logger.info('Category routers registration completed');
});

var retailerGW = require('./routes/usermanagement/retailergateway');
retailerGW.registerRetailerRoutes(app,passport,function () {
    logger.info('Retailer routers registration completed');
});

var dbIndexer = require('./dbconnector/dbindexer');

mongooseConnector.openConnection(function (err, condrop) {
    if(!err & !condrop){
        mongoConnector.openConnection(function (mongoerr, mongocondrop) {
            if(!mongoerr & ! mongocondrop){
             //   dbIndexer.indexCollections(function (err,result) {
                    // if(err){
                    //     logger.info(err);
                    //     process.exit(0);
                    // }else {
                      //  logger.info("Succesfully indexed the collections");
                        server =   app.listen(config.blimpit.httpport, function (err) {
                            if (err){
                                logger.info('BlimpIt http server failed to start on port '+ config.blimpit.httpport);
                            } else{
                                logger.info('BlimpIt http server started to listen  on port '+ config.blimpit.httpport);
                            }
                        });
               //     }
             //   })



https.createServer(sslOptions,app).listen(config.blimpit.httpsport, function (err) {
    if (err){
        logger.info('BlimpIt https server failed to start on port '+ config.blimpit.httpsport);
    } else{
        logger.info('BlimpIt https server started to listen  on port '+ config.blimpit.httpsport);
    }
});


            }else  if(!mongocondrop){
                logger.info('Cannot connect to mongo server using mongodb adapter');
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
        logger.info('Cannot connect to mongo server')
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
    logger.info('Shutting down BlimpIt server...');
    try {
        server.close(function () {
            process.exit(0);
        });
    }catch (err){

    }

    module.exports = app;
    module.exports =logger;
}
