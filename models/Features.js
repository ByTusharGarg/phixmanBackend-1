const mongoose = require("mongoose");

const Feature = mongoose.model(
  "Feature",
  new Schema({
    Name: { type: String },
  })
);

module.exports = Feature;
