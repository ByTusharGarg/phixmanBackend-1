const mongoose = require("mongoose");
const { transsactionTypes, transsactionStatus, transsactionUser } = require('../enums/types');

const transsactionSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    transsactionUser: { type: String, enum: transsactionUser, required: true },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: [true, "walletId is required"] },
    amount: { type: Number, required: true },
    title: { type: String, default: '' },
    reason: { type: String, default: '' },
    transsactionType: { type: String, enum: transsactionTypes },
    currency: {
        type: String,
        default: "INR"
    },
    status: {
        type: String,
        required: [true, "payment status is required"],
        enum: transsactionStatus,
    },
}, { timestamps: true });

const Coupon = mongoose.model("wallettransaction", transsactionSchema);

module.exports = Coupon;
