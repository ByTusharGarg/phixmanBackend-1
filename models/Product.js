const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product = mongoose.model("Product",new Schema({
  Brand: { type: Schema.Types.ObjectId, ref: "Brand" },
  Name: { type: String, required: true },
  Type: { type: String, required: true },
}));

module.exports = Product