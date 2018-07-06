var redis = require('redis');
var config = require('../config/config');
var client = redis.createClient();
var boom = require('boom');

client.on('error', function (err) {
    console.log('Something went wrong ' + err);
});
client.on('connect', function () {
    logger.info("Successfully connected to redis server in memory store");

});


exports.saveValue = function (key, value) {
    client.set(key, value);
    client.expire(key, config.jwt.refreshtokeneptime);

}

exports.readValue = function (key, done) {
    client.get(key, function (err, reply) {
        if (err) {
            return done(boom.internal("Cannot find token"));
        }
        return done(null, reply);
    });
}

exports.deleteValue = function (key, done) {
    client.del(key, function (err, reply) {
        if (err) {
            return done(boom.internal("Error occurred while deleting the value"));
        }
        return done(null, reply);
    });
}
