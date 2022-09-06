const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = mongoose.model("feedback", new Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    title: String,
    description: String
}, { timestamps: true })
);

module.exports = feedbackSchema;
