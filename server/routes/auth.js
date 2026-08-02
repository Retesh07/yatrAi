const express = require('express');
const router = express.Router();
const { register, login, logout, refreshToken, changePassword, requestPasswordReset, confirmPasswordReset, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);  // protect required — logout needs req.user
router.post('/refresh', refreshToken);
router.put('/password', protect, changePassword);
router.post('/reset-password', requestPasswordReset);
router.post('/reset-password/confirm', confirmPasswordReset);
router.delete('/account', protect, deleteAccount);

module.exports = router;