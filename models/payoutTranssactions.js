const mongoose = require("mongoose");
// const { payoutStatusTypes, payoutStatusTypesObject } = require('../enums/types');

const payoutstranssactionSchema = mongoose.Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    transferId: {
        type: String,
        required: true,
        unique: true
    },
    payoutsIds: [{ type: Schema.Types.ObjectId, ref: "payouts" }],
    payableAmount: {
        type: Number
    },
    metaData: Object
}, { timestamps: true });

const payoutstranssactionModels = mongoose.model("payoutstranssaction", payoutstranssactionSchema);
module.exports = payoutstranssactionModels;