const mongoose = require("mongoose");
const {
  claimTypesList,
  claimT,
  claimStatusList,
} = require("../enums/claimTypes");
const Schema = mongoose.Schema;

const ClaimRequest = mongoose.model("ClaimRequest", new Schema({
  claimId: { required: true, type: String },
  claimType: {
    type: String,
    enum: claimTypesList,
    required: true,
    default: claimTypesList[0],
  },
  claim: {
    type: String,
    enum: claimT,
    required: true,
  },
  orderId: { type: Schema.Types.ObjectId, ref: "Order" },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
  },
  title: { required: true, type: String },
  description: { required: true, type: String },
  images: [String],
  voiceNote: String,
  partnerId: {
    type: Schema.Types.ObjectId,
    ref: "Partner",
  },
  customerDetails: {
    address: { type: String },
    deliveryAddress: { type: String, default: "" },
    name: { type: String },
    phoneNumber: { type: String },
  },
  date: { type: String },
  time: { type: String },
  travel: { type: Number, default: 0 },
  inventory: { type: Number, default: 0 },
  service: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: claimStatusList,
    required: true,
    default: claimStatusList[0],
  },
  claimStatus: {
    type: String,
    enum: claimStatusList,
    required: true,
    default: claimStatusList[0],
  },
})
);
module.exports = ClaimRequest;



// chanrges
// 1. travel,inventory,service

// customer and vendor
// ## customer
// 1. create request and add desc orderID
