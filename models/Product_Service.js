const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Product_Service = mongoose.model(
  "Product_Service",
  new Schema({
    categoryId: { type: Schema.Types.ObjectId, ref: "category" },
    modelId: { type: String, required: true, unique: true },
    modelName: { type: String, required: true, unique: true },
    services: [
      {
        serviceName:String,
        cost:Number,
        serviceId:{type:String,unique:true}
      }
    ]
  })
);

module.exports = Product_Service;
