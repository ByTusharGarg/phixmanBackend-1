const mongoose = require("mongoose");
const {
  claimT
} = require("../enums/claimTypes");

const Schema = mongoose.Schema;

const Vendor = mongoose.model(
  "Vendor",
  new Schema({
    Sno: { type: String, default: "" },
    name: { type: String },
    email: { required: true, type: String },
    password: { type: String, default: "" },
    category: [{ type: Schema.Types.ObjectId, ref: "category" }],
    employeeId: String,
    employer: { type: Schema.Types.ObjectId, ref: "Vendor", default: null },
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
      },
    },
    pincode:[{
      type: String,
    }],
    claim: [{
      type: String,
      enum: claimT,
    }],
    companyGSTNumber:{ type: String },
    address: {
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
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
  })
);
module.exports = Vendor;
