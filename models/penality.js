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
    

}, { timestamps: true }
);

const Penality = mongoose.model("Penality", penalitySchema);
module.exports = Penality