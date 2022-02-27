function generateOtp(length) {
  const digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

function sendOtp(phone, otp) {
  console.log(phone, otp);
}

module.exports = {
  generateOtp,
  sendOtp,
};
