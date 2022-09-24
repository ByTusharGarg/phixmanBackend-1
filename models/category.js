const mongoose = require("mongoose");
const { orderTypes, categoryTypes } = require("../enums/types");
const Schema = mongoose.Schema;
const categorySchema = new mongoose.Schema({
  video: String,
  icon: String,
  name: { type: String, unique: true },
  key: { type: String, default: "" },
  categoryType: { type: String, enum: categoryTypes, default: "Home service" },
  servedAt: [{ type: String, enum: orderTypes }],
  components: [String],
  Terms: { type: String, default: null },
  forms: [
    {
      name: String,
      features: [{ type: Schema.Types.ObjectId, ref: "Feature" }],
    },
  ],
  availableOn: {
    days: [String],
    timing: { from: String, to: String },
  },
  Slots: [{ from: String, to: String }],
  maxDisc: Number, //in percentage
  minDisc: Number, //in percentage
  maxDuration: Number, //in hours
  minDuration: Number, //in hours
  LeadExpense: Number,
  companyComissionPercentage: Number,
  enabled: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  modelRequired: { type: Boolean, default: false },
});

const category = mongoose.model("category", categorySchema);

module.exports = category;
