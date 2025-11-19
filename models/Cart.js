// Import mongoose for defining schema and model
const mongoose = require("mongoose");

// Define the Cart schema
const cartSchema = new mongoose.Schema({
  // Reference to the User who added the product to the cart
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User" // refers to the User model
  },
  // Reference to the Product added to the cart
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product" // refers to the Product model
  },
  // Quantity of the product in the cart
  quantity: {
    type: Number,
    default: 1 // default quantity is 1
  },
  // Timestamp when the item was added to the cart
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Export the Cart model
module.exports = mongoose.model("Cart", cartSchema);
