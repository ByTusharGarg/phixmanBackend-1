const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const Vendor = mongoose.model(
  "Vendor",
  new Schema({
    Sno: { type: String, default: "" },
    name: { type: String },
    email: { required: true, type: String },
  })
)
module.exports = Vendor;
