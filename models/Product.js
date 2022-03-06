const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productSchema = new Schema({
  Brand: { type: Schema.Types.ObjectId, ref: "Brand" },
  Name: { type: String, required: true },
  Type: { type: Schema.Types.ObjectId, ref: "ProductType", required: true },
});
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
