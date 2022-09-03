const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notification = mongoose.model("notification", new Schema({
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner", default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    title: String,
    desc: String
}, { timestamps: true })
);

module.exports = notification;
