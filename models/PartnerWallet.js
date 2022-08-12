const mongoose = require("mongoose");

const partnerWalletSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true, unique: true },
    balance: {
        type: Number,
        default: 0
    },
    status:{
        type:Boolean,
        default:true
    }
}, { timestamps: true });

const Coupon = mongoose.model("partnerwallet", partnerWalletSchema);

module.exports = Coupon;
