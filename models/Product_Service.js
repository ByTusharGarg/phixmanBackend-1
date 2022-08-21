const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product_Service = mongoose.model(
  "Product_Service",
  new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: "category" },
    modelId: { type: Schema.Types.ObjectId, ref: "Model" },
    serviceName: String,
    cost: Number,
    isTrivial: { type: Boolean, default: true },
  })
);

module.exports = Product_Service;
