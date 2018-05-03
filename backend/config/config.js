var config = {};
config.mongodb = {};
config.blimpit ={};
config.business={};

config.business.private = 'private';
config.business.retailer = 'retailer';
config.mongodb.collections = {};

config.mongodb.host = 'localhost';
config.mongodb.port = '27017';
config.mongodb.username = '';
config.mongodb.pwd = '';
config.blimpit.httpport = '8080';
config.blimpit.httpsport = '8443';

config.mongodb.centralDB = 'blimpIt';

config.mongodb.connectionString="mongodb://"+config.mongodb.host+":"+config.mongodb.port;

config.mongodb.centralDBString = 'mongodb://localhost/blimpIt';

config.mongodb.collections.users = "category";
config.mongodb.collections.products = "categories";

config.mongodb.maxRetries =6;
config.mongodb.connectionTimeout = 5000;
module.exports = config;


