const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Sub-schema for multiple addresses
const addressSchema = mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  aptNumber: { type: String }, 
  phone: { type: String }, // Specific contact for this address
  isDefault: { type: Boolean, default: false }
});

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // ✅ Root Phone: Required for the main profile info
    phone: { type: String, required: false, default: '' },
    
    role: { type: String, default: 'client' },
    
    // ⚠️ OLD FIELD (Keep for backward compatibility)
    address: {
      street: { type: String },
      city: { type: String },
      aptNumber: { type: String }
    },

    // ✅ NEW FIELD: Array of Addresses
    addresses: [addressSchema],
    
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);