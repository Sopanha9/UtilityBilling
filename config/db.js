const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // ប្រើ Connection String ដែលអ្នកបានចម្លងទុកក្នុង .env
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully!');
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;