const mongoose = require('mongoose');

const ReadingSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    old_reading: { type: Number },
    new_reading: { type: Number },
    usage: { type: Number },
    total_price: { type: Number },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reading', ReadingSchema);