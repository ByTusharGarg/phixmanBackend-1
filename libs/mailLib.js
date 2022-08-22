const nodemailer = require("nodemailer");

let elasticEmail = {
  host: "smtp.elasticemail.com",
  port: 2525,
  secure: false,
  auth: {
    user: "info@phixman.com",
    pass: "3E5E2325B3DAB5799055D5169C01E1B85479",
  },
};

const transport = nodemailer.createTransport(elasticEmail);

async function sendMail(to, sub, html, attachments) {
  transport.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });
  let result = await transport.sendMail({
    from: "support@phixman.in",
    to,
    subject: sub,
    // text: "test",
    html,
    attachments,
  });

  return result;
}

module.exports = sendMail;
