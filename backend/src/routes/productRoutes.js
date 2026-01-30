const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct, // ✅ Changed from 'addProduct' to match Controller
  updateProduct, // ✅ This is required for the Edit Button
  deleteProduct
} = require('../controllers/productController');
const { adminProtect } = require('../middleware/adminMiddleware'); // ✅ Use the secure Admin middleware

// @route   GET /api/products
// @desc    Fetch all products (Public)
router.get('/', getProducts);

// @route   GET /api/products/:id
// @desc    Fetch single product details (Public)
router.get('/:id', getProductById);

// @route   POST /api/products
// @desc    Create a product
// @access  Private/Admin
router.post('/', adminProtect, createProduct);

// @route   PUT /api/products/:id
// @desc    Update a product (Edit Price, Stock, Image, etc.)
// @access  Private/Admin
router.put('/:id', adminProtect, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete('/:id', adminProtect, deleteProduct);

module.exports = router;