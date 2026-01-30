const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/signup
const registerUser = async (req, res) => {
  const { name, email, password, phone, gender, street, aptNumber, city } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // 1. Create the first address object structure
    const initialAddress = {
      street,
      aptNumber,
      city: city || 'Alexandria', // Default to Alexandria if missing
      phone: phone,
      isDefault: true
    };

    const user = await User.create({
      name,
      email,
      password,
      phone,
      gender,
      // 2. Save to Legacy Field (for backward compatibility)
      address: initialAddress, 
      // 3. Save to New Array (for multiple address support)
      addresses: [initialAddress] 
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses, // ✅ Send Array
        address: user.address,     // Keep legacy support
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses, // ✅ Send Array
        address: user.address,     // Keep legacy support
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forget Password (Send Reset Email)
// @route   POST /api/auth/forgetpassword
const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate Token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save to DB
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    // ✅ FIX: Use CLIENT_URL (React) instead of localhost:3000
    // If process.env.CLIENT_URL is not set, it defaults to http://localhost:5173
    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    // Simple text message (The HTML template handles the styling now)
    const message = `You have requested a password reset for your Maryland Pharmacy account. Please click the button below to set a new password.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: message,     // Passed to the utility
        ctaText: 'Reset My Password', // ✅ Button Text
        ctaUrl: resetUrl      // ✅ Button Link (This triggers the red button in the email)
      });

      res.status(200).json({ success: true, data: 'Email sent successfully' });
    } catch (error) {
      console.error("❌ Nodemailer Error:", error);
      
      // Rollback changes if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
const resetPassword = async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or Expired Token' });
    }

    // Set new password
    user.password = req.body.password;
    
    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Password Updated Successfully',
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, forgetPassword, resetPassword };