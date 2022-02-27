const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Invoice = mongoose.model(
  "Invoice",
  new Schema({
    Order: { type: Schema.Types.ObjectId, required: true, ref: "Order" },
    Date: { type: String, required: true },
  })
);
module.exports = Invoice;
