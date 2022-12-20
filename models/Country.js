const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    Code: { type: String, default: "" },
    Name: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Country = mongoose.model("Country", schema);

module.exports = Country;
