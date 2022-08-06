const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Feature = mongoose.model(
  "Feature",
  new Schema({
    Name: { type: String },
  })
);

module.exports = Feature;
