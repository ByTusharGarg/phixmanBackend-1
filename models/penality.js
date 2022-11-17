const mongoose = require("mongoose");

const penalitySchema = mongoose.Schema(
    {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    reason: {
        type: String
    },
    amount: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true},
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", required: true },
    model: {type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true}
    

}, { timestamps: true }
);

const Penality = mongoose.model("Penality", penalitySchema);
module.exports = Penality