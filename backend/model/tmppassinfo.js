// temp user is saved temporarliy untill user clicks the email verification link or expires
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our temp user model
var userSchema = mongoose.Schema({
    user_id: String,
    q_id:String
},{timestamps: true});

userSchema.index({createdAt: 1},{expireAfterSeconds: 86400});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for temp users and expose it to our app
module.exports = mongoose.model('temppassinfo', userSchema);
