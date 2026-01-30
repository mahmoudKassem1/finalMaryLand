const Order = require('../models/Order');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Setting = require('../models/Setting');
// Helper: Generate Admin-Specific JWT
const generateAdminToken = (email) => {
  return jwt.sign({ email, role: 'admin' }, process.env.ADMIN_JWT_SECRET, { 
    expiresIn: '1d' // Shorter duration for admin security
  });
};

// @desc    Admin Login (Hardcoded Credentials)
// @route   POST /api/admin/login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Security: Compare against .env variables
  const isAdminEmailMatch = email === process.env.ADMIN_EMAIL;
  
  // In production, we'd compare against a hash. 
  // For your project: bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH)
  const isAdminPassMatch = password === process.env.ADMIN_PASS;

  if (isAdminEmailMatch && isAdminPassMatch) {
    res.json({
      email: process.env.ADMIN_EMAIL,
      role: 'admin',
      token: generateAdminToken(email),
    });
  } else {
    res.status(401).json({ message: 'Unauthorized: Invalid Admin Credentials' });
  }
};

// @desc    Get Financial Stats (Total, Monthly, Yearly)
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // 1. Total Sales (All time)
    const totalSales = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // 2. Monthly Sales
    const monthlySales = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // 3. Yearly Sales
    const yearlySales = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // 4. Total Orders count
    const totalOrdersCount = await Order.countDocuments();

    res.json({
      totalSales: totalSales[0]?.total || 0,
      monthlySales: monthlySales[0]?.total || 0,
      yearlySales: yearlySales[0]?.total || 0,
      totalOrders: totalOrdersCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching financial data' });
  }
};

module.exports = { adminLogin, getDashboardStats };