
var privateUserSignUp = require('../routes/access/privateuser/signup');
var commons = require('./access/commons');


exports.registerRoutes = function (app, passport, cb) {

    app.get('/', function (req,res) {
        res.render('index.ejs')
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });


    // process the login form
    app.post('/login', function (req, res, next) {
        passport.authenticate('local-login', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.redirect('/login'); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/profile');
            });
        })(req, res, next);
    });




    // SIGNUP =================================
    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', function (req, res, next) {
        passport.authenticate('local-signup', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.redirect('/signup'); }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return res.redirect('/profile');
            });
        })(req, res, next);
    }
    );


    //process email verification for local users
    app.get('/verify', function(req, res) {
       privateUserSignUp.localEmailSignUpVerification(req,function (err, msg) {
           if(err){
               res.writeHead(500, {'Content-Type': 'application/json'});
               res.write(JSON.stringify({error:  msg}));
               res.end();
               return;
           }else{
               // res.writeHead(200, {'Content-Type': 'application/json'});
               // res.write(JSON.stringify({msg:  msg}));
               // res.end();
               // return;
               res.render('login.ejs', { message: req.flash('Successfully validated the user please login') });
           }

       });
    });


    app.get('/resendpass', function(req, res) {
        res.render('resendpassword.ejs', { message: req.flash('resendpassword') });
    });

    app.post('/resendpass', function(req, res) {

   commons.sendPasswordResettingInfo(req,function (err,viaemail,viaphone, msg) {
       if(err){
           console.log("Error in sending password resetting link")

       }else if(viaemail){

           res.render('login.ejs', { message: req.flash(msg) });
       }else if(viaphone){
           res.render('resetpasswordviaphone.ejs', { message: req.flash('Successfully validated the user') });
       }
   })
    });

    app.post('/ispassresettingallowed', function(req, res) {
        commons.allowAccessToUpdatePassword(req,function (err,redirect,msg) {
            if(err){
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({error:  msg}));
                res.end();
                return;
            }else if(redirect){
                // res.writeHead(200, {'Content-Type': 'application/json'});
                // res.write(JSON.stringify({msg:  msg}));
                // res.end();
                // return;
                res.render('resetpassword.ejs', { message: req.flash('Successfully validated the user') });
            } else{

            }

        });
    });


    app.post('/resetpass', function(req, res) {
        commons.updatePassword(req,function (err) {
            if(err){
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({error:  msg}));
                res.end();
                return;
            }else {
                // res.writeHead(200, {'Content-Type': 'application/json'});
                // res.write(JSON.stringify({msg:  msg}));
                // res.end();
                // return;
                res.render('login.ejs', { message: req.flash('Successfully updated the password') });
            }

        });
    });


    app.get('/insertphoneverifycode', function(req, res) {
        res.render('phoneverification.ejs', { message: req.flash('verfiy code') });
    });

    app.post('/insertphoneverifycode', function(req, res) {
        privateUserSignUp.localPhoneSignUpVerification(req,function (err) {
            if(err){
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({error:  msg}));
                res.end();
                return;
            }else {
                // res.writeHead(200, {'Content-Type': 'application/json'});
                // res.write(JSON.stringify({msg:  msg}));
                // res.end();
                // return;
                res.render('login.ejs', { message: req.flash('Successfully validated the user') });
            }

        });
    });


    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['public_profile', 'email'] }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        function (req, res, next) {
            passport.authenticate('facebook', function (err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.redirect('/login');
                }
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect('/profile');
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
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        function (req, res, next) {
            passport.authenticate('google', function (err, user, info) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.redirect('/signup');
                }
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect('/profile');
                });
            })(req, res, next)
        }

    );

    cb();
}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}