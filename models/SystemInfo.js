const mongoose = require("mongoose");
const { panalityEnnum } = require('../enums/types');
const Schema = mongoose.Schema;

const SystemInfo = mongoose.model(
  "SystemInfo",
  new Schema({
    taxName: String,
    taxNumber: String,
    igst: Number, // in percentage
    sgst: Number, // in percentage
    email: String,
    whatsAppNumber: String,
    helplineNumber: String,
    supportContactNumber: String,
    surchargeIncomingPercent: Number,
    surchargeOutgoingPercent: Number,
    serviceChargeCommisionPercent: Number,
    cashCollectionDeductionPercent: Number,
    onTimeRewardCommssion: Number,
    customerRatingRewardCommissionPercent: Number, // to be alloted to partner if rated either 4 or 5 of 5 by customer
    customerCancellationFees: Number,
    tipAmtPercentage: Number,
    taxPercentWithoutGST: Number,
    ispanality: { type: Boolean, default: false },
    palalityMenu: [
      {
        name: { type: String, enum: panalityEnnum },
        amount: { type: Number }
      }
    ]
  })
);

module.exports = SystemInfo;
