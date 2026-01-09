const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// 1. បង្ហាញអតិថិជនទាំងអស់ (Show All)
// 1. បង្ហាញអតិថិជនទាំងអស់ (Show All) - with Pagination
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const customers = await Customer.find()
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Customer.countDocuments();

        res.json({
            success: true,
            data: customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        next(err);
    }
});

// 2. ស្វែងរកអតិថិជនតាមឈ្មោះ (Search)
// Note: Put this BEFORE /:id to avoid conflict if passing params
router.get('/search', async (req, res, next) => {
    try {
        const { name } = req.query;
        const customers = await Customer.find({ name: new RegExp(name, 'i') });
        res.json({ success: true, data: customers });
    } catch (err) {
        next(err);
    }
});


// បង្កើតអតិថិជនថ្មី (Create)
// បង្កើតអតិថិជនថ្មី (Create)
router.post('/', async (req, res, next) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();
        res.status(201).json({ success: true, data: customer });
    } catch (err) {
        next(err);
    }
});

// 3. កែប្រែព័ត៌មាន (Edit)
// 3. កែប្រែព័ត៌មាន (Edit)
router.put('/:id', async (req, res, next) => {
    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updatedCustomer });
    } catch (err) {
        next(err);
    }
});

// 4. លុបអតិថិជន (Delete)
// 4. លុបអតិថិជន (Delete)
router.delete('/:id', async (req, res, next) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "លុបទិន្នន័យបានជោគជ័យ!" });
    } catch (err) {
        next(err);
    }
});




module.exports = router;
