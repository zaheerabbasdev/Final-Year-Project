const rateLimit = require('express-rate-limit');

// Brute-force protection for login/credential-checking endpoints
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts. Please try again later.' }
});

// OTP is a 6-digit code — limit guesses per window
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP attempts. Please try again later.' }
});

module.exports = { loginLimiter, otpLimiter };
