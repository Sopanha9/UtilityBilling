const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// 1. បង្ហាញអតិថិជនទាំងអស់ (Show All)
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ស្វែងរកអតិថិជនតាមឈ្មោះ (Search)
// Note: Put this BEFORE /:id to avoid conflict if passing params
router.get('/search', async (req, res) => {
    try {
        const { name } = req.query;
        const customers = await Customer.find({ name: new RegExp(name, 'i') });
        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// បង្កើតអតិថិជនថ្មី (Create)
router.post('/', async (req, res) => {
    try {
        const customer = new Customer(req.body);
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. កែប្រែព័ត៌មាន (Edit)
router.put('/:id', async (req, res) => {
    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCustomer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. លុបអតិថិជន (Delete)
router.delete('/:id', async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.json({ message: "លុបទិន្នន័យបានជោគជ័យ!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// // API សម្រាប់ស្វែងរកអតិថិជន (ស្វែងរកតាម ឈ្មោះ ឬ លេខទូរស័ព្ទ)
// router.get('/search', async (req, res) => {
//     try {
//         const query = req.query.q; // ទទួលពាក្យដែលអ្នកវាយក្នុង Search Bar
        
//         const results = await Customer.find({
//             $or: [
//                 { name: { $regex: query, $options: 'i' } }, // 'i' មានន័យថាអក្សរតូចធំមិនសំខាន់
//                 { phone: { $regex: query, $options: 'i' } }
//             ]
//         }).limit(10); // បង្ហាញត្រឹមតែ ១០ នាក់ដែលសមស្របជាងគេបំផុត

//         res.json(results);
//     } catch (err) {
//         res.status(500).json({ error: "Search failed!" });
//     }
// });

module.exports = router;
