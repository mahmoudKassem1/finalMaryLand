const User = require('../models/User'); // Ensure filename matches case (User.js vs user.js)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Built into Node.js
const sendEmail = require('../utils/sendEmail'); // Adjust path if your sendEmail is in a different folder

// Helper: Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- AUTHENTICATION CONTROLLERS ---

// @desc    Register a new user
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  let { name, email, password, phone, street, aptNumber, city } = req.body;

  email = email.toLowerCase();

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const initialAddress = {
      street: street,
      aptNumber: aptNumber || '',
      city: city || 'Alexandria',
      phone: phone, 
      isDefault: true
    };

    const user = await User.create({
      name,
      email,
      password,
      phone,
      addresses: [initialAddress] 
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.role === 'admin',
        addresses: user.addresses, 
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Register Error:", error); 
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
const authUser = async (req, res) => {
  let { email, password } = req.body;

  email = email.toLowerCase();

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAdmin: user.role === 'admin',
        token: generateToken(user._id),
        addresses: user.addresses 
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- PROFILE CONTROLLERS ---

// @desc    Get user profile
// @route   GET /api/users/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses,
        role: user.role,
        isAdmin: user.role === 'admin',
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;

      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = req.body.email.toLowerCase();
      }

      if (req.body.addresses) {
        user.addresses = req.body.addresses;
        user.markModified('addresses');
      }

      if (req.body.password) {
        if (!req.body.oldPassword) {
          return res.status(400).json({ message: 'Old password is required to set a new one' });
        }
        const isMatch = await user.matchPassword(req.body.oldPassword);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid old password' });
        }
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        addresses: updatedUser.addresses,
        role: updatedUser.role,
        isAdmin: updatedUser.role === 'admin',
        token: generateToken(updatedUser._id),
      });
      
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// --- ADDRESS CONTROLLERS ---

// @desc    Add new address
// @route   POST /api/users/address
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.addresses.push(req.body);
      await user.save();
      res.status(201).json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding address' });
  }
};

// @desc    Update address
// @route   PUT /api/users/address/:id
const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      const address = user.addresses.id(req.params.id);
      
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }

      address.street = req.body.street || address.street;
      address.city = req.body.city || address.city;
      address.phone = req.body.phone || address.phone;

      await user.save();
      res.json(user.addresses);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating address' });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:id
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.addresses.pull({ _id: req.params.id }); 
      await user.save();
      res.json(user.addresses);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address' });
  }
};

// --- PASSWORD RESET CONTROLLERS ---

// @desc    Forgot Password - Generates token and sends email
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    // 1. Generate a raw random token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 2. Hash the token and save it to the database
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // 3. Set expiration to 10 minutes from now
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // 4. Create the reset URL pulling from the environment variable
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // 5. Send the email
    const message = `You have requested a password reset for your Maryland Pharmacy account. Please click the button below to set a new password.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Maryland Pharmacy - Password Reset',
        message: message,
        ctaUrl: resetUrl,
        ctaText: 'Reset My Password'
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      // If email fails, wipe the token from the database
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Email Error:", error);
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password - Verifies token and saves new password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // 1. Re-hash the token from the URL to compare it with the DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    // 2. Find user by token AND ensure the token hasn't expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // 3. Set the new password
    user.password = req.body.password;

    // 4. Wipe the reset tokens from the database
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  forgotPassword,
  resetPassword
};