var nodemailer = require("nodemailer");
var config = require("../../config/config");

//TODO : update to OAuth2
var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});


exports.sendMail = function (email,subject,text,cb) {
    mailOptions={
        from:config.email.user,
        to :email ,
        subject : subject,
        html : text,
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.error(error);
           cb(error)
        }else{
            console.debug("Message sent: " + response.message);
            cb(false)
        }
    });
}



