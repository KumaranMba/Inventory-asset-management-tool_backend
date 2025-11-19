const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // only if you're referencing a User model
    required: true,
  },
  delivery: {
    fullName: String,
    address: String,
    phone: String,
  },
  cartItems: Array,
  totalAmount: Number,
  paymentMethod: String,
  cardInfo: Object,
  upiId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
