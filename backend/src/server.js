const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Middleware Imports
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const userRoutes = require('./routes/userRoutes');

// 1. Config & Database
dotenv.config();
connectDB();

const app = express();

// 2. Essential Middleware
// ✅ UPDATED CORS: Prepared for Production (Railway/Vercel)
app.use(cors({
  origin: "*", // Allows any domain (Localhost & Vercel) to access the API. 
  // Once you have your Vercel URL, you can replace "*" with ["https://your-app.vercel.app"] for better security.
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json()); // Parses JSON bodies (req.body)

// 3. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes); 

// 4. Custom Error Handling (Must be after routes)
app.use(notFound); // 404 handler
app.use(errorHandler); // 500 handler

// 5. Start Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  🚀 Maryland Pharmacy Server is Running!
  ---------------------------------------
  🔥 Mode:      ${process.env.NODE_ENV || 'development'}
  🔌 Port:      ${PORT}
  🔗 Database:  Connected
  `);
});

module.exports = { app, server };