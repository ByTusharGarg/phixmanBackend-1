const mongoose = require("mongoose");
const { adminTypeArray, adminTypeObject } = require("../enums/adminTypes");
const Schema = mongoose.Schema;
const Admin = mongoose.model(
  "Admin",
  new Schema({
    Sno: Number,
    Name: { type: String, default: "" },
    designation: { type: String, default: "" },
    empId: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: {
      type: String,
      unique: true,
    },
    type: {
      type: String,
      default: adminTypeObject.SUPERADMIN,
      enum: adminTypeArray,
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
    zones: [{ type: Schema.Types.ObjectId, ref: "Zone" }],
    category: [{ type: Schema.Types.ObjectId, ref: "category" }]
  })
);
module.exports = Admin;
