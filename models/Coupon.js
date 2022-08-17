const mongoose = require("mongoose");
const { offerPromoType } = require('../enums/types');

const couponSchema = mongoose.Schema({
  promoCode: { type: String, unique: true },
  promoType: { type: String, require: true, enum: offerPromoType },

  title: { type: String, require: true },
  description: { type: String },
  offerAmount: { type: Number, require: true },

  percentageOff: Number,
  maxDisc: Number,
  minCartValue: Number,

  startValidity: Date,
  endValidity: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

// 1. FRIST_TIME
// 2. GENERIC
// 3. one coupen

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
