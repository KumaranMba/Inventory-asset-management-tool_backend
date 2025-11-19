const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  sizeAvailable: String,
  image: String,
  description: String,
  brand: String,
  expectedDeliveryDate: String,
  price: Number,
  discount: Number,
  color: String,
  material: String,
  category: String,
  subCategory: String,
  warranty: String,
  stockQuantity: Number,
  sku: String,
  weight: String,
  dimensions: String,
  rating: Number,
  returnPolicy: String,
  countryOfOrigin: String,
  manufacturerDetails: String
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
