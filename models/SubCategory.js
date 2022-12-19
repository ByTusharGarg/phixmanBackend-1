const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: "category" },
    name: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const SubCategory = mongoose.model("SubCategory", schema);

module.exports = SubCategory;
