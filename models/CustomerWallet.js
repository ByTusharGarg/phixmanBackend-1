const mongoose = require("mongoose");

const customerWalletSchema = mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, unique: true },
    balance: {
        type: Number,
        default: 0
    },
    status:{
        type:Boolean,
        default:true
    }
}, { timestamps: true });

module.exports = mongoose.model("Customerwallet", customerWalletSchema);