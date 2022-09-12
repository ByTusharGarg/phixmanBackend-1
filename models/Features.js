const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Feature = mongoose.model(
  "Feature",
  new Schema({
    Name: { type: String },
    isDisplayed: { type: Boolean, default: true },
  })
);

module.exports = Feature;
