var User       = require('../../../model/user');


exports.localSignUp = function(req, email, password, done) {
    if (email)
        email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function() {
        // if the user is not already logged in:
        if (!req.user) {
            User.findOne({'user_id': email}, function (err, user) {
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
                    var newUser = new User();
                    newUser.user_id = email;
                    newUser.local.email = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.username = req.body.username;
                    newUser.local.businessType = req.body.BType;
                    newUser.save(function (err) {
                        if (err)
                            return done(err);

                        return done(null, newUser);
                    });
                }
            });
        }

    else {

            return done(null, req.user);
        }

    });

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
                User.findOne({'user_id':email}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user){
                        User.findOne({ 'facebook.id' : profile.id }, function(errfb, fbuser) {
                            if (errfb)
                                return done(err
                            if (fbuser) {

                                return done(null, fbuser);
                            }else{
                                user.facebook.id    = profile.id;
                                user.facebook.token = token;
                                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = user_id;

                                User.findOneAndUpdate({'user_id':email},user,{upsert:true}, function (err, emailuser) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, emailuser);

                                });

                            }

                        });

                    } else{
                        var newUser            = new User();
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
                User.findOne({'user_id':user_id}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user) {

                        if (user) {

                            return done(null, user);
                        } else {
                            var newUser = new User();
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
                User.findOne({'user_id':email}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user){
                        User.findOne({ 'facebook.id' : profile.id }, function(errfb, fbuser) {
                            if (errfb)
                                return done(err);

                            if (fbuser) {

                                return done(null, fbuser);
                            }else{
                                user.facebook.id    = profile.id;
                                user.facebook.token = token;
                                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                                user.facebook.email = user_id;

                                User.findOneAndUpdate({'user_id':email},user,{upsert:true}, function (err, emailuser) {
                                    if (err) {
                                        return done(err);
                                    }
                                    return done(null, emailuser);

                                });

                            }

                        });

                    } else{
                        var newUser            = new User();
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
                User.findOne({'user_id':user_id}, function (err, user) {
                    if (err) {
                        return done(err);
                    }

                    if(user) {

                        if (user) {

                            return done(null, user);
                        } else {
                            var newUser = new User();
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