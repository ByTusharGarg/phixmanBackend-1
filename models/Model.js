const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moodelSchema = new Schema({
  Brand: { type: Schema.Types.ObjectId, ref: "Brand" },
  modelId: { type: Schema.Types.ObjectId, ref: "Model" },
  Name: { type: String, required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: "category", required: true }
});
const Model = mongoose.model("Model", moodelSchema);

module.exports = Model;
