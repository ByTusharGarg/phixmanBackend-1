const mongoose = require("mongoose");
const { transsactionTypes, transsactionStatus } = require('../enums/types');

const transsactionSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: [true, "partnerId is required"] },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: [true, "walletId is required"] },
    amount: { type: Number },
    title: { type: String,default:'' },
    reason: { type: String,default:'' },
    transsactionType: { type: String, enum: transsactionTypes },
    currency: {
        type: String,
        default:"INR"
    },
    status: {
        type: String,
        required: [true, "payment status is required"],
        enum: transsactionStatus,
    },
}, { timestamp: true });

const Coupon = mongoose.model("Transaction", transsactionSchema);

module.exports = Coupon;
