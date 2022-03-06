const { hashpassword } = require("../libs/passwordLib");

module.exports = {
  model: "Admin",
  documents: [
    {
      email: "devops@phixman.in",
      password: hashpassword("admin123"),
      isActive: true,
      isVerified: true,
      isPublished: true,
    },
  ],
};
