const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product_Service = mongoose.model(
  "Product_Service",
  new Schema({
    Product: { type: Schema.Types.ObjectId, required: true, ref: "Product" },
    Name: { type: String, required: true },
    Cost: { type: Number, required: true },
  })
);

module.exports = Product_Service;
