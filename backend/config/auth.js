// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '2048380005191764', // your App ID
        'clientSecret'    : 'b42729e780ddf38bc3c9f1a7f8fbdb1d', // your App Secret
        'callbackURL'     : 'https://localhost:8443/auth/facebook/callback',
        'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields'   : ['id', 'email', 'name'] // For requesting permissions from Facebook API

    },

    'twitterAuth' : {
        'consumerKey'        : 'your-consumer-key-here',
        'consumerSecret'     : 'your-client-secret-here',
        'callbackURL'        : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'         : '727662231451-7v5d70v99febdh9t22svifpdt9595upi.apps.googleusercontent.com',
        'clientSecret'     : '6gRW7Qc0-ENxFQG_rHQlFmdL',
        'callbackURL'      : 'http://localhost:8080/auth/google/callback'
    }

};
