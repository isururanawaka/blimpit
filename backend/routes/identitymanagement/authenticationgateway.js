var signUp = require('./signup');
var config = require('../../config/config');
var signIn = require('./signIn');
var redis = require('../../dbconnector/redisconnector');
var pass = require('../../config/passport');
var jwtUtils = require('../../utilities/jwt/jwtutils');

var jwt = require('jsonwebtoken');
var httpStatus = require('http-status-codes');


//Error handling framework
var boom = require('boom');


exports.registerRoutes = function (app, passport, cb) {
    

    
    
    
    // process the login form
    app.post('/login', function (req, res) {
        signIn.localSignIn(req, function (err, user, msg) {
            if (user) {
                req.logIn(user, {session: false}, function (err) {
                    if (err) {
                        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(err);
                    }
                    var userId = req.body.userId;
                    var token = pass.tokenCookieExtractor(req);
                    return jwtUtils.getTokens(res, userId,token);
                });
            } else if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(msg);
            }
        });
    });

    app.post('/token', function (req, res) {
        var token = pass.tokenCookieExtractor(req);
        var refreshToken = pass.refreshTokenCookieExtractor(req);
        var userId = req.body.userId;
        var key = userId + token;
        redis.readValue(key, function (err, token) {
            if (err) {
                return res.status(httpStatus.UNAUTHORIZED).json(err.output.payload.message);
            } else {
                if (token === refreshToken) {
                    var userId = req.body.userId;
                    return jwtUtils.getTokens(res, userId,null,true);
                }else {
                    return res.status(httpStatus.UNAUTHORIZED).json("Invalid credentials");
                }
            }
        })
    });


    app.post('/test', passport.authenticate(config.jwt.strategy, {session: false}), function (req, res) {

    });


    // SIGNUP =================================

    // process the signup form need a capture in signUP form
    app.post('/signup', function (req, res) {

        signUp.localSignUp(req, function (err, user, msg) {
            if (user) {
                return res.json(msg);
            } else if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(msg);
            }
        });
    });


    //process email verification for local users
    app.get('/verify', function (req, res) {
        signUp.localEmailSignUpVerification(req, function (err, msg) {
            if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                return res.json("Successfully validated the user, please login");
            }
        });
    });


    app.post('/resendpass', function (req, res) {
        signIn.sendPasswordResettingInfo(req, function (err, viaemail, viaphone, msg) {
            if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                return res.json(msg);
            }
        })
    });


    app.get('/ispassresettingallowed', function (req, res) {
        signIn.allowAccessToUpdatePassword(req, function (err, msg) {
            if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                var token = jwt.sign(req.toString(), config.user.jwtsecret,{expiresIn: config.jwt.jwtexpiration});
                return res.json({"token": token, "message": "Allowed"});
            }
        });
    });


    app.post('/ispassresettingallowed', function (req, res) {
        signIn.allowAccessToUpdatePassword(req, function (err, msg) {
            if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                var token = jwt.sign(req.toString(), config.user.jwtsecret);
                return res.json({"token": token, "message": "Allowed"});
            }

        });
    });

    app.post('/resetpass', function (req, res, next) {

        signIn.allowAccessToUpdatePassword(req, function (err, msg) {
            if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                if (req) {
                    signIn.updatePassword(req, function (err, msg) {
                        if (err) {
                            return res.status(err.output.payload.statusCode).json(err.output.payload.message);
                        } else {
                            return res.json(msg);
                        }
                    });
                } else {
                    return res.status(httpStatus.UNAUTHORIZED).json("Unauthorized");
                }
            }
        });
    });


    app.post('/insertphoneverifycode', function (req, res) {
        signUp.localPhoneSignUpVerification(req, function (err) {
            if (err) {
                return res.status(err.output.payload.statusCode).json(err.output.payload.message);
            } else {
                return res.json("Successfully verified the user");
            }
        });
    });


    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', {session: false, scope: ['public_profile', 'email']}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        function (req, res, next) {
            passport.authenticate('facebook', {session: false}, function (err, user, info) {
                if (err) {
                    return res.status(httpStatus.UNAUTHORIZED), json("Error occurred while authorizing via facebook  " + err)
                }
                if (!user) {
                    return res.status(httpStatus.NOT_FOUND), json("User not found");
                }
                req.logIn(user, {session: false}, function (err) {
                    if (err) {
                        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json("Error occurred while authorizing via facebook  " + err)
                    } else {
                        var userId = user.facebook.id;
                        var token = pass.tokenCookieExtractor(req);
                        return jwtUtils.getTokens(res, userId,token);
                    }
                });
            })(req, res, next);
        }
    );

    // twitter --------------------------------

    // // send to twitter to do the authentication
    // app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
    //
    // // handle the callback after twitter has authenticated the user
    // app.get('/auth/twitter/callback',
    //     passport.authenticate('twitter', {
    //         successRedirect : '/profile',
    //         failureRedirect : '/'
    //     }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        function (req, res, next) {
            passport.authenticate('google', function (err, user, info) {
                if (err) {
                    return res.status(httpStatus.UNAUTHORIZED), json("Error occurred while authorizing via google  " + err)
                }
                if (!user) {
                    return res.status(httpStatus.NOT_FOUND), json("User not found");
                }
                req.logIn(user, {session: false}, function (err) {
                    if (err) {
                        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json("Error occurred while authorizing via google  " + err)
                    } else {
                        var userId = user.google.id;
                        var token = pass.tokenCookieExtractor(req);
                        return jwtUtils.getTokens(res, userId,token);
                    }
                });
            })(req, res, next)
        }
    );

    cb();

}


