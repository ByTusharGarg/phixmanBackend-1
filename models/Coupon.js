const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({
  code: {
    type: String,
  },
  percentageOff: Number,
  maxDisc: Number,
  minCartValue: Number,
  validTill: Date,
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
