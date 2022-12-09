const mongoose = require('mongoose');
const { transsactionStatus } = require('../enums/types');
const Schema = mongoose.Schema;

const transactionSchema = mongoose.Schema({
    cf_order_id: {
        type: String
    },
    ourorder_id: { type: Schema.Types.ObjectId, ref: "Order" },
    order_id: {
        type: String
    },
    cashfreeLinkId: {
        type: String
    },
    cashfreeOrderId: { type: String },
    entity: {
        type: String
    },
    order_currency: {
        type: String,
    },
    order_amount: {
        type: Number
    },
    order_status: {
        type: String
    },
    order_token: {
        type: String
    },
    order_expiry_time: {
        type: String,
    },
    customer_details: {
        type: Object
    },
    order_meta: {
        type: Object
    },
    payment_method: {
        type: Object
    },
    payment_group: {
        type: Object
    },
    payment_method: {
        type: Object
    },
    payment_link: {
        type: String
    },
    payment_status: {
        type: String,
        enum: transsactionStatus,
        default: 'pending'
    },
    settlements: Object,
    payments: Object,
    refunds: Object,
    payment: Object,
    type: String,
    event_time: Date,
    Desc: String,
    paymentverified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const mod = mongoose.model('ordertransaction', transactionSchema);
module.exports = mod;
