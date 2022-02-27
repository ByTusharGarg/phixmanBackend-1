const mongoose = require("mongoose");
const Admin = mongoose.model(
  "Admins",
  new mongoose.Schema({
    Sno: Number,
    Name: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
  })
);
module.exports = Admin;
