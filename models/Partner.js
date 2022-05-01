const mongoose = require("mongoose");
const {
  partnerTypes,
  partnerStatusTypes,
  genderTypes,
} = require("../enums/types");
const Schema = mongoose.Schema;
const Partner = mongoose.model(
  "Partner",
  new Schema({
    Sno: Number,
    Name: String,
    Dob: String,
    Type: {
      type: String,
      enum: partnerTypes,
    },
    Product_Service: {
      type: Schema.Types.ObjectId,
      ref: "Product_Service",
    },
    Store: { type: Schema.Types.ObjectId, ref: "Partner" },
    phone: { type: String, required: true, unique: true },
    email: {
      type: String,
    },
    password: { type: String },
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: partnerStatusTypes,
      },
    },
    helpers: [String],
    gender: { type: String, enum: genderTypes },
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: false },
    address: {
      street: String,
      city: String,
      pin: String,
      state: String,
      country: String,
      cood: {
        lattitude: String,
        longitude: String,
      },
    },
    aadhar: {
      number: String,
      file: String,
    },
    pan: {
      number: String,
      file: String,
    },
  })
);

module.exports = Partner;
