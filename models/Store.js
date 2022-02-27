const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Store = mongoose.model(
  "Store",
  new Schema({
    Sno: Number,
    Name: String,
    email: {
      type: String,
      unique: true,
    },
    phone: { type: String, required: true, unique: true },
    password: String,
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
      },
    },
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: false },
  })
);
module.exports = Store;
