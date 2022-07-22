const mongoose = require('mongoose');
const { transsactionStatus } = require('../enums/types');

const transactionSchema = mongoose.Schema({
    cf_order_id: {
        type: String
    },
    order_id: {
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
    Desc: String
}, { timestamp: true });

const mod = mongoose.model('ordertransaction', transactionSchema);
module.exports = mod;
