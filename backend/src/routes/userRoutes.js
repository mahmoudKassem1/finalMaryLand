const express = require('express');
const router = express.Router();

// 1. Import ALL Controller Functions (Auth + Profile + Address)
const { 
  registerUser, 
  authUser, 
  getUserProfile, 
  updateUserProfile,
  addAddress, 
  updateAddress, 
  deleteAddress 
} = require('../controllers/userController');

// 2. Import Middleware
const { protect } = require('../middleware/authMiddleware');

// --- AUTHENTICATION ROUTES ---

// Register: POST /api/users/register
router.post('/register', registerUser);

// Login: POST /api/users/login
router.post('/login', authUser);

// --- PROFILE ROUTES ---

// Get/Update Profile: GET/PUT /api/users/profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// --- ADDRESS ROUTES ---

// Add Address: POST /api/users/address
router.route('/address').post(protect, addAddress);

// Update/Delete Address: PUT/DELETE /api/users/address/:id
router.route('/address/:id')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

module.exports = router;