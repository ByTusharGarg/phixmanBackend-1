const mongoose = require('mongoose');
const counterSchema = mongoose.Schema({
    name: { type: String, required: true },
    seq: { type: Number, default: 1 }
})
const Counters = mongoose.model('Counters', counterSchema);

module.exports = Counters;