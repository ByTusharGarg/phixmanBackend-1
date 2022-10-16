const http = require("https");
const axios = require("axios").default;

function generateOtp(length) {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return 123456;
}

async function sendOtp(phone, otp) {
  try {
    const apiKey = process.env.TWOFACTOR_API_KEY;
    let balance = await axios.get(`http://2factor.in/API/V1/${apiKey}/BAL/SMS`);
    let response = await axios.get(
      `http://2factor.in/API/V1/${apiKey}/SMS/${phone}/${otp}/LOGIN%20OTP`
    );
    if (response?.data.Status !== "Success") {
      console.log(phone, otp);
      // throw new Error("Error encountered while sending otp");
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  generateOtp,
  sendOtp,
};
