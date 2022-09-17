const mongoose = require("mongoose");
const { orderTypes, categoryTypes } = require("../enums/types");
const Schema = mongoose.Schema;

const orderMetaDataSchema = new mongoose.Schema({
    orderId: { type: Schema.Types.ObjectId, ref: "Order", unique: true },
    // jobCard: {
    //     components: [String],
    //     phoneImages: [String],
    //     selfieWithproduct: String,
    //     signature: String,
    //     helpers: [String]
    // },
    jobCard: [
        { type: Object }
    ],
    checkIn: [
        { type: Object }
    ]
});

const orderMetaData = mongoose.model("orderMetaData", orderMetaDataSchema);

module.exports = orderMetaData;

