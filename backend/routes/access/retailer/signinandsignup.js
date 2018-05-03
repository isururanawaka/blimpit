var User       = require('../../../model/user');


exports.localSignUp = function(req, email, password, done) {
    if (email)
        email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

    // asynchronous
    process.nextTick(function() {
        // if the user is not already logged in:
        if (!req.user) {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {
                    // create the user
                    var newUser            = new User();
                    newUser.local.email    = email;
                    newUser.local.password = newUser.generateHash(password);
                    newUser.local.username = req.body.username;
                    newUser.local.businessType = req.body.BType;
                    newUser.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, newUser);
                    });
                }

            });
            // if the user is logged in but has no local account...
        } else if ( !req.user.local.email ) {
            // ...presumably they're trying to connect a local account
            // BUT let's check if the email used to connect a local account is being used by another user
            User.findOne({ 'local.email' :  email }, function(err, user) {
                if (err)
                    return done(err);

                if (user) {
                    return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                    // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                } else {
                    var user = req.user;
                    user.local.email = email;
                    user.local.password = user.generateHash(password);
                    user.save(function (err) {
                        if (err)
                            return done(err);

                        return done(null,user);
                    });
                }
            });
        } else {
            // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
            return done(null, req.user);
        }

    });

}
