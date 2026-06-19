const express = require('express');
const router = express.Router();
const { register, login, verifyOTP } = require('../controllers/authController');
const upload = require('../middleware/upload');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/register', upload.any(), register);
router.post('/login', loginLimiter, login);
router.post('/verify-otp', otpLimiter, verifyOTP);

module.exports = router;
