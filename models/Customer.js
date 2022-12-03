const mongoose = require("mongoose");
const { genderTypes, userStatusTypes } = require("../enums/types");
const Schema = mongoose.Schema;
const Customer = mongoose.model(
  "Customer",
  new Schema({
    Sno: { type: String, default: "" },
    Name: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    email: { type: String, default: "" },
    phone: { type: String, required: true, unique: true,sparse: true },
    Password: { type: String, default: "" },
    image: { type: String, default: "" },
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
        state: { type: String, default: "" },
        country: { type: String, default: "India" },
        pin: { type: String, default: "" },
        type: { type: String, default: "other" },
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
    isExistingUser: {
      type: Boolean,
      default: false,
    },
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: true },
  })
);

module.exports = Customer;
