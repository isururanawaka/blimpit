var User = require('../../model/signinandsignup/user');
var tmpinfo = require('../../model/signinandsignup/tmppassinfo');
var utils = require('../../utilities/query/utils');

var config = require('../../config/config');

var emailHandler = require('../../utilities/email/emailhandler');

var smsHandler = require('../../utilities/sms/smshandler');
var boom = require('boom');
exports.localSignIn = function (req, done) {
    var userId = req.body.userId;
    var password = req.body.password;
    if (!userId || !password) {
        return done(boom.badRequest("UserId and Password are required"));
    }
    if (userId)
        userId = userId.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function () {
        User.findOne({'user_id': userId}, function (err, user) {
            // if there are any errors, return the error
            if (err) {
                return done(boom.internal('Error occurred while processing the request'));
            } else if (!user) {
                // if no user is found, return the message
                return done(boom.notFound('No user found.'));

            } else if (!user.local.password && user.facebook.id) {
                return done(boom.forbidden('Cannot login via local, login via facebook'));
            } else if (!user.local.password && user.google.id) {
                return done(boom.forbidden('Cannot login via local, login via google'));
            } else if (!user.validPassword(password)) {
                return done(boom.unauthorized('Oops! Wrong password.'));
            } else
                return done(null, user);
        });
    });

}

exports.sendPasswordResettingInfo = function (req, cb) {

    var user_id = req.body.userId;
    if (!user_id) {
        return cb(boom.badRequest("UserId required"));
    }
    if (user_id)
        user_id = user_id.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function () {
        // if the user is not already logged in:
        User.findOne({'user_id': user_id}, function (err, user) {
            // if there are any errors, return the error
            if (err)
                return cb(boom.internal('Error occured while processing the request'));

            // check to see if theres already a user with that email
            if (user) {

                tmpinfo.findOne({'user_id': user_id}, function (err, tmpuser) {
                    // if there are any errors, return the error
                    if (err)
                        return cb(boom.internal('Error occured while processing the request'));

                    // check to see if theres already a user with that email
                    if (tmpuser && user.local.email) {

                        return cb(null, 'Resetting link already sent to email ' + user_id);

                    } else {

                        // var newUser = new user();
                        // newUser.user_id = email;
                        // newUser.local.email = email;
                        // newUser.local.password = newUser.generateHash(password);
                        // newUser.local.username = req.body.username;
                        // newUser.local.businessType = req.body.BType;

                        var queryId = utils.getRandomId();

                        var newTempInfo = new tmpinfo();
                        newTempInfo.user_id = user_id;
                        newTempInfo.email = user_id;
                        newTempInfo.q_id = queryId.toString();

                        if (user.local.email) {

                            var link = config.user.passwordresetemail + "?email=" + user_id + "&id=" + queryId;
                            var text = "Hello,<br> Please click on the below link to reset your password" +
                                "The link will expire after 24 hours" + "<br><a href=" + link + ">reset password</a>";

                            emailHandler.sendMail(user_id, config.user.passwordresetsubject, text, function (err) {
                                if (err) {
                                    return cb(boom.internal('Cannot send resetting email to ' + user_id +
                                        ' Please provide a valid email address'));

                                } else {

                                    newTempInfo.save(function (err) {
                                        if (err) {
                                            return cb(boom.internal('Error occured while processing the request'));
                                        } else {
                                            return cb(false, true, false, 'Resetting email sent to ' + user_id);
                                        }
                                    });


                                }

                            });

                        } else if (user.local.phone && tmpuser) {

                            tmpinfo.findOneAndRemove({'user_id': user_id}, function (err, response) {
                                var message = 'Your verification code ' + queryId;
                                smsHandler.sendSMS(config.twilo.phonenumber, user.local.phone, message, function (err, response) {
                                    if (err) {
                                        cb(boom.internal('Error occurred while processing the request'));
                                    } else {
                                        newTempInfo.save(function (err) {
                                            if (err)
                                                return cb(boom.internal('Error occurred while processing the request'));

                                            return cb(false, false, true, 'verification code sent to ' + user_id);
                                        });

                                    }

                                });
                            });
                        } else if (user.local.phone && !tmpuser) {
                            var message = 'Your verification code ' + queryId;
                            smsHandler.sendSMS(config.twilo.phonenumber, user.local.phone, message, function (err, response) {
                                if (err) {
                                    cb(boom.internal('Error occurred while processing the request'));
                                } else {
                                    newTempInfo.save(function (err) {
                                        if (err)
                                            return cb(boom.internal('Error occurred while processing the request'));

                                        return cb(false, false, true, 'verification code sent to ' + user_id);
                                    });

                                }

                            });
                        }
                    }
                });


            } else {
                return cb(boom.badRequest('Cannot find a registered user'));
            }
        });

    });
}

exports.allowAccessToUpdatePassword = function (req, cb) {
    var user_id, query_id;
    if (req.query.email) {
        user_id = req.query.email;
        query_id = req.query.id
        if (!user_id || !query_id) {
            return cb(boom.badRequest("UserId and QueryId required"));
        }
    } else if (req.body.phonenumber) {
        user_id = req.body.phonenumber;
        query_id = req.body.code;
        if (!user_id || !query_id) {
            return cb(boom.badRequest("UserId and QueryId required"));
        }
    } else if (req.body.email) {
        user_id = req.body.email;
        query_id = req.body.id;
        if (!user_id || !query_id) {
            return cb(boom.badRequest("UserId and QueryId required"));
        }
    }
    else {
        return cb(boom.notFound("Parameter mismatching"));
    }

    tmpinfo.findOne({'user_id': user_id}, function (err, reuser) {
        // if there are any errors, return the error
        if (err) {
            return cb(boom.internal("Error occurred while validating the user"));
        }
        // check to see if there is already a user with that email
        if (reuser) {
            if (query_id.toString() == reuser.q_id) {

                return cb(false, 'Authenticated to reset');
            } else {
                return cb(boom.conflict('Query Id validation failed'));
            }
        } else {
            return cb(boom.notFound("User not found"));
        }
    });
}

exports.updatePassword = function (req, cb) {
    var user_id = req.body.userId;
    var password = req.body.password;
    if (!user_id || !password) {
        return cb(boom.notFound("UserId and Password are required"));
    }

    User.findOne({'user_id': user_id}, function (err, user) {
        if (err) {
            return cb(boom.notFound('user not found'));
        }

        if (user) {
            user.local.password = user.generateHash(password);

            tmpinfo.findOneAndRemove({'user_id': user_id}, function (err, usr) {
                if (err) {
                    return cb(boom.internal("Failed to update the password"));
                }
                else {

                    User.findOneAndUpdate({'user_id': user_id}, user, {upsert: true}, function (err, emailuser) {
                        if (err) {
                            return cb(boom.internal("Failed to update the password"));
                        } else {
                            return cb(false, "Successfully updated the password");
                        }
                    });
                }
            });
        } else {
            return cb(boom.notFound("No user found"));
        }
    });
}