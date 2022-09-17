const mongoose = require("mongoose");
const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    Sno: Number,
    Name: { type: String, default: "" },
    email: {
      type: String,
      unique: true,
    },
    password: { type: String, default: "" },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: true,
    },
  })
);
module.exports = Admin;
