const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  forgetPassword,
  resetPassword 
} = require('../controllers/authController');

// @route   POST /api/auth/signup
// @desc    Register a new client (with address)
// @access  Public
router.post('/signup', registerUser);

// @route   POST /api/auth/login
// @desc    Client login & token generation
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/forget-password
// @desc    Generate password reset token (Sends Email)
// @access  Public
router.post('/forget-password', forgetPassword);

// @route   PUT /api/auth/reset-password/:resettoken
// @desc    Set new password using the token from email
// @access  Public
// ✅ FIX: Added hyphen to match Frontend request
router.put('/reset-password/:resettoken', resetPassword); 

module.exports = router;