const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Product_Service = mongoose.model(
    "Model",
    new Schema({
        brandId: { type: Schema.Types.ObjectId, required: true, ref: "Brand" },
        modelName: { type: String, required: true }
    })
);

module.exports = Product_Service;
