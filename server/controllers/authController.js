const User = require('../models/User');
const Trip = require('../models/Trip');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate Access Token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

const generateOtp = () => {
  return String(crypto.randomInt(100000, 1000000)).padStart(6, '0');
};

// @route   POST /api/v1/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Hash password manually — avoids any pre-save hook issues
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please login.'
    });

  } catch (error) {
    console.error('❌ REGISTER ERROR:', error.message);
    console.error(error.stack);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   POST /api/v1/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token directly — avoids triggering pre save
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   POST /api/v1/auth/logout
const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.clearCookie('refreshToken');
    res.status(200).json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @route   POST /api/v1/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or reused refresh token'
      });
    }

    // Refresh Token Rotation: Issue NEW Access Token + NEW Refresh Token
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update user record with rotated refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    // Set updated httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      accessToken
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Refresh token expired or invalid, please login again'
    });
  }
};

// @route   PUT /api/v1/auth/password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/v1/auth/reset-password
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    await PasswordResetToken.deleteMany({ userId: user._id });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      otpHash,
      expiresAt
    });

    await sendPasswordResetEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset code has been sent.'
    });
  } catch (error) {
    console.error('❌ PASSWORD RESET REQUEST ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/v1/auth/reset-password/confirm
const confirmPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, reset code, and new password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code or email'
      });
    }

    const tokenDoc = await PasswordResetToken.findOne({ userId: user._id });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset code is invalid or has expired'
      });
    }

    const isMatch = await bcrypt.compare(otp, tokenDoc.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Reset code is invalid or has expired'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.refreshToken = null;
    await user.save();

    await PasswordResetToken.deleteMany({ userId: user._id });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.'
    });
  } catch (error) {
    console.error('❌ PASSWORD RESET CONFIRM ERROR:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/v1/auth/account
const deleteAccount = async (req, res) => {
  try {
    await Trip.deleteMany({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  changePassword,
  requestPasswordReset,
  confirmPasswordReset,
  deleteAccount,
};