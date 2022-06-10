const mongoose = require("mongoose");
const {
  orderStatusTypes,
  orderTypes,
  paymentModeTypes,
} = require("../enums/types");
const Schema = mongoose.Schema;

const Order = mongoose.model(
  "Order",
  new Schema({
    Partner: { type: Schema.Types.ObjectId, ref: "Partner" },
    Customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    OrderId: { type: String },
    OrderType: { type: String, enum: orderTypes },
    Status: {
      type: String,
      enum: orderStatusTypes,
    },
    OrderDetails: {
      Amount: { type: Number },
      Items: [
        {
          Product: { type: String },
          Service: { type: String },
          Cost: { type: Number },
        },
      ],
    },
    Date: { type: Date, default: Date.now },
    PaymentMode: { type: String, enum: paymentModeTypes },
    address: {
      street: String,
      city: String,
      pin: String,
      state: String,
      country: String,
      cood: {
        lattitude: String,
        longitude: String,
      },
    },
    PickUpRequired: { type: Boolean },
  })
);

module.exports = Order;
