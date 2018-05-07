var config = {};
config.mongodb = {};
config.blimpit ={};
config.business={};
config.user = {};

config.email ={};

config.nexmo={};

config.nexmo.apikey ='';
config.nexmo.apisecret='';

config.twilo={};

config.twilo.accountsid ='AC7f77c0911ca551959d595209be6ae368';
config.twilo.authtoken='153af6f3cc43f0e0a3959c94380295c5';

config.twilo.phonenumber = '+18449202942';

config.user.verficationlink = 'http://localhost:8080/verify'
config.user.verificationsubject = 'Welcome to BlimpIt',

config.user.passwordresetemail = 'http://localhost:8080/ispassresettingallowed'

config.user.passwordresetsubject = 'Reset Your Password',

config.user.emailType = "email";
config.user.phoneType ='phonenumber';


config.email.user = "admin@blimpit.com";
config.email.pass = "admin@2304";

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


