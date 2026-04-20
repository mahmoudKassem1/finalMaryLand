const express = require('express');
const router = express.Router();

// 1. Import Controllers
const { 
  addOrderItems, 
  getOrders, 
  updateOrderStatus, 
  getMyOrders,
  getOrderById,
  deleteOrder,
  deleteAllOrders 
} = require('../controllers/orderController');

// 2. Import Middleware
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

// 3. Define Routes

// Root: 
// POST = Client creates order (Needs User Token -> protect)
// GET  = Admin sees all orders (Needs Admin Token -> adminProtect ONLY)
// DELETE = Admin deletes all orders
router.route('/')
  .post(protect, addOrderItems) 
  .get(adminProtect, getOrders)
  .delete(adminProtect, deleteAllOrders);

// Client: My Orders
router.route('/myorders').get(protect, getMyOrders);

// Single Order: Get Details / Delete Order
router.route('/:id')
  .get(protect, getOrderById)
  .delete(adminProtect, deleteOrder);

// Admin: Update Status (Needs Admin Token -> adminProtect ONLY)
router.route('/:id/status').put(adminProtect, updateOrderStatus);

module.exports = router;