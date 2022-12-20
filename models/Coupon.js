const mongoose = require("mongoose");
const { offerPromoType, coupenUserType } = require("../enums/types");

const couponSchema = mongoose.Schema(
  {
    promoCode: { type: String, unique: true },
    promoType: { type: String, require: true, enum: offerPromoType },

    title: { type: String, require: true },
    description: { type: String },
    offerAmount: { type: Number, require: true },

    percentageOff: Number,
    maxDisc: Number,
    minCartValue: Number,

    startTime: { type: String },
    endTime: { type: String },
    startDate: { type: String },
    endDate: { type: String },

    isActive: {
      type: Boolean,
      default: true,
    },
    // user: { type: String, enum: coupenUserType, default: "PARTNER" },
  },
  { timestamps: true }
);

// 1. FRIST_TIME
// 2. GENERIC
// 3. one coupen

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;

// order
// desc
// images, -- multiple image
// audio

//subadmin
