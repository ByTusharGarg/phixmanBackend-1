const mongoose = require("mongoose");

const applyCodeSchema = mongoose.Schema({
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    promocodeId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
});

const Coupon = mongoose.model("AppliedCodeuser", applyCodeSchema);

module.exports = Coupon;
