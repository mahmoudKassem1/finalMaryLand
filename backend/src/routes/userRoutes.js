const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// 1. Import ALL Controller Functions (Auth + Profile + Address)
const { 
  authUser, 
  getUserProfile, 
  updateUserProfile,
  addAddress, 
  updateAddress, 
  deleteAddress 
} = require('../controllers/userController');

// 2. Import Middleware
const { protect } = require('../middleware/authMiddleware');
const { startRegistration, verifyRegistration } = require('../controllers/authController');
const registrationStartLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const registrationVerifyLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// --- AUTHENTICATION ROUTES ---

// Register: POST /api/users/register
router.post('/register', registrationStartLimit, startRegistration);
router.post('/register/verify', registrationVerifyLimit, verifyRegistration);

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
