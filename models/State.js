const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema(
  {
    Name: { type: String },
    Country: { type: Schema.Types.ObjectId, ref: "Country" },
  },
  { timestamps: true }
);

const State = mongoose.model("State", schema);

module.exports = State;
