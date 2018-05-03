var config = {};
config.mongodb = {};
config.mongodb.collections = {};

config.mongodb.host = 'localhost:27017';
config.mongodb.username = '';
config.mongodb.pwd = '';

config.mongodb.connectionString="mongodb://"+config.mongodb.host;

config.mongodb.centralDB = "blimpIt";
config.mongodb.collections.users = "category";
config.mongodb.collections.products = "categories";
module.exports = config;
