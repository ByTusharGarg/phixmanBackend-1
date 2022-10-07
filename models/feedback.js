const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = mongoose.model("feedback", new Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    from: { type: String, enum: ['partner', 'customer'] },

    userRatting: Number,
    phixmenRatting: Number,

    userDescription: String,
    phixmenDescription: String

}, { timestamps: true })
);

module.exports = feedbackSchema;
