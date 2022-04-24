const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: "thephixman@gmail.com",
    pass: "69sQL1HDqdMhcfVX",
  },
});

async function run() {
  let result = await transport.sendMail({
    from: "thephixman@gmail.com",
    to: "toshug61@gmail.com",
    subject: "test",
    text: "test",
  });

  console.log(result);
}

run().catch((err) => console.log(err));

// const SibApiV3Sdk = require('sib-api-v3-sdk');
// let defaultClient = SibApiV3Sdk.ApiClient.instance;

// let apiKey = defaultClient.authentications['api-key'];
// apiKey.apiKey = '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';

// let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

// sendSmtpEmail.subject = "My {{params.subject}}";
// sendSmtpEmail.htmlContent = "<html><body><h1>This is my first transactional email {{params.parameter}}</h1></body></html>";
// sendSmtpEmail.sender = {"name":"John Doe","email":"example@example.com"};
// sendSmtpEmail.to = [{"email":"toshug61@gmail.com","name":"Jane Doe"}];
// sendSmtpEmail.cc = [{"email":"example2@example2.com","name":"Janice Doe"}];
// sendSmtpEmail.bcc = [{"email":"John Doe","name":"example@example.com"}];
// sendSmtpEmail.replyTo = {"email":"replyto@domain.com","name":"John Doe"};
// sendSmtpEmail.headers = {"Some-Custom-Name":"unique-id-1234"};
// sendSmtpEmail.params = {"parameter":"My param value","subject":"New Subject"};

// apiInstance.sendTransacEmail(sendSmtpEmail).then(function(data) {
//   console.log('API called successfully. Returned data: ' + JSON.stringify(data));
// }, function(error) {
//   console.error(error);
//   console.log("eeeeeeeeeeeeeeeeeeee")
// });
