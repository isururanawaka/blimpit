var jwt = require('jsonwebtoken');
var redis = require('../../dbconnector/redisconnector');
var httpStatus = require('http-status-codes');
var config = require('../../config/config');
var utils =  require('../query/utils');

exports.getTokens = function (res, userId, oldtoken, renew) {
    try {
        var token = jwt.sign({
            data: userId
        }, config.jwt.jwtsecret, {expiresIn: config.jwt.jwtexpiration});
        var refreshToken = jwt.sign({
            data: utils.getRandomId(),
        }, config.jwt.jwtsecret, {expiresIn: config.jwt.refreshtokeneptime});
        var key = userId + token;
        redis.saveValue(key, refreshToken);
        if (oldtoken) {
            var oldkey = userId + oldtoken;
            redis.deleteValue(oldkey, function (err, value) {
                if (err) {
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json("Unable perform the operation");
                }
            })
        }
        var payload = {state: "success", token: token};
        res.cookie(config.jwt.token, token);
        if(!renew) {
            res.cookie(config.jwt.refreshToken, refreshToken);
            var payload = {state: "success", token: token, refreshToken: refreshToken};
        }
        return res.json(payload);
    } catch (exception) {
        return res.status(httpStatus.UNAUTHORIZED).json("Unable to obtain tokens");
    }
}