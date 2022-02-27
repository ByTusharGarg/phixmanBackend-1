const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Partner = mongoose.model(
  "Partner",
  new Schema({
    Sno: Number,
    Name: String,
    Product_Service: {
      type: Schema.Types.ObjectId,
      ref: "Product_Service",
    },
    Store: { type: Schema.Types.ObjectId, ref: "Store" },
    phone: { type: String, required: true },
    email: {
      type: String,
      unique: true,
    },
    password: { type: String },
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
      },
    },
    helpers: [String],
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: false },
  })
);

module.exports = Partner;
