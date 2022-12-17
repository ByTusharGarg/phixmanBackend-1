const mongoose = require("mongoose");
const { invoiceStatusTypes } = require("../enums/types");
const { invoiceTypesList } = require("../enums/invoiceTypes");
const Schema = mongoose.Schema;

const Invoice = mongoose.model(
  "Invoice",
  new Schema({
    date: { type: String, required: true },
    taxPayer: { type: Schema.Types.ObjectId, ref: "Partner" },
    invoiceId: { type: String, unique: true, index: true },
    type: { type: String, enum: invoiceTypesList },
    isGstPaid: { type: Boolean, default: false },
    status: { type: String, enum: invoiceStatusTypes },
    claim: { type: Schema.Types.ObjectId, ref: "ClaimRequest" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    partner: { type: Schema.Types.ObjectId, ref: "Partner" },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor" },
    isPaid: { type: Boolean, default: true },
    items: [Object],
    bookingAmt: Number,
    estAmt: Number,
    discount: Number,
    promo: String,
    tax: Number,
  })
);

// ORDER A category commission
// OEDER B ORDER AMOUNT COMMISSION
// LEAD BOAT while acceptiong the orders

module.exports = Invoice;
