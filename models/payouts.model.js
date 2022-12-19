const mongoose = require("mongoose");
const { payoutStatusTypes, payoutStatusTypesObject, payoutTypes } = require('../enums/types');

const payoutsSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", unique: true },
    claimId: { type: mongoose.Schema.Types.ObjectId, ref: "ClaimRequest", required: true, default:null },
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
    deduction: [
        {
            title: String,
            value: Number,
            desc: String
        }
    ],
    logs: [
        {
            status: { type: String, enum: payoutStatusTypes },
            timestampLog: { type: Date },
        },
    ],
    payableAmount: {
        type: Number
    },
    paymentMode: {
        type: String
    },
    status: {
        type: String,
        enum: payoutStatusTypes,
        default: payoutStatusTypesObject.WITHDRAW
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    tyoes: {
        type: String,
        enum: payoutTypes,
        default: payoutTypes[1]
    },
    metaData: Object
}, { timestamps: true });

const payoutsModels = mongoose.model("payouts", payoutsSchema);
module.exports = payoutsModels;