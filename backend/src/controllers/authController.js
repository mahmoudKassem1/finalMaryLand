const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const PendingRegistration = require('../models/PendingRegistration');

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const startRegistration = async (req, res) => {
  try {
    const { name, email, password, phone, gender, street, aptNumber, city, phoneConfirmed } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !password || password.length < 6 || phoneConfirmed !== true) {
      return res.status(400).json({ message: 'Enter valid details, use a password of at least 6 characters, and confirm your phone number.' });
    }
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'User already exists' });
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const [passwordHash] = await Promise.all([bcrypt.hash(password, 10)]);
    await PendingRegistration.findOneAndUpdate({ email: normalizedEmail }, {
      name: name.trim(), passwordHash, phone: phone || '', gender, street, aptNumber, city: city || 'Alexandria', phoneConfirmed: true,
      otpHash: hashOtp(otp), otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0, createdAt: new Date(),
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const html = `<div dir="auto" style="font-family:Arial,sans-serif;text-align:center"><h2>Verify your email / تأكيد بريدك الإلكتروني</h2><p>Your Maryland Pharmacy verification code / رمز التحقق الخاص بك:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. If you did not request it, ignore this email.</p><p dir="rtl">تنتهي صلاحية هذا الرمز خلال ١٠ دقائق. إذا لم تطلبه، فتجاهل هذه الرسالة.</p></div>`;
    const sent = await sendEmail({ email: normalizedEmail, subject: 'Verify your Maryland Pharmacy account | تأكيد حسابك', html });
    if (!sent.success) { await PendingRegistration.deleteOne({ email: normalizedEmail }); return res.status(502).json({ message: 'Verification email could not be sent. Please try again.' }); }
    return res.status(200).json({ success: true, message: 'Verification code sent' });
  } catch (error) { return res.status(500).json({ message: 'Could not start registration' }); }
};

const verifyRegistration = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const pending = await PendingRegistration.findOne({ email });
    if (!pending || pending.otpExpiresAt <= new Date() || pending.attempts >= 5) return res.status(400).json({ message: 'Code expired or invalid. Please request a new one.' });
    if (!/^\d{6}$/.test(otp) || !crypto.timingSafeEqual(Buffer.from(pending.otpHash), Buffer.from(hashOtp(otp)))) {
      pending.attempts += 1; await pending.save();
      return res.status(400).json({ message: 'Incorrect verification code' });
    }
    const initialAddress = { street: pending.street || '', aptNumber: pending.aptNumber || '', city: pending.city || 'Alexandria', phone: pending.phone, isDefault: true };
    const user = new User({ name: pending.name, email: pending.email, password: pending.passwordHash, phone: pending.phone, gender: pending.gender, address: initialAddress, addresses: [initialAddress], emailVerified: true, phoneConfirmed: pending.phoneConfirmed });
    user.password = pending.passwordHash;
    user.$isNew = false;
    await User.collection.insertOne(user.toObject());
    await PendingRegistration.deleteOne({ _id: pending._id });
    return res.status(201).json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, addresses: user.addresses, address: user.address, role: user.role, token: generateToken(user._id) });
  } catch (error) { return res.status(500).json({ message: 'Could not verify email' }); }
};

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

    const frontendUrl = process.env.FRONTEND_URL || 'https://www.marylandpharmacy.net';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    // Simple text message (The HTML template handles the styling now)
    const message = `You have requested a password reset for your Maryland Pharmacy account. Please click the button below to set a new password.`;

    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: message,     // Passed to the utility
        ctaText: 'Reset My Password', // ✅ Button Text
        ctaUrl: resetUrl      // ✅ Button Link (This triggers the red button in the email)
      });

      if (!emailResult.success) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        return res.status(502).json({
          message: emailResult.error || 'Email could not be sent',
        });
      }

      res.status(200).json({ success: true, data: 'Email sent successfully' });
    } catch (error) {
      console.error('Password reset email failed:', error.message);
      
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

module.exports = { registerUser, loginUser, forgetPassword, resetPassword, startRegistration, verifyRegistration };
