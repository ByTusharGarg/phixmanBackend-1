const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const partnerReviews = mongoose.model(
  "partnerReviews",
  new Schema(
    {
      review: { type: String, required: true },
      rating: { type: Number, required: true },
      Customer: { type: Schema.Types.ObjectId, ref: "Customer" },
      Partner: { type: Schema.Types.ObjectId, required: true, ref: "Partner" },
    },
    { timestamps: true }
  )
);
module.exports = partnerReviews;
