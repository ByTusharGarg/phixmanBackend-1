const mongoose = require("mongoose");

const payoutsSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true,unique: true },
    transferId: {
        type: String,
        required: true,
        unique: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    totalDeduction: {
        type: Number
    },
    deduction: [],
    payableAmount: {
        type: Number
    },
    isCounted: {
        type: Boolean,
        default: false
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    metaData: Object
}, { timestamps: true });

const payoutsModels = mongoose.model("payouts", payoutsSchema);
module.exports = payoutsModels;