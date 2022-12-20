const mongoose = require("mongoose");
// const { payoutStatusTypes, payoutStatusTypesObject } = require('../enums/types');

const payoutstranssactionSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    transsactionId: {
        type: String,
        required: true,
        unique: true
    },
    payoutType: {
        type: String,
        required: true,
        ennum: ['single', 'bulk'],
        default: 'single'
    },
    payoutsIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "payouts" }],
    payableAmount: {
        type: Number
    },
    metaData: Object
}, { timestamps: true });

const payoutstranssactionModels = mongoose.model("payoutstranssaction", payoutstranssactionSchema);
module.exports = payoutstranssactionModels;