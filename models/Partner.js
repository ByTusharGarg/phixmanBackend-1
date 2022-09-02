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
    Sno: String,
    Name: String,
    Dob: Date,
    Type: {
      type: String,
      enum: partnerTypes,
    },
    Product_Service: [
      {
        type: Schema.Types.ObjectId,
        ref: "category",
      },
    ],
    isParent: { type: Schema.Types.ObjectId, ref: "Partner", default: null },
    phone: { type: String, required: true, unique: true },
    secondaryNumber: { type: String, default: null },
    email: {
      type: String,
    },
    refreshToken: {
      type: String,
      default: null,
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
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    profilePic: { type: String, default: "" },
    refferdCode: { type: String, default: null },
    uniqueReferralCode: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    fcmToken: {
      type: String,
      default: null
    },
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
      fileF: String,
      fileB: String,
    },

    pan: {
      number: String,
      file: String,
    },
    gstCertificate: {
      type: String,
      default: null,
    },
    incorprationCertificate: {
      type: String,
      default: null,
    },
    expCertificate: {
      type: String,
      default: null,
    },
  })
);

module.exports = Partner;
