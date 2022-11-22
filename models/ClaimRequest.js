const mongoose = require("mongoose");
const { claimTypesList } = require("../enums/claimTypes");
const Schema = mongoose.Schema;

const ClaimRequest = mongoose.model(
  "ClaimRequest",
  new Schema({
    claimId: { required: true, type: String },
    claimType: {
      type: String,
      enum: claimTypesList,
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

  })
)
module.exports = ClaimRequest;
