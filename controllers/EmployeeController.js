// routes/employeeRoutes.js

// Import required modules
const express = require('express');
const router = express.Router();
const Employee = require('../models/EmployeeModell'); // Import Employee model

// =======================
// Route to Add Employee
// =======================
router.post('/add', async (req, res) => {
  try {
    // Create a new Employee document using request body
    const employee = new Employee(req.body);
    
    // Save the employee to the database
    await employee.save();
    
    // Respond with the created employee and 201 status
    res.status(201).json(employee);
  } catch (err) {
    // Handle validation or save errors
    res.status(400).json({ error: err.message });
  }
});

// ==========================
// Route to Get All Employees
// ==========================
router.get('/', async (req, res) => {
  try {
    // Fetch all employees from the database
    const employees = await Employee.find();
    
    // Send the list of employees as JSON response
    res.json(employees);
  } catch (err) {
    // Handle any errors during fetch
    res.status(500).json({ error: err.message });
  }
});

// Export the router to use in main app
module.exports = router;
