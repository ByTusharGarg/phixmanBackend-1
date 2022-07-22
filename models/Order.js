const mongoose = require("mongoose");
const {
  orderStatusTypes,
  orderTypes,
  paymentModeTypes,
  paymentStatus,
} = require("../enums/types");
const Schema = mongoose.Schema;

const Order = mongoose.model(
  "Order",
  new Schema({
    Partner: { type: Schema.Types.ObjectId, ref: "Partner", default: null },
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
          CategoryId: { type: Schema.Types.ObjectId, ref: "category" },
          ModelId: { type: Schema.Types.ObjectId, ref: "Model" },
          ServiceId: { type: Schema.Types.ObjectId, ref: "Product_Service" },
          Cost: { type: Number }
        },
      ],
    },
    Date: { type: Date, default: Date.now },
    PaymentMode: { type: String, enum: paymentModeTypes },
    PaymentStatus: { type: String, enum: paymentStatus },
    PendingAmount: { type: Number },
    // TxnId: { type: Schema.Types.ObjectId, required: true, ref: "transaction" },
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
