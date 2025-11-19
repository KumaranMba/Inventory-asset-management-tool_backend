// models/EmployeeModel.js

// Import mongoose to define schema and model
const mongoose = require('mongoose');

// Define the schema for an employee
const employeeSchema = new mongoose.Schema({
  // Name of the employee
  name: String,

  // Email should be unique for each employee
  email: { type: String, unique: true },
   role: { type: String, default: "employee" },

  // Phone number of the employee
  phone: String,

  // Hashed password for authentication
  password: String,

  // isActive: { type: Boolean, default: true } // controls login access

  // Permissions object to control access rights
  permissions: {
    // Whether the employee can view data
    view: { type: Boolean, default: false },
    // Whether the employee can edit data
    edit: { type: Boolean, default: false }
  }
});

// Export the Employee model using the defined schema
module.exports = mongoose.model("Employee", employeeSchema);
