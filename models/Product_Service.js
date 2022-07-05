const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product_Service = mongoose.model(
  "Product_Service",
  new Schema({
    modelId: { type: String, required: true },
    modelName: { type: String, required: true },
    services:[]
  })
);

module.exports = Product_Service;
