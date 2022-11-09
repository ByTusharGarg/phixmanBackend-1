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
    invoiceId: { type: String, default: null },
    OrderType: { type: String, enum: orderTypes },
    Status: {
      type: String,
      enum: orderStatusTypes,
    },
    paidamount: { type: Number, default: 0 },
    OrderDetails: {
      Amount: { type: Number },
      Gradtotal: { type: Number },
      Items: [
        {
          CategoryId: { type: Schema.Types.ObjectId, ref: "category" },
          ModelId: { type: Schema.Types.ObjectId, ref: "Model" },
          ServiceId: { type: Schema.Types.ObjectId, ref: "Product_Service" },
          Cost: { type: Number },
        },
      ],
    },
    Date: { type: String },
    PaymentMode: { type: String, enum: paymentModeTypes },
    PaymentStatus: { type: String, enum: paymentStatus },
    PendingAmount: { type: Number },
    TxnId: [{ type: Schema.Types.ObjectId, ref: "ordertransaction" }],
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
    timeSlot: {
      day: { type: String, default: "" },
      time: { type: String, default: "" },
    },
  }, { timestamps: true })
);

module.exports = Order;
