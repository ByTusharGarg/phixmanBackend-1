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
    Sno: { type: String, default: "" },
    Name: { type: String, default: "" },
    bussinessName: { type: String, default: "" },
    Dob: { type: Date, default: null },
    codCollection: { type: Number, default: 0 },
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
      default: "",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    password: { type: String, default: "" },
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: partnerStatusTypes,
      },
    },
    helpers: [
      {
        name: String,
        email: String,
        avtar: String,
      },
    ],
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
      default: null,
    },
    address: {
      street: String,
      city: String,
      pin: String,
      state: String,
      country: String,
      landmark: String,
      billingAddress: String,
      address: String,
      cood: {
        lattitude: String,
        longitude: String,
      },
    },
    workingdays: [],
    business_hours: {
      start_hour: String,
      end_hour: String,
    },
    aadhar: {
      number: String,
      fileF: String,
      fileB: String,
    },
    experienceYears: {
      type: Number,
    },
    pan: {
      number: String,
      file: String,
    },
    gstCertificate: {
      type: String,
      default: null,
    },
    gstCertificateNo: {
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
