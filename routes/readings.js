const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Reading = require('../models/Reading');

// API សម្រាប់កត់កុងទ័រ និងគណនាលុយ (Record & Bill)
router.post('/record', async (req, res, next) => {
    try {
        const { customerId, newReading } = req.body;

        // Validation
        if (!customerId || newReading === undefined) {
            return res.status(400).json({ success: false, message: "Please provide customerId and newReading" });
        }

        // 1. រកអតិថិជន
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ success: false, message: "រកមិនឃើញអតិថិជន" });
        }
        const oldReading = customer.last_reading;

        // Validation: New reading cannot be less than old reading
        if (newReading < oldReading) {
            return res.status(400).json({
                success: false,
                message: "New reading cannot be strictly lower than old reading",
                details: { old: oldReading, new: newReading }
            });
        }

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
            total_price: totalAmount,
            // date will be auto-set by default
        });
        await newRecord.save();

        // 4. Update លេខកុងទ័រចុងក្រោយរបស់អតិថិជនសម្រាប់ខែក្រោយ
        customer.last_reading = newReading;
        await customer.save();

        res.json({ success: true, message: "ជោគជ័យ!", data: newRecord });
    } catch (err) {
        next(err);
    }
});

// មើលប្រវត្តិប្រើប្រាស់របស់អតិថិជនម្នាក់ៗ (History)
router.get('/history/:customerId', async (req, res, next) => {
    try {
        const history = await Reading.find({ customer: req.params.customerId }).sort({ date: -1 });
        res.json({ success: true, data: history });
    } catch (err) {
        next(err);
    }
});

// ទាញយកវិក្កយបត្រចុងក្រោយបង្អស់សម្រាប់ Print
router.get('/receipt/:customerId', async (req, res, next) => {
    try {
        const latestReading = await Reading.findOne({ customer: req.params.customerId })
            .sort({ date: -1 }) // យកអាថ្មីបំផុត
            .populate('customer'); // ទាញឈ្មោះអតិថិជនមកជាមួយ

        if (!latestReading) {
            return res.status(404).json({ success: false, message: "No Receipt Found" });
        }

        res.json({ success: true, data: latestReading });
    } catch (err) {
        next(err);
    }
});


module.exports = router;
