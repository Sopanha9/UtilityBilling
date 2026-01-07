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
app.use('/api', require('./routes/readings')); // Mount at /api so we get /api/record and /api/history

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));