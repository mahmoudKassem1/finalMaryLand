const Setting = require('../models/Setting');

// @desc    Get settings
// @route   GET /api/settings
const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      // Create default if doesn't exist
      settings = await Setting.create({ deliveryFee: 30, notificationEmails: [] });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
const updateSettings = async (req, res) => {
  const { deliveryFee, notificationEmails } = req.body;

  try {
    let settings = await Setting.findOne();

    if (settings) {
      settings.deliveryFee = deliveryFee;
      // ✅ Update emails (Ensure max 3 in backend too)
      settings.notificationEmails = notificationEmails ? notificationEmails.slice(0, 3) : settings.notificationEmails;
      
      const updatedSettings = await settings.save();
      res.json(updatedSettings);
    } else {
      res.status(404).json({ message: 'Settings not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
};

module.exports = { getSettings, updateSettings };