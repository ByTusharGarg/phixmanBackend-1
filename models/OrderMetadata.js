const mongoose = require("mongoose");
const { orderTypes, categoryTypes } = require("../enums/types");
const Schema = mongoose.Schema;

const orderMetaDataSchema = new mongoose.Schema({
    orderId: { type: Schema.Types.ObjectId, ref: "Order", unique: true },
    jobCard: [
        { type: Object }
    ],
    checkIn: [
        { type: Object }
    ]
});

const orderMetaData = mongoose.model("orderMetaData", orderMetaDataSchema);

module.exports = orderMetaData;

