const mongoose = require("mongoose");
const { payoutPaymentStatus } = require('../enums/types');

const refundSchema = mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    cashfreeOrderId: { type: String, required: true, unique: true },
    refundId: { type: String, required: true, unique: true },
    caashfreeData: Object,
}, { timestamps: true });

const refundsModels = mongoose.model("refund", refundSchema);
module.exports = refundsModels;