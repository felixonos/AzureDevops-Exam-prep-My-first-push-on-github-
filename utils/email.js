const nodemailer = require("nodemailer");

const sendMail = async options => {
    // create a tranporter 
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
        // activate in gmail 'less secure app' optional
    });

    // send mail with defined transport object
    // send the email
    let info = await transporter.sendMail({
        from: 'Okwudili David <hello@example.com>', // sender address
        to: options.email, // list of receivers
        subject: options.subject, // Subject line
        text: options.message // plain text body
        // html: "<b>Hello world?</b>" // html body
    });
}

module.exports = sendMail;