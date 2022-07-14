const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    cf_order_id: {
        type: String
    },
    order_id: {
        type: String
    },
    entity: {
        type: String
    },
    order_currency: {
        type: String,
    },
    order_amount: {
        type: Number
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
    order_status: {
        type: Number
    },
    order_token: {
        type: String
    },
    payment_link: {
        type: Boolean
    },
    settlements: Object,
    payments: Object,
    refunds: Object,
    payment: Object,
    type: String,
    event_time: Date,
    Desc: String
}, { timestamp: true });

const mod = mongoose.model('transaction', transactionSchema);
module.exports = mod;
