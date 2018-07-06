var user = require('../../model/signinandsignup/user');
var tmpUser = require('../../model/signinandsignup/tempuser');

var config = require('../../config/config');

var emailHandler = require('../../utilities/email/emailhandler');
var smsHandler = require('../../utilities/sms/smshandler');
var utils = require('../../utilities/query/utils');
var boom = require('boom');


exports.localSignUp = function (req, done) {
    try {
        var userId = req.body.userId;
        var password = req.body.password;
        var userIdType = req.body.userIdType;
        var userType = req.body.userType;
        var username = req.body.username;
        if (!userId || !password || !userIdType || ! userType || !username) {
            return done(boom.badRequest("UserId, UserIdType, Password, UserName, and UserType are required"));
        }
        if (userIdType == config.user.emailType) {
            userId = userId.toLowerCase();
        }
// Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function () {
            // if the user is not already logged in:
            try {
                if (!req.user) {
                    user.findOne({'user_id': userId}, function (err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(boom.internal('Error while proccessing the request'));
                        // check to see if theres already a user with that email
                        if (user) {
                            if (user.facebook.id) {
                                return done(boom.forbidden('You have already signUp using facebook, please login via facebook'));
                            } else if (user.google.id) {
                                return done(boom.forbidden('You have already signUp using google, please login via google'));
                            } else {
                                return done(boom.forbidden('You have already signUp using local, please login via local'));
                            }
                        } else {
                            tmpUser.findOne({'user_id': userId}, function (err, tmpuser) {
                                // if there are any errors, return the error
                                if (err)
                                    return done(boom.internal('Error while processing the request'));
                                // check to see if theres already a user with that email
                                if (tmpuser) {
                                    if (userIdType == config.user.emailType) {
                                        return done(null, 'Verification email already sent to ' + userId + ' Please verify it');
                                    } else {
                                        tmpUser.findOneAndRemove({'user_id': userId}, function (err, response) {
                                            if (!err) {
                                                saveTempUser(userId, req, password, done);
                                            }
                                        });
                                    }
                                } else {
                                    saveTempUser(userId, req, password, done);
                                }
                            });
                        }
                    });
                } else {
                    return done(null, req.user);
                }
            } catch (exception) {
                boom.internal('Error occured while processing the request');
            }
        });
    } catch (exception) {
        boom.internal('Error occured while processing the request');
    }
}


exports.localEmailSignUpVerification = function (req, cb) {
    try {
        if (req.query.email) {
            tmpUser.findOne({'email': req.query.email}, function (err, reuser) {
                try {
                    // if there are any errors, return the error
                    if (err) {
                        return cb(boom.unauthorized('Error occurred while validating user'));
                    }
                    // check to see if theres already a user with that email
                    if (reuser) {
                        if (req.query.id && req.query.id.toString() == reuser.q_id) {
                            tmpUser.findOneAndRemove({'email': reuser.email}, function (err) {
                                if (err) {
                                    return cb(boom.notFound('user not found '));
                                }
                                else {
                                    var newUser = new user();
                                    newUser.user_id = reuser.email;
                                    newUser.local.email = reuser.email;
                                    newUser.local.password = reuser.password;
                                    newUser.local.username = reuser.username;
                                    newUser.userType = reuser.userType
                                    newUser.save(function (err) {
                                        if (err) {
                                            return cb(boom.unauthorized('Error occured while validating the user and saving to database"'));
                                        } else {
                                            return cb(null, 'Succesfully validated the user');
                                        }
                                    });
                                }
                            });
                        } else {
                            return cb(boom.unauthorized('Query validation failed'));
                        }
                    } else {
                        return cb(boom.badRequest('This is not a valid request'));
                    }
                } catch (exception) {
                    boom.internal('Error occurred while processing the request');
                }
            });
        } else {
            return cb(boom.notFound('can not find query id'));
        }
    } catch (exception) {
        boom.internal('Error occured while processing the request');
    }
}


exports.localPhoneSignUpVerification = function (req, cb) {
    try {
        if (req.body.phonenumber) {
            tmpUser.findOne({'phone': req.body.phonenumber}, function (err, reuser) {
                // if there are any errors, return the error
                if (err) {
                    return cb(boom.unauthorized('Error occurred while validating user'));
                }
                // check to see if theres already a user with that email
                if (reuser) {
                    if (req.body.verificationcode && req.body.verificationcode == reuser.q_id) {
                        tmpUser.findOneAndRemove({'phone': reuser.phone}, function (err) {
                            if (err) {
                                return cb(boom.unauthorized('Error occured while validating the user and saving to database"'));
                            } else {
                                var newUser = new user();
                                newUser.user_id = reuser.phone;
                                newUser.local.phone = reuser.phone;
                                newUser.local.password = reuser.password;
                                newUser.local.username = reuser.username;
                                newUser.userType = reuser.userType;
                                newUser.save(function (err) {
                                    if (err) {
                                        return cb(boom.unauthorized('Error occured while validating the user and saving to database"'));
                                    } else {
                                        return cb(null, 'Succesfully validated the user');

                                    }
                                });
                            }

                        });
                    } else {
                        cb(boom.unauthorized('Query Id validation failed'));
                    }
                } else {
                    return cb(boom.notFound('User not found'));
                }
            });
        } else {
            cb(boom.badRequest("Cannot find query id"));
        }
    } catch (exception) {
        boom.internal('Error occurred while processing the request');
    }
}


exports.fbSignUp = function (req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function () {
        try {
            var user_id;
            // check if the user is already logged in
            if (!req.user && profile.emails[0]) {

                var email = profile.emails[0].value;
                if (email) {
                    user_id = email.toLowerCase();
                    user.findOne({'user_id': email}, function (err, userex) {
                        if (err) {
                            return done(boom.internal('Error occured while processing the request'));
                        }

                        if (userex) {
                            user.findOne({'facebook.id': profile.id}, function (errfb, fbuser) {
                                if (errfb)
                                    return done(boom.internal('Error occured while processing the request'));
                                if (fbuser) {

                                    return done(null, fbuser);
                                } else {
                                    user.facebook.id = profile.id;
                                    user.facebook.token = token;
                                    user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                                    user.facebook.email = user_id;

                                    user.findOneAndUpdate({'user_id': email}, user, {upsert: true}, function (err, emailuser) {
                                        if (err) {
                                            return done(boom.internal('Error occured while processing the request'));
                                        }
                                        return done(null, emailuser);

                                    });

                                }

                            });

                        } else {
                            var newUser = new user();
                            newUser.user_id = user_id;
                            newUser.userType = config.user.private;
                            newUser.facebook.id = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.facebook.email = user_id;

                            newUser.save(function (err) {
                                if (err)
                                    return done(boom.internal('Error occurred while processing the request'));

                                return done(null, newUser);
                            });

                        }

                    });
                } else {
                    user_id = profile.id;
                    user.findOne({'user_id': user_id}, function (err, userex) {
                        if (err) {
                            return done(boom.internal('Error occured while processing the request'));
                        }

                        if (userex) {

                            if (userex) {

                                return done(null, userex);
                            } else {
                                var newUser = new user();
                                newUser.user_id = user_id;
                                newUser.userType = config.user.private;
                                newUser.facebook.id = profile.id;
                                newUser.facebook.token = token;
                                newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                                newUser.facebook.email = undefined;

                                newUser.save(function (err) {
                                    if (err)
                                        return done(boom.internal('Error occured while processing the request'));

                                    return done(null, newUser);
                                });


                            }
                        }
                    });


                }
            } else {
                return done(null, req.user);
            }
        } catch (exception) {
            boom.internal('Error occurred while processing the request')
        }
    });

}


exports.googleSignUp = function (req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function () {
        try {
            var user_id;
            // check if the user is already logged in
            if (!req.user && profile.emails[0]) {

                var email = profile.emails[0].value;
                if (email) {
                    user_id = email.toLowerCase();
                    user.findOne({'user_id': email}, function (err, userex) {
                        if (err) {
                            return done(boom.internal('Error occured while processing the request'));
                        }

                        if (userex) {
                            user.findOne({'google.id': profile.id}, function (errfb, fbuser) {
                                if (errfb)
                                    return done(boom.internal('Error occured while processing the request'));

                                if (fbuser) {

                                    return done(null, fbuser);
                                } else {
                                    user.google.id = profile.id;
                                    user.google.token = token;
                                    user.google.name = profile.name.givenName + ' ' + profile.name.familyName;
                                    user.google.email = user_id;

                                    user.findOneAndUpdate({'user_id': email}, user, {upsert: true}, function (err, emailuser) {
                                        if (err) {
                                            return done(boom.internal('Error occured while processing the request'));
                                        }
                                        return done(null, emailuser);

                                    });

                                }

                            });

                        } else {
                            var newUser = new user();
                            newUser.user_id = user_id;
                            newUser.userType = config.user.private;
                            newUser.google.id = profile.id;
                            newUser.google.token = token;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = user_id;

                            newUser.save(function (err) {
                                if (err)
                                    return done(boom.internal('Error occured while processing the request'));

                                return done(null, newUser);
                            });

                        }

                    });
                } else {
                    user_id = profile.id;
                    user.findOne({'user_id': user_id}, function (err, userex) {
                        if (err) {
                            return done(boom.internal('Error occured while processing the request'));
                        }

                        if (userex) {

                            if (userex) {

                                return done(null, user);
                            } else {
                                var newUser = new user();
                                newUser.user_id = user_id;
                                newUser.userType = config.user.private;
                                newUser.google.id = profile.id;
                                newUser.google.token = token;
                                newUser.google.name = profile.displayName;
                                newUser.google.email = undefined;

                                newUser.save(function (err) {
                                    if (err)
                                        return done(boom.internal('Error occured while processing the request'));

                                    return done(null, newUser);
                                });


                            }
                        }
                    });


                }
            } else {
                return done(null, req.user);
            }
        } catch (exception) {
            boom.internal('Error occurred while processing the request');
        }
    });

}


function saveTempUser(user_id, req, password, done) {

    var userIdType = req.body.userIdType;
    var username = req.body.username;
    var userType = req.body.userType;
    if (!userIdType || !username || !userType) {
        return done(boom.badRequest("UserIdType, UserName and UserType required"));
    }

    var queryId = utils.getRandomId();


    var newTempUser = new tmpUser();
    if (userIdType == config.user.emailType) {
        newTempUser.email = user_id;
    } else {
        newTempUser.phone = user_id;
    }
    newTempUser.q_id = queryId.toString();
    newTempUser.password = newTempUser.generateHash(password);
    newTempUser.username = username;
    newTempUser.userType = userType;
    newTempUser.userId = user_id;

    try {
        if (userIdType == config.user.emailType) {
            newTempUser.email = user_id;
            var link = config.user.verficationlink + "?email=" + user_id + "&id=" + queryId;
            var text = "Hello,<br> Please click on the below link to verify your registation at the BlimpIt." +
                "The link will expire after 24 hours" + "<br><a href=" + link + ">Click here to verify</a>";

            emailHandler.sendMail(user_id, config.user.verificationsubject, text, function (err) {
                if (err) {
                    return done(null, null, 'Cannot send verification email to ' + user_id + ' Please provide a valid email address');

                } else {

                    newTempUser.save(function (err) {
                        if (err)
                            return done(boom.internal('Error occured while processing the request'));

                        return done(null, newTempUser, 'signupMessage Verification email sent to ' + user_id);
                    });

                }

            });

        } else {
            var message = 'Your verification code ' + queryId;
            smsHandler.sendSMS(config.twilo.phonenumber, user_id, message, function (err, response) {
                if (err) {
                    done(boom.internal('Error occurred while sending the verfication sms to ' + user_id));
                } else {
                    newTempUser.phone = user_id;
                    newTempUser.save(function (err) {
                        if (err)
                            return done(err);

                        return done(null, newTempUser, 'Verification code sent to ' + user_id);
                    });
                }

            });

        }
    } catch (exception) {
        done(boom.internal('Error occurred while userId verification'));
    }
}