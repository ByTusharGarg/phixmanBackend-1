const mongoose = require("mongoose");
const { genderTypes, userStatusTypes } = require("../enums/types");
const Schema = mongoose.Schema;
const Customer = mongoose.model(
  "Customer",
  new Schema({
    Name: String,
    email: {
      type: String
    },
    phone: { type: String, required: true,unique: true},
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
        street: String,
        city: String,
        pin: String,
        state: String,
        cood: {
          lattitude: String,
          longitude: String,
        },
      },
    ],
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: true },
  })
);

module.exports = Customer;
