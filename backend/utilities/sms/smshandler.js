var Nexmo = require('nexmo');

var twilo = require('twilio');
var config = require('../../config/config');


var twiloClient = twilo(config.twilo.accountsid, config.twilo.authtoken);
//
// var nexmo = new Nexmo({
//     apiKey: config.nexmo.apikey,
//     apiSecret: config.nexmo.apisecret,
// }, {debug: true});


exports.sendSMS = function (fromnumber, tonumber, msg, cb) {
    // nexmo.message.sendSms(
    //     fromnumber, tonumber, message, {type: 'unicode'},
    //     function (err, response) {
    //         if (err) {
    //             console.log("Error in sending SMS to " + tonumber);
    //             cb(true, response);
    //         } else {
    //             console.log("Successfully send SMS to " + tonumber);
    //             cb(false, response);
    //         }
    //     });


    twiloClient.messages
        .create({
            body: msg,
            from: fromnumber,
            to: tonumber
        })
        .then(cb(false,'Verification code sent to '+tonumber)).
done();




}