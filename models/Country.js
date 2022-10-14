const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
  Code: { type: String, default: "" },
  Name: { type: String },
});

const Country = mongoose.model("Country", schema);

module.exports = Country;
