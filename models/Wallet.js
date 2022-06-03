const mongoose = require("mongoose");

const wallletSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true, unique: true },
    balance: {
        type: Number,
        default: 0
    },
    status:{
        type:Boolean,
        default:true
    }
}, { timestamp: true });

const Coupon = mongoose.model("Wallet", wallletSchema);

module.exports = Coupon;
