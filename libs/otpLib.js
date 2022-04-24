const http = require("https");

function generateOtp(length) {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

function sendOtp(phone, otp) {

  // auth key(phixman) = 269742AhRZnGKBTMsC606d9a73P1 
  

  console.log(phone, otp);
  const options = {
    method: "GET",
    hostname: "api.msg91.com",
    port: null,
    path: `/api/v5/otp?template_id=&mobile=${phone}&authkey=`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, function (res) {
    const chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      const body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });
  req.end();
}

module.exports = {
  generateOtp,
  sendOtp,
};
