const mongoose = require("mongoose");
const { storeStatusTypes } = require("../enums/types");
const Schema = mongoose.Schema;
const Store = mongoose.model(
  "Store",
  new Schema({
    Sno: Number,
    Name: String,
    email: {
      type: String,
      // unique: true,
    },
    phone: { type: String, required: true, unique: true },
    password: String,
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: storeStatusTypes,
      },
    },
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: false },
  })
);
module.exports = Store;
