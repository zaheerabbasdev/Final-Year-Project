const express = require('express');
const router = express.Router();
const { register, login, verifyOTP } = require('../controllers/authController');
const upload = require('../middleware/upload');

router.post('/register', upload.any(), register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);

module.exports = router;
