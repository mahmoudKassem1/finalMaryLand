const mongoose = require('mongoose');

const settingSchema = mongoose.Schema({
  deliveryFee: {
    type: Number,
    required: true,
    default: 30,
  },
  // ✅ NEW FIELD: Array of strings for emails
  notificationEmails: {
    type: [String], 
    default: [] 
  }
}, {
  timestamps: true,
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;