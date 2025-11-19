// Import mongoose for MongoDB connection
const mongoose = require("mongoose");

// Define an async function to connect to the MongoDB database
const connectDB = async () => {
  try {
    // Attempt to connect using the connection string from environment variables
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ DB Connected"); // Success message
  } catch (err) {
    // If connection fails, log the error
    console.error("DB Error:", err.message);
  }
};

// Export the connectDB function so it can be used elsewhere in the application
module.exports = connectDB;
