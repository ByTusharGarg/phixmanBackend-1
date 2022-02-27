const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Order = mongoose.model(
  "Order",
  new Schema({
    Partner: { type: Schema.Types.ObjectId, required: true, ref: "Partner" },
    Customer: { type: Schema.Types.ObjectId, required: true, ref: "Customer" },
    OrderId: { type: Number, required: true },
    OrderType: { type: String, required: true, enum: ["InStore", "Home"] },
    Status: {
      type: String,
      required: true,
      enum: ["Waiting", "confirmed", "InRepair", "completed"],
    },
    OrderDetails: {
      Amount: { type: Number, required: true },
      Items: [
        {
          Product: { type: String, required: true },
          Service: { type: String, required: true },
          Cost: { type: Number, required: true },
        },
      ],
    },
    Date: { type: Date, required: true },
    PaymentMode: { type: String, required: true, enum: [undefined] },
    Address: { type: String },
    PinCode: { type: String },
    PickUpRequired: { type: Boolean, required: true },
  })
);

module.exports = Order;
