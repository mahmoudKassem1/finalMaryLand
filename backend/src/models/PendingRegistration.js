const mongoose = require('mongoose');

const pendingRegistrationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '' },
  gender: String,
  street: String,
  aptNumber: String,
  city: { type: String, default: 'Alexandria' },
  phoneConfirmed: { type: Boolean, required: true },
  otpHash: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 900 },
});

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
