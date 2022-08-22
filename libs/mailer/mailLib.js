const nodemailer = require("nodemailer");
const ejs = require('ejs');

let elasticEmail = {
  host: "smtp.elasticemail.com",
  port: 2525,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL || "info@phixman.com", // generated ethereal user
    pass: process.env.PASSWORD || "3E5E2325B3DAB5799055D5169C01E1B85479", // generated ethereal password
  },
};

const transporter = nodemailer.createTransport(elasticEmail);


const sendMail = async (from, to, subject, template, data, event) => {
  let mail = {
    from: from, // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: template,
  };
  try {
    let info = await transporter.sendMail(mail);
    return true;
  } catch (error) {
    console.log('Error:' + error);
  }
};


const commonMailFunctionToAll = (dataToCompile, template) => {
  // if (!dataToCompile.url) {
  //   let mailURL = process.env.NODE_ENV === 'development' ? process.env.MAIL_URL_DEV : process.env.MAIL_URL_PROD;
  //   dataToCompile['url'] = mailURL;
  // }
  try {
    let filePath = path.resolve(__dirname + `/template/${template}.ejs`),
      compiled = ejs.compile(fs.readFileSync(filePath, 'utf8')),
      Subject = dataToCompile.subject;
    return sendMail("support@phixman.in", dataToCompile.email, Subject, compiled(dataToCompile));
  } catch (e) {
    // logger.error(e);
    console.log(e);
  }
};

module.exports = sendMail;
module.exports.commonMailFunctionToAll = commonMailFunctionToAll;
