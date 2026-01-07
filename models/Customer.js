const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String },
    last_reading: { type: Number, default: 0 }, // លេខកុងទ័រដើម
    address: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', CustomerSchema);