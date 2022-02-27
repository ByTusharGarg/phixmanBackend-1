const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Customer = mongoose.model(
  "Customer",
  new Schema({
    Name: String,
    email: {
      type: String,
      unique: true,
    },
    phone: { type: String, required: true },
    Password: { type: String },
    image: { type: String },
    gender: { type: String, enum: ["male", "female", "non-binary"] },
    otp: {
      code: {
        type: String,
      },
      status: {
        type: String,
        enum: ["active", "inactive"],
      },
    },
    street: String,
    city: String,
    pin: String,
    state: String,
    isActive: { type: Boolean, required: true, default: true },
    isVerified: { type: Boolean, required: true, default: false },
    isPublished: { type: Boolean, required: true, default: true },
  })
);

module.exports = Customer;
