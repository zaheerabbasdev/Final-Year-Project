const express = require('express');
const router = express.Router();
const { register, login, verifyOTP, forgotPassword, resetPassword, resendOTP } = require('../controllers/authController');
const upload = require('../middleware/upload');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/register', upload.any(), register);
router.post('/login', loginLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
