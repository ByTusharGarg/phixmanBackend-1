const mongoose = require("mongoose");

const customerWalletSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Customerwallet = mongoose.model("Customerwallet", customerWalletSchema);
module.exports = Customerwallet;
