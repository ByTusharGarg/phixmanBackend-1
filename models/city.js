const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    Name: { type: String },
    State: { type: Schema.Types.ObjectId, ref: "State" },
  },
  { timestamps: true }
);

const City = mongoose.model("City", schema);

module.exports = City;
