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

// @desc    Get Operational & Inquiry Stats (Total, Monthly, Yearly, Fulfillment)
// @route   GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // 1. Total Inquiries/Orders count (All time)
    const totalOrdersCount = await Order.countDocuments();

    // 2. Monthly Inquiries count
    const monthlyOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // 3. Yearly Inquiries count
    const yearlyOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startOfYear }
    });

    // 4. Pending Confirmation (Waiting for WhatsApp follow-up)
    const pendingInquiriesCount = await Order.countDocuments({
      status: 'Inquiry Received'
    });

    // 5. Successfully Delivered Orders
    const deliveredOrdersCount = await Order.countDocuments({
      status: 'Delivered'
    });

    res.json({
      // Inquiry & Order Metrics
      totalOrders: totalOrdersCount,
      monthlyOrders: monthlyOrdersCount,
      yearlyOrders: yearlyOrdersCount,
      pendingInquiries: pendingInquiriesCount,
      deliveredOrders: deliveredOrdersCount,

      // Backwards-compatibility aliases for frontend widgets expecting these keys:
      totalSales: totalOrdersCount,
      monthlySales: monthlyOrdersCount,
      yearlySales: yearlyOrdersCount
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: 'Error fetching operational data' });
  }
};

module.exports = { adminLogin, getDashboardStats };