const mongoose = require("mongoose");
const { genderTypes, userStatusTypes } = require("../enums/types");
const Schema = mongoose.Schema;
const Customer = mongoose.model(
  "Customer",
  new Schema({
    Name: {
      type: String,
      trim: true,
      index: true
    },
    email: {
      type: String,
    },
    phone: { type: String, required: true, unique: true },
    Password: { type: String },
    image: { type: String },
    gender: { type: String, enum: genderTypes },
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: userStatusTypes,
      },
    },
    address: [
      {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        pin: { type: String, default: "" },
        state: { type: String, default: "" },
        type: { type: String, default: "" },
        cood: {
          lattitude: { type: String, default: "" },
          longitude: { type: String, default: "" },
        },
      },
    ],
    refferdCode: { type: String, default: null },
    uniqueReferralCode: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: true },
  })
);

module.exports = Customer;
