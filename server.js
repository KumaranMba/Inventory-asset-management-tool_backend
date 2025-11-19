// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const employeeRoutes = require('./routes/employeeRoutes');
const path = require('path');
const authRoutes = require('./routes/authRoutes'); // Adjust the path if needed
const productRoutes = require('./routes/productRoutes'); // Adjust the path if needed
// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middlewares
app.use(cors()); // Allow Cross-Origin requests
app.use(express.json()); // Parse incoming JSON requests

// Health Check Route
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

// Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/product', productRoutes);
app.use('/api/employees', employeeRoutes);
// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1); // Exit process with failure
  }
};

connectDB();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
