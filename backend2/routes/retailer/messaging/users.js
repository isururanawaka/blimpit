var mongoAdapter = require('../dbadapters/mongoAdapter');
var config = require('../config/configLocal.js');
exports.addUsers = function (req, res) {
   mongoAdapter.insertDocument(config.mongodb.collections.users, {name:"name"}, config.mongodb.centralDB, function (error, id) {
        if (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.write(JSON.stringify({code: 900}));
            res.end();
            return;
        } else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            var result = JSON.stringify({result:"Success writing user data"});
            res.write(result);
            res.end();
        }
    })
};