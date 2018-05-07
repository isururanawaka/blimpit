var User       = require('../../model/signinandsignup/user');
var tmpinfo       = require('../../model/signinandsignup/tmppassinfo');
var utils      = require('../../utilities/query/utils');

var config = require('../../config/config');

var emailHandler = require('../../utilities/email/emailhandler');

var smsHandler = require('../../utilities/sms/smshandler');
exports.localSignIn = function(req, user_id, password, done) {
    if (user_id)
        user_id = user_id.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function() {
        User.findOne({ 'user_id' :  user_id }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.'));

            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

            // all is well, return user
            else
                return done(null, user);
        });
    });

}

exports.sendPasswordResettingInfo = function(req, cb) {

    var user_id = req.body.userId;
    if (user_id)
        user_id = user_id.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function() {
        // if the user is not already logged in:


        User.findOne({'user_id': user_id}, function (err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return cb(err);

                        // check to see if theres already a user with that email
                        if (user) {

                            tmpinfo.findOne({'user_id': user_id}, function (err, tmpuser) {
                                // if there are any errors, return the error
                                if (err)
                                    return cb(err);

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

                                    var queryId = utils.getRandomQueryId();

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
                                                return cb(true,
                                                    'Cannot send resetting email to ' + user_id + ' Please provide a valid email address');

                                            } else {

                                                newTempInfo.save(function (err) {
                                                    if (err)
                                                        return cb(err);

                                                    return cb(false,true,false, 'Resetting email sent to ' + user_id);
                                                });


                                            }

                                        });

                                    }else if(user.local.phone && tmpuser){

                                        tmpinfo.findOneAndRemove({'user_id': user_id}, function (err, response) {
                                            var message = 'Your verification code '+ queryId;
                                            smsHandler.sendSMS(config.twilo.phonenumber,user.local.phone,message,function (err,response) {
                                                if(err){
                                                    cb(err);
                                                }else {
                                                    newTempInfo.save(function (err) {
                                                        if (err)
                                                            return cb(err);

                                                        return cb(false,false,true, 'verification code sent to ' + user_id);
                                                    });

                                                }

                                            });
                                        });
                                    } else if (user.local.phone && !tmpuser){
                                        var message = 'Your verification code '+ queryId;
                                        smsHandler.sendSMS(config.twilo.phonenumber,user.local.phone,message,function (err,response) {
                                            if(err){
                                                cb(err);
                                            }else {
                                                newTempInfo.save(function (err) {
                                                    if (err)
                                                        return cb(err);

                                                    return cb(false,false,true, 'verification code sent to ' + user_id);
                                                });

                                            }

                                        });
                                    }
                                }
                            });


                        } else{
                            return cb(null, 'Cannot find a registered user under the email '+ email);
                        }
                    });

                });
}

exports.allowAccessToUpdatePassword = function (req,cb){
    var user_id,query_id;
    if(req.query.email){
    user_id = req.query.email;
    query_id = req.query.id;
    }else if(req.body.phonenumber){
        user_id = req.body.phonenumber;
        query_id = req.body.code;
    }else{
        console.error("Cannot find user_id")
        cb(false,false,'send 404');
    }

    tmpinfo.findOne({'user_id': user_id}, function (err, reuser) {
        // if there are any errors, return the error
        if (err) {
            console.error("Error occured while validating user");
            cb(true,false,'Error occured while validating user');
        }

        // check to see if there is already a user with that email
        if (reuser) {
            if(query_id.toString() == reuser.q_id) {
                cb(false,true,'redirect');
            } else{
                cb(false, false,'Query Id validation failed');
            }
        } else{
            cb(false,false,'send 404');
        }
    });
}

exports.updatePassword = function (req,cb){
    var user_id =  req.body.userId;
    var password = req.body.password;
    User.findOne({'user_id':user_id}, function (err, user) {
        if (err) {
            return cb(true);
        }

        if(user) {
                user.local.password = user.generateHash(password);

                User.findOneAndUpdate({'user_id': user_id}, user, {upsert: true}, function (err, emailuser) {
                    if (err) {
                        return cb(true);
                    } else {
                        tmpinfo.findOneAndRemove({'user_id': user_id}, function (err, user) {
                            if (err) {
                                return cb(true);
                            }

                            if (user) {
                                return cb(false);
                            }
                        });
                    }

                });

        }
    });

}