const mongoose = require("mongoose");
const { payoutPaymentStatus } = require('../enums/types');

const payoutsSchema = mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    amount: {
        type: String
    },
    payoutStatus: {
        type: String,
        enum: payoutPaymentStatus
    },
}, { timestamps: true });

const payoutsModels = mongoose.model("payouts", payoutsSchema);
module.exports = payoutsModels;