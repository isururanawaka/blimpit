var User       = require('../../../model/signinandsignup/user');


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
