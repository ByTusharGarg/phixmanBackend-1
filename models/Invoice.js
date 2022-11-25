const mongoose = require("mongoose");
const {invoiceStatusTypes} = require("../enums/types")
const {invoiceTypesList} = require("../enums/invoiceTypes")
const Schema = mongoose.Schema;
const Invoice = mongoose.model(
  "Invoice",
  new Schema({
    date: { type: String, required: true },
    taxPayer:{type: Schema.Types.ObjectId, ref:"Partner", default: ''},
    invoiceId:{ type: String,unique: true, index: true },
    type:{type:String, enum: invoiceTypesList},
    status: {type: String,enum: invoiceStatusTypes,},
    claim:{type: Schema.Types.ObjectId, ref:"ClaimRequest", default: ''},
    order: { type: Schema.Types.ObjectId, ref:"Order", default: '' },
    customer :{ type: Schema.Types.ObjectId, ref:"Customer", default: '' },
    partner:{ type: Schema.Types.ObjectId, ref:"Partner", default: '' },
    vendor:{ type: Schema.Types.ObjectId, ref:"Vendor", default: '' },
  })
);


module.exports = Invoice;
