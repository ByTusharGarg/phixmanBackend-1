const mongoose = require("mongoose");
const { coupenUserType } = require('../enums/types');

const applyCodeSchema = mongoose.Schema({
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    promocodeId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
    // user: { type: String, enum:coupenUserType, default: "PARTNER" },

});

const Coupon = mongoose.model("AppliedCodeuser", applyCodeSchema);

module.exports = Coupon;
