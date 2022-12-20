const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    ZoneId: { type: String },
    Name: { type: String },
    City: { type: Schema.Types.ObjectId, ref: "City" },
    PinCodes: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Zone = mongoose.model("Zone", schema);

module.exports = Zone;
