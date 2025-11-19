// routes/employeeRoutes.js

// Import required modules
const express = require('express');
const router = express.Router();
const Employee = require('../models/EmployeeModell'); // Import Employee model
const jwt = require('jsonwebtoken');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET; // Get JWT secret from environment

// Route to add a new employee
router.post('/add', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body); // Create new employee document
    await newEmployee.save(); // Save to database
    res.status(201).json(newEmployee); // Respond with created employee
  } catch (err) {
    res.status(500).json({ error: err.message }); // Handle server error
  }
});

// Route to handle employee login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if employee exists with provided credentials
    const employee = await Employee.findOne({ email, password });
    if (!employee) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: employee._id, email: employee.email, name: employee.name, permissions: employee.permissions },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Respond with token and employee details
    res.json({
      success: true,
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        permissions: employee.permissions
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal error" }); // Handle server error
  }
});

// Route to fetch all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find(); // Get all employees
    res.status(200).json(employees); // Respond with employee list
  } catch (err) {
    res.status(500).json({ error: err.message }); // Handle error
  }
});

// Route to get count of employees
router.get('/count', async (req, res) => {
  try {
    const count = await Employee.countDocuments(); // Count documents
    res.status(200).json({ count }); // Respond with count
  } catch (err) {
    res.status(500).json({ error: 'Error fetching employee count' }); // Handle error
  }
});


// DELETE employee by ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee removed successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Export the router to use in main app
module.exports = router;
