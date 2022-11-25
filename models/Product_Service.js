const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product_Service = mongoose.model(
  "Product_Service",
  new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: "category" },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: "SubCategory",
      default: null,
    },
    modelId: { type: Schema.Types.ObjectId, ref: "Model" },
    serviceName: String,
    cost: Number,
    isTrivial: { type: Boolean, default: true },
    ispublish: { type: Boolean, default: true },
    zoneId: { type: Schema.Types.ObjectId, ref: "Zone" },
  })
);

module.exports = Product_Service;
