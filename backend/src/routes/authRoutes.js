const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { 
  loginUser, 
  forgetPassword,
  resetPassword,
  startRegistration,
  verifyRegistration,
} = require('../controllers/authController');
const registrationStartLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const registrationVerifyLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

// @route   POST /api/auth/signup
// @desc    Register a new client (with address)
// @access  Public
router.post('/signup', registrationStartLimit, startRegistration);
router.post('/signup/verify', registrationVerifyLimit, verifyRegistration);

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
