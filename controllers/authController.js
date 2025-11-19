// Import required modules and packages
const User = require("../models/userModel");
const bcrypt = require("bcryptjs"); // For password hashing
const jwt = require("jsonwebtoken"); // For generating JWT tokens
require('dotenv').config(); // To use environment variables

// Access JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// =====================
// REGISTER CONTROLLER
// =====================
exports.register = async (req, res) => {
  try {
    // Destructure user details from the request body
    const { name, email, password, phone, address, gender, isAdmin } = req.body;

    // Check if user with given email already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    // Hash the user's password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new User instance
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      gender,
      isAdmin: isAdmin || false // Default to false if not provided
    });

    // Save the new user to the database
    await user.save();

    // Generate a JWT token for the registered user
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // Respond with success message, token, and basic user info
    res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    // Handle any errors during registration
    res.status(500).json({ error: err.message });
  }
};

// =====================
// LOGIN CONTROLLER
// =====================
exports.login = async (req, res) => {
  try {
    // Destructure email and password from the request body
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Compare the provided password with the hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate a JWT token for the logged-in user
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Respond with success message, token, and user info
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });

  } catch (err) {
    // Handle any errors during login
    res.status(500).json({ error: err.message });
  }
};
