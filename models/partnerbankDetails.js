const mongoose = require("mongoose");

const payoutsSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    beneId: {
        type: String,
        unique: true,
        index: true,
        required: true
    },
    bankAccount: {
        type: String,
        unique: true,
        index: true,
        required: true
    },
    ifsc: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address1: {
        type: String,
        required: true
    },
}, { timestamps: true });

const payoutsModels = mongoose.model("beneficiary", payoutsSchema);
module.exports = payoutsModels;