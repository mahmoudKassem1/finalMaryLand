const User = require('../models/User'); // Ensure filename matches case (User.js vs user.js)
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  let { name, email, password, phone } = req.body;

  // ✅ Fix 1: Normalize email to lowercase
  email = email.toLowerCase();

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.role === 'admin',
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Register Error:", error); // Log for debugging
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
const authUser = async (req, res) => {
  let { email, password } = req.body;

  // ✅ Fix 1: Normalize email to lowercase
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

      // ✅ Fix 2: Check if new email is already taken
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email.toLowerCase() });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = req.body.email.toLowerCase();
      }

      // Update addresses array
      if (req.body.addresses) {
        user.addresses = req.body.addresses;
        user.markModified('addresses');
      }

      // Update password if provided
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
      // Return only the new address or the full list? Usually full list is safer for state sync.
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
      
      // ✅ Fix 3: Ensure address exists
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }

      address.street = req.body.street || address.street;
      address.city = req.body.city || address.city;
      address.phone = req.body.phone || address.phone;
      // Add other fields if your address schema has them (e.g. state, zip)

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
      // Use Mongoose pull method for cleaner deletion by ID
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

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  addAddress,
  updateAddress,
  deleteAddress
};