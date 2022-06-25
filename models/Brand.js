const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Brand = mongoose.model(
  "Brand",
  new Schema({ Name: { type: String, required: true } })
);
module.exports = Brand;
