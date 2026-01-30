const express = require('express');
const router = express.Router();
const { adminLogin, getDashboardStats } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminMiddleware');

// @route   POST /api/admin/login
// @desc    Admin authentication (Hardcoded credentials)
// @access  Public (Anyone can TRY to login, but only valid creds work)
router.post('/login', adminLogin);

// @route   GET /api/admin/stats
// @desc    Get Financial Dashboard Data (Sales, Orders, etc.)
// @access  Private (Admin Only)
router.get('/stats', adminProtect, getDashboardStats);

module.exports = router;