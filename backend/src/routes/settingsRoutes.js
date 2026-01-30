const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { adminProtect } = require('../middleware/adminMiddleware');

// Public Route: Anyone can check the delivery fee (needed for Checkout)
router.get('/', getSettings);

// Protected Route: Only Admins can change it
router.put('/', adminProtect, updateSettings);

module.exports = router;