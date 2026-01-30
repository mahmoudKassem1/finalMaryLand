const express = require('express');
const router = express.Router();

// 1. Import Controllers
const { 
  addOrderItems, 
  getOrders, 
  updateOrderStatus, 
  getMyOrders,
  getOrderById 
} = require('../controllers/orderController');

// 2. Import Middleware
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

// 3. Define Routes

// Root: 
// POST = Client creates order (Needs User Token -> protect)
// GET  = Admin sees all orders (Needs Admin Token -> adminProtect ONLY)
router.route('/')
  .post(protect, addOrderItems) 
  .get(adminProtect, getOrders); // ✅ REMOVED 'protect' to prevent conflict

// Client: My Orders
router.route('/myorders').get(protect, getMyOrders);

// Single Order: Get Details
router.route('/:id').get(protect, getOrderById);

// Admin: Update Status (Needs Admin Token -> adminProtect ONLY)
router.route('/:id/status').put(adminProtect, updateOrderStatus); // ✅ REMOVED 'protect'

module.exports = router;