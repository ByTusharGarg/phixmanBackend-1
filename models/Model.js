const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moodelSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand" }, // brand id
    modelId: { type: String }, // modelid phixmen genrated id
    Name: { type: String, required: true, unique: true }, // model name
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "category",
      required: true,
    }, // mobile tv
  },
  { timestamps: true }
);
const Model = mongoose.model("Model", moodelSchema);

module.exports = Model;
