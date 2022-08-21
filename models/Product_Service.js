const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product_Service = mongoose.model(
  "Product_Service",
  new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: "category" },
    modelId: { type: String, required: true, unique: true, ref: "Model" },
    services: [
      {
        serviceName: String,
        cost: Number,
        serviceId: { type: String, unique: true },
        isTrivial: Boolean,
      },
    ],
  })
);

module.exports = Product_Service;
