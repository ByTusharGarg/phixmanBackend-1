const mongoose = require("mongoose");
const productTypeSchema = new mongoose.Schema({
  video: String,
  icon: String,
  name: String,
  key: String,
  servedAt: String,
});

const ProductType = mongoose.model("ProductType", productTypeSchema);

module.exports = ProductType;
