// load the things we need
//user model for signUP
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    user_id           :String,
    categories        :[{
        id            :String,
        subcategories :[{
            id: String
        }]}]
});



// create the model for users and expose it to our app
module.exports = mongoose.model('Retailer', userSchema);
