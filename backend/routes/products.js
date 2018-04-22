var mongoAdapter = require('../dbadapters/mongoAdapter');
var config = require('../config/configLocal.js');
exports.addProducts = function (req, res) {
    var product = req.body.product;
    if (product) {
        mongoAdapter.insertDocument(config.mongodb.collections.products, product, config.mongodb.centralDB, function (error, id) {
            if (error) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({code: 900}));
                res.end();
                return;
            } else {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                var result = JSON.stringify({result: "Success writing product data"});
                res.write(result);
                res.end();
            }
        })
    } else {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({error: "Product not found"}));
        res.end();
        return;
    }
};

exports.getProducts = function (req, res) {
    var type = req.query.type;
    if (type && type === 'all') {
        mongoAdapter.getDocuments({}, config.mongodb.collections.products, config.mongodb.centralDB, function (products, error) {
            if (error) {
                res.writeHead(500, {'Content-Type': 'application/json'});
                res.write(JSON.stringify({code: 900}));
                res.end();
                return;
            } else {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                var result = JSON.stringify({result:products});
                res.write(result);
                res.end();
            }
        })
    } else {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.write(JSON.stringify({error: "Wrong product request"}));
        res.end();
        return;
    }
};