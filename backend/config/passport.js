// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;

var config = require('./config');
var passportJWT = require('passport-jwt');
const JWTStrategy   = passportJWT.Strategy;
const extractJWT = passportJWT.ExtractJwt;

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

var signUp = require('../routes/identitymanagement/signup');
var userSignIn = require('../routes/identitymanagement/signIn');

exports.tokenCookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies) token = req.cookies[config.jwt.token];
    return token;
};

exports.refreshTokenCookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies) token = req.cookies[config.jwt.refreshToken];
    return token;
};

var jwtOptions = {}
jwtOptions.jwtFromRequest = this.tokenCookieExtractor;
jwtOptions.secretOrKey = config.jwt.jwtsecret;
jwtOptions.passReqToCallback=true;


exports.configureStrategies = function(passport , cb) {

    /**
     //
     // Disable this for JWT
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the sessioni
    console.log('Registering user serialization');
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    console.log('Registering user deserialization');
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    }); **/



    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    logger.debug('Registering Local login strategy');
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'userId',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },function (req, userId, password, done) {

        userSignIn.localSignIn(req,userId,password,done);
        }
    ));


    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    logger.debug('Registering  Local sign up strategy');
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
            usernameField:'userId',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },function (req,userId,password,done) {
        if(req.body.BType==config.user.private){
            signUp.localSignUp(req,userId,password,done);
        }else {
            retailer.localSignUp(req,userId,password,done);
        }
    }));

    passport.use(config.jwt.strategy,new JWTStrategy(jwtOptions,function (req,jwtPayload,done) {

    }));




    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    var fbStrategy = configAuth.facebookAuth;
    fbStrategy.passReqToCallback = true;  // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    logger.debug('Registering  Facebook login strategy');
    passport.use(new FacebookStrategy(fbStrategy,
    function(req, token, refreshToken, profile, done) {
        signUp.fbSignUp(req,token,refreshToken,profile,done);
    }));




    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    // console.log('Registering  Twitter login strategy');
    // passport.use(new TwitterStrategy({
    //
    //     consumerKey     : configAuth.twitterAuth.consumerKey,
    //     consumerSecret  : configAuth.twitterAuth.consumerSecret,
    //     callbackURL     : configAuth.twitterAuth.callbackURL,
    //     passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    //
    // },
    // function(req, token, tokenSecret, profile, done) {
    //
    //     // asynchronous
    //     process.nextTick(function() {
    //
    //         // check if the user is already logged in
    //         if (!req.user) {
    //
    //             User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
    //                 if (err)
    //                     return done(err);
    //
    //                 if (user) {
    //                     // if there is a user id already but no token (user was linked at one point and then removed)
    //                     if (!user.twitter.token) {
    //                         user.twitter.token       = token;
    //                         user.twitter.username    = profile.username;
    //                         user.twitter.displayName = profile.displayName;
    //
    //                         user.save(function(err) {
    //                             if (err)
    //                                 return done(err);
    //
    //                             return done(null, user);
    //                         });
    //                     }
    //
    //                     return done(null, user); // user found, return that user
    //                 } else {
    //                     // if there is no user, create them
    //                     var newUser                 = new User();
    //
    //                     newUser.twitter.id          = profile.id;
    //                     newUser.twitter.token       = token;
    //                     newUser.twitter.username    = profile.username;
    //                     newUser.twitter.displayName = profile.displayName;
    //
    //                     newUser.save(function(err) {
    //                         if (err)
    //                             return done(err);
    //
    //                         return done(null, newUser);
    //                     });
    //                 }
    //             });
    //
    //         } else {
    //             // user already exists and is logged in, we have to link accounts
    //             var user                 = req.user; // pull the user out of the session
    //
    //             user.twitter.id          = profile.id;
    //             user.twitter.token       = token;
    //             user.twitter.username    = profile.username;
    //             user.twitter.displayName = profile.displayName;
    //
    //             user.save(function(err) {
    //                 if (err)
    //                     return done(err);
    //
    //                 return done(null, user);
    //             });
    //         }
    //
    //     });
    //
    // }));

    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    logger.debug('Registering  Google login strategy');
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {
   signUp.googleSignUp(req,token,refreshToken,profile,done);
    }));
cb();



};
