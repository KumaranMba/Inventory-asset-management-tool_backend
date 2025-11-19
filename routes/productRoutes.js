const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const ProductStockHistory = require("../models/ProductStockHistory");
const Cart = require("../models/Cart");
const multer = require("multer");
const path = require("path");
const Userr = require("../models/userModel");
const Payment = require("../models/Payment");
const ExcelJS = require('exceljs');

/* ========================== Multer Configuration ========================== */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

/* ========================== Excel Export Routes ========================== */

// Download all users as Excel
router.get('/users/download-excel', async (req, res) => {
  try {
    const users = await Userr.find();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');

    sheet.columns = [
      { header: 'User ID', key: '_id', width: 25 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 }
    ];

    users.forEach(user => sheet.addRow(user.toObject()));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=all_users.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error generating user Excel file:', err);
    res.status(500).send('Internal server error');
  }
});

// Download payments of a specific month as Excel
router.get('/download-excel', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).send('Month and year required');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const payments = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('user', 'name');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payments');

    sheet.columns = [
      { header: 'Transaction ID', key: '_id', width: 25 },
      { header: 'User ID', key: 'userId', width: 15 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'Delivery Name', key: 'deliveryName', width: 20 },
      { header: 'Phone', key: 'deliveryPhone', width: 15 },
      { header: 'Address', key: 'deliveryAddress', width: 30 },
      { header: 'Cart Items', key: 'cartItems', width: 40 },
      { header: 'Amount (₹)', key: 'totalAmount', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Date', key: 'createdAt', width: 20 }
    ];

    payments.forEach((pay) => {
      sheet.addRow({
        _id: pay._id.toString(),
        userId: pay.user?._id?.toString() || 'N/A',
        userName: pay.user?.name || 'N/A',
        deliveryName: pay.delivery.fullName,
        deliveryPhone: pay.delivery.phone,
        deliveryAddress: pay.delivery.address,
        cartItems: pay.cartItems.map(item => item.product.name || '').join(', '),
        totalAmount: pay.totalAmount,
        paymentMethod: pay.paymentMethod,
        createdAt: new Date(pay.createdAt).toLocaleString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=payment_${month}_${year}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error creating Excel file:', err);
    res.status(500).send('Internal server error');
  }
});

/* ========================== Cart Routes ========================== */

// Get all cart items for a user
router.get('/cart/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "User ID is required." });

    const cartItems = await Cart.find({ userId }).populate('productId').exec();

    const formattedCart = cartItems.map(item => ({
      _id: item._id,
      product: item.productId,
      quantity: item.quantity,
      addedAt: item.addedAt
    }));

    res.status(200).json(formattedCart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Failed to fetch cart items", error });
  }
});

// Add item to cart or update quantity
router.post("/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (!userId || !productId) return res.status(400).json({ message: "User ID and Product ID are required." });

    const existingItem = await Cart.findOne({ userId, productId });
    if (existingItem) {
      existingItem.quantity += quantity || 1;
      await existingItem.save();
      return res.status(200).json({ message: "Cart updated successfully", cart: existingItem });
    }

    const cartItem = new Cart({ userId, productId, quantity: quantity || 1 });
    await cartItem.save();
    res.status(201).json({ message: "Product added to cart", cart: cartItem });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update cart quantity
router.put('/cart/update/:id', async (req, res) => {
  try {
    const updatedItem = await Cart.findByIdAndUpdate(
      req.params.id,
      { quantity: req.body.quantity },
      { new: true }
    );
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quantity' });
  }
});

// Remove cart item
router.delete('/cart/remove/:id', async (req, res) => {
  try {
    const deletedItem = await Cart.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ message: 'Cart item not found' });
    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Failed to remove item from cart', error: error.message });
  }
});

/* ========================== Product Routes ========================== */

// Add a product with image upload and save stock history
router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) productData.image = `/uploads/${req.file.filename}`;

    const product = new Product(productData);
    await product.save();

    await ProductStockHistory.create({
      productId: product._id,
      quantity: productData.stockQuantity,
    });

    res.status(201).json({ message: "Product added successfully", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Group products by category
router.get('/grouped', async (req, res) => {
  try {
    const products = await Product.find();
    const grouped = {};

    products.forEach(product => {
      if (!grouped[product.category]) grouped[product.category] = [];
      grouped[product.category].push(product);
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit product and track stock changes
/*router.put("/edit/:id", async (req, res) => {
  try {
    const { stockQuantity, description } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (stockQuantity && stockQuantity !== product.stockQuantity) {
      await ProductStockHistory.create({
        productId: product._id,
        quantity: stockQuantity,
      });
    }

    product.stockQuantity = stockQuantity;
    product.description = description;
    await product.save();

    res.status(200).json({ message: "Product updated and history saved." });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});*/

// Edit product and track stock changes
router.put("/edit/:id", async (req, res) => {
  try {
    const { stockQuantity, description, price } = req.body; // ✅ Added price

    // Log incoming data for debugging
    console.log("🟢 Update Request Received:");
    console.log("Product ID:", req.params.id);
    console.log("Request Body:", req.body);

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Track stock changes
    if (stockQuantity && stockQuantity !== product.stockQuantity) {
      await ProductStockHistory.create({
        productId: product._id,
        quantity: stockQuantity,
      });
      console.log("📦 Stock change tracked for:", product._id);
    }

    // ✅ Update product fields
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;

    await product.save();

    console.log("✅ Product Updated Successfully:", {
      id: product._id,
      price: product.price,
      stockQuantity: product.stockQuantity,
    });

    res.status(200).json({ message: "Product updated successfully." });
  } catch (err) {
    console.error("❌ Update failed:", err);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
});


// Update product stock (reduce after purchase)
router.put('/update-stock/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send({ error: 'Product not found' });

    const reduceBy = parseInt(req.body.quantity);
    if (isNaN(reduceBy) || reduceBy <= 0) return res.status(400).send({ error: 'Invalid quantity' });
    if (product.stockQuantity < reduceBy) return res.status(400).send({ error: 'Insufficient stock' });

    product.stockQuantity -= reduceBy;
    await product.save();

    res.send({ message: 'Stock updated successfully' });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).send({ error: 'Error updating stock' });
  }
});

// Get stock history of a product
router.get('/:productId/stock-history', async (req, res) => {
  try {
    const history = await ProductStockHistory.find({ productId: req.params.productId }).sort({ date: 1 });
    const formatted = history.map(item => ({
      date: item.date.toISOString().split('T')[0],
      stock: item.quantity
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock history' });
  }
});

// Delete product by ID
router.delete("/delete/:id", async (req, res) => {
     console.log("DELETE hit:", req.params.id);

  try {
    const product = await Product.findByIdAndDelete(req.params.id);
     
    console.log("DELETE response sending:", product);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

     return res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
     return res.status(500).json({ message: "Internal server error" });
  }
});



/* ========================== Payment & Sales Routes ========================== */

// Save a payment
router.post('/payment/save', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json({ message: 'Payment saved successfully' });
  } catch (err) {
    console.error('Error saving payment:', err);
    res.status(500).json({ error: 'Failed to save payment' });
  }
});

// Get all payments of a user
router.get('/payment/user/:userId', async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.params.userId });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Daily sales summary
router.get('/sales-history', async (req, res) => {
  try {
    const salesData = await Payment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          amount: 1,
          _id: 0
        }
      }
    ]);
    res.json(salesData);
  } catch (err) {
    console.error("Error fetching sales history:", err);
    res.status(500).json({ error: "Failed to fetch sales history" });
  }
});

// Get total sales and total order count
router.get('/total-sales', async (req, res) => {
  try {
    const payments = await Payment.find();
    const totalSales = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOrders = payments.length;
    res.json({ totalSales, totalOrders });
  } catch (err) {
    console.error("Error fetching total sales:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* ========================== User Count ========================== */

// Get total user count
router.get('/count', async (req, res) => {
  try {
    const count = await Userr.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count users' });
  }
});

module.exports = router;
