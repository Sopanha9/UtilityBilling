const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors'); // Good practice to include, though not explicitly requested, user installed it in package.json earlier
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to Database
connectDB();

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/readings', require('./routes/readings')); // Changed from /api to /api/readings for better structure
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

