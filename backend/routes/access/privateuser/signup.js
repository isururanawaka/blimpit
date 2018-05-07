var user       = require('../../../model/user');
var tmpUser       = require('../../../model/tempuser');

var config = require('../../../config/config');

var emailHandler = require('../../../utilities/email/emailhandler');
var smsHandler = require('../../../utilities/sms/smshandler');
var utils = require('../../../utilities/query/utils');



exports.localSignUp = function(req, userId, password, done) {
    var user_id;
    if(req.body.userIdType==config.user.emailType){
        user_id = userId.toLowerCase();
    }else {
        user_id = userId;
    }
// Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function() {
        // if the user is not already logged in:
        if (!req.user) {
            user.findOne({'user_id': user_id}, function (err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    if (user.facebook) {
                        return done(null, false, req.flash('signupMessage',
                            'You have already signUp using facebook, please login via facebook'));
                    } else if (user.google) {
                        return done(null, false, req.flash('signupMessage',
                            'You have already signUp using google, please login via google'));
                    } else {
                        //TODO: send password to email
                        return done(null, false, req.flash('signupMessage',
                            'You have already signUp using local, please login via local'));
                    }

                } else {

                    tmpUser.findOne({'user_id': user_id}, function (err, tmpuser) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        // check to see if theres already a user with that email
                        if (tmpuser) {
                            if(req.body.userIdType==config.user.emailType){
                                return done(null, false, req.flash('signupMessage',
                                    'Verification email already sent to '+ user_id+ ' Please verify it'));
                            }else {
                                //TODO; resend new code to phone
                                return done(null, false, req.flash('signupMessage',
                                    'Verification code already sent to '+ user_id+ ' Please verify it'));
                            }




                        } else{


                    var queryId = utils.getRandomQueryId();

                     var newTempUser = new tmpUser();
                            if(req.body.userIdType==config.user.emailType){
                                newTempUser.email = user_id;
                            }else {
                                newTempUser.phone = user_id;
                            }
                    newTempUser.q_id = queryId.toString();
                    newTempUser.password = newTempUser.generateHash(password);
                    newTempUser.username = req.body.username;
                    newTempUser.businessType = req.body.BType;
                            if(req.body.userIdType==config.user.emailType){
                                newTempUser.email = user_id;
                                var link = config.user.verficationlink+"?email="+user_id+"&id="+queryId;
                                var text = "Hello,<br> Please click on the below link to verify your registation at the BlimpIt." +
                                    "The link will expire after 24 hours" + "<br><a href="+link+">Click here to verify</a>";

                                emailHandler.sendMail(user_id, config.user.verificationsubject,text, function(err){
                                    if (err) {
                                        return done(null, false, req.flash('signupMessage',
                                            'Cannot send verification email to '+ user_id+ ' Please provide a valid email address'));

                                    } else {

                                        newTempUser.save(function (err) {
                                            if (err)
                                                return done(err);

                                            return done(null, newTempUser,req.flash('signupMessage',
                                                'Verification email sent to '+ user_id));
                                        });




                                    }

                                });
                            }else {
                                var message = 'Your verification code '+ queryId;
                              smsHandler.sendSMS(config.twilo.phonenumber,user_id,message,function (err,response) {
                                  if(err){
                                     done(err);
                                  }else {
                                      newTempUser.phone = user_id;
                                      newTempUser.save(function (err) {
                                          if (err)
                                              return done(err);

                                          return done(null, newTempUser,req.flash('signupMessage',
                                              'Verification code sent to '+ user_id));
                                      });
                                  }

                              });

                            }

                }
            });

        }

        });
        }  else {

            return done(null, req.user);
        }

    });

}

exports.localEmailSignUpVerification = function (req, cb){
if(req.query.email){
    tmpUser.findOne({'email': req.query.email}, function (err, reuser) {
        // if there are any errors, return the error
        if (err) {
            console.error("Error occured while validating user");
            cb(true,'Error occured while validating user');
        }

        // check to see if theres already a user with that email
        if (reuser) {
            if(req.query.id.toString() == reuser.q_id) {
                tmpUser.findOneAndRemove({'email': reuser.email}, function (err) {
                    if (err) {

                    } else {

                        var newUser = new user();
                        newUser.user_id = reuser.email;
                        newUser.local.email = reuser.email;
                        newUser.local.password = reuser.password;
                        newUser.local.username = reuser.username;
                        newUser.local.businessType = reuser.businessType
                        newUser.save(function (err) {
                            if (err) {
                                console.error("Error occured while validating the user and saving to database")
                                cb(true, '"Error occured while validating the user and saving to database"')
                            } else {
                                cb(false, 'Succesfully validated the user');

                            }
                        });
                    }

                });
            } else{
                cb(false, 'Query Id validation failed');
            }
        } else{

        }
    });
}else{
    console.error("Cannot find query id");
cb(true,"Cannot find query id");
}


}


exports.localPhoneSignUpVerification = function (req, cb){
    if(req.body.phonenumber){
        tmpUser.findOne({'phone': req.body.phonenumber}, function (err, reuser) {
            // if there are any errors, return the error
            if (err) {
                console.error("Error occured while validating user");
                cb(true,'Error occured while validating user');
            }

            // check to see if theres already a user with that email
            if (reuser) {
                if(req.body.verficationcode == reuser.q_id) {
                    tmpUser.findOneAndRemove({'phone': reuser.phone}, function (err) {
                        if (err) {

                        } else {

                            var newUser = new user();
                            newUser.user_id = reuser.phone;
                            newUser.local.phone = reuser.phone;
                            newUser.local.password = reuser.password;
                            newUser.local.username = reuser.username;
                            newUser.local.businessType = reuser.businessType;
                            newUser.save(function (err) {
                                if (err) {
                                    console.error("Error occured while validating the user and saving to database");
                                    cb(true, '"Error occured while validating the user and saving to database"');
                                } else {
                                    cb(false, 'Succesfully validated the user');

                                }
                            });
                        }

                    });
                } else{
                    cb(false, 'Query Id validation failed');
                }
            } else{

            }
        });
    }else{
        console.error("Cannot find query id");
      cb(true,"Cannot find query id");
    }


}


exports.fbSignUp =  function(req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {
        var user_id;
        // check if the user is already logged in
        if (!req.user) {

            var email = profile.emails[0].value;
            if(email){
                user_id = email.toLowerCase();
                user.findOne({'user_id':email}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user){
                        user.findOne({ 'facebook.id' : profile.id }, function(errfb, fbuser) {
                            if (errfb)
                                return done(err);
                            if (fbuser) {

                                return done(null, fbuser);
                            }else{
                                user.facebook.id    = profile.id;
                                user.facebook.token = token;
                                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = user_id;

                                user.findOneAndUpdate({'user_id':email},user,{upsert:true}, function (err, emailuser) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, emailuser);

                                });

                            }

                        });

                    } else{
                        var newUser            = new user();
                        newUser.user_id = user_id;
                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = user_id;

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });

                    }

                });
            } else{
                user_id = profile.id;
                user.findOne({'user_id':user_id}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user) {

                        if (user) {

                            return done(null, user);
                        } else {
                            var newUser = new user();
                            newUser.user_id = user_id;
                            newUser.facebook.id = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            newUser.facebook.email = undefined;

                            newUser.save(function (err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });


                        }
                    }
                });


            }}else{
            return done(null, req.user);
        }

    });

}


exports.googleSignUp = function(req, token, refreshToken, profile, done) {

    // asynchronous
    process.nextTick(function() {
        var user_id;
        // check if the user is already logged in
        if (!req.user) {

            var email = profile.emails[0].value;
            if(email){
                user_id = email.toLowerCase();
                user.findOne({'user_id':email}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user){
                        user.findOne({ 'google.id' : profile.id }, function(errfb, fbuser) {
                            if (errfb)
                                return done(err);

                            if (fbuser) {

                                return done(null, fbuser);
                            }else{
                                user.google.id    = profile.id;
                                user.google.token = token;
                                user.google.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.google.email = user_id;

                                user.findOneAndUpdate({'user_id':email},user,{upsert:true}, function (err, emailuser) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, emailuser);

                                });

                            }

                        });

                    } else{
                        var newUser            = new user();
                        newUser.user_id = user_id;
                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = user_id;

                        newUser.save(function(err) {
                            if (err)
                                return done(err);

                            return done(null, newUser);
                        });

                    }

                });
            } else{
                user_id = profile.id;
                user.findOne({'user_id':user_id}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user) {

                        if (user) {

                            return done(null, user);
                        } else {
                            var newUser = new user();
                            newUser.user_id = user_id;
                            newUser.google.id = profile.id;
                            newUser.google.token = token;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = undefined;

                            newUser.save(function (err) {
                                if (err)
                                    return done(err);

                                return done(null, newUser);
                            });


                        }
                    }
                });


            }}else{
            return done(null, req.user);
        }

    });

}



