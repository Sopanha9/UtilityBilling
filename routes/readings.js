const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Reading = require('../models/Reading');

// API សម្រាប់កត់កុងទ័រ និងគណនាលុយ (Record & Bill)
router.post('/record', async (req, res) => {
    try {
        const { customerId, newReading } = req.body;

        // 1. រកអតិថិជន
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: "រកមិនឃើញអតិថិជន" });
        }
        const oldReading = customer.last_reading;

        // 2. គណនា Logic < 5 unit ឬ >= 5 unit
        const usage = newReading - oldReading;
        const pricePerUnit = (usage < 5) ? 4000 : 3000;
        const totalAmount = usage * pricePerUnit;

        // 3. រក្សាទុកប្រវត្តិការកត់ត្រា
        const newRecord = new Reading({
            customer: customerId,
            old_reading: oldReading,
            new_reading: newReading,
            usage: usage,
            total_price: totalAmount
        });
        await newRecord.save();

        // 4. Update លេខកុងទ័រចុងក្រោយរបស់អតិថិជនសម្រាប់ខែក្រោយ
        customer.last_reading = newReading;
        await customer.save();

        res.json({ message: "ជោគជ័យ!", bill: newRecord });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// មើលប្រវត្តិប្រើប្រាស់របស់អតិថិជនម្នាក់ៗ (History)
router.get('/history/:customerId', async (req, res) => {
    try {
        const history = await Reading.find({ customer: req.params.customerId }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
