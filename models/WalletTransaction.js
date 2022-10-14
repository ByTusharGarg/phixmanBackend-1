const mongoose = require("mongoose");
const {
  transsactionTypes,
  transsactionStatus,
  transsactionUser,
} = require("../enums/types");

const transsactionSchema = mongoose.Schema(
  {
    cashfree: { type: Object, default: {} },
    tranId: { type: String, default: "" },
    transsactionUser: { type: String, enum: transsactionUser, required: true },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: [true, "walletId is required"],
    },
    amount: { type: Number, required: true },
    title: { type: String, default: "" },
    reason: { type: String, default: "" },
    transsactionType: { type: String, enum: transsactionTypes },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      required: [true, "payment status is required"],
      enum: transsactionStatus,
      default: "pending",
    },
  },
  { timestamps: true }
);

const wallettransaction = mongoose.model(
  "wallettransaction",
  transsactionSchema
);

module.exports = wallettransaction;
