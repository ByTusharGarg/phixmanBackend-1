const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    linkid: { type: String, unique: true, index: true },
    order_id: { type: Schema.Types.ObjectId, ref: "Order" },
    amount: { type: Number },
    metaData:Object
});

const SubCategory = mongoose.model("paymentLink", schema);

module.exports = SubCategory;
