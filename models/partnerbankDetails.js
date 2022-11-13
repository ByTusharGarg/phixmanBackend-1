const mongoose = require("mongoose");
const { payoutPaymentStatus } = require('../enums/types');

const payoutsSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    beneId: {
        type: String,
        unique:true,
        index:true,
        required:true
    },
    bankAccount: {
        type: String,
        unique:true,
        index:true,
        required:true
    },
    ifsc: {
        type: String,
        required:true
    },
}, { timestamps: true });

const payoutsModels = mongoose.model("bankdetails", payoutsSchema);
module.exports = payoutsModels;