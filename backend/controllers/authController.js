const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ProviderProfile = require('../models/providerModel');
const db = require('../config/db');
const mailer = require('../utils/mailer');
const { uploadToS3 } = require('../utils/s3');

const register = async (req, res) => {
    try {
        const { full_name, email, phone, password, role, experience_years } = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        let avatarUrl = null;
        let cnicUrl = null;
        let certificatesUrl = null;

        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                const url = await uploadToS3(file.buffer, file.originalname, file.fieldname);
                if (file.fieldname === 'avatar')       avatarUrl       = url;
                if (file.fieldname === 'cnic')         cnicUrl         = url;
                if (file.fieldname === 'certificates') certificatesUrl = url;
            }
        }

        let otpCode = null;
        let otpExpiry = null;
        let userRole = role || 'customer';

        if (userRole === 'customer') {
            otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
            otpExpiry = new Date(Date.now() + 10 * 60000); // 10 mins expiry
        }

        // Create user
        const userId = await User.create({
            full_name,
            email,
            phone,
            password_hash,
            role: userRole,
            avatar: avatarUrl,
            status: 'pending',
            otp_code: otpCode,
            otp_expiry: otpExpiry
        });

        // If provider, create profile
        if (role === 'provider') {
            const { category_id } = req.body;
            await ProviderProfile.create(userId, { 
                experience_years: parseInt(experience_years) || 0,
                category_id: category_id ? parseInt(category_id) : null,
                cnic_url: cnicUrl,
                certificates_url: certificatesUrl
            });
        }

        if (userRole === 'customer' && otpCode) {
            await mailer.sendOTP(email, otpCode);
            res.status(201).json({ message: 'User registered. Please check your email for the OTP.', userId, requiresOTP: true });
        } else {
            res.status(201).json({ message: 'Provider registered successfully. Please wait for admin approval.', userId, requiresOTP: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const verifiedUser = await User.verifyOTP(email, otp);
        if (verifiedUser) {
            res.json({ message: 'Email verified successfully. You can now login.' });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check user status
        if (user.status === 'pending') {
            if (user.role === 'customer') {
                return res.status(403).json({ message: 'Please verify your email to login.', requiresOTP: true });
            } else {
                return res.status(403).json({ message: 'Your account is pending admin approval.' });
            }
        }
        if (user.status === 'rejected') {
            const reason = user.status_reason ? `: ${user.status_reason}` : '';
            return res.status(403).json({ message: `Your application has been rejected by the admin${reason}` });
        }
        if (user.status === 'blocked') {
            const reason = user.status_reason ? `: ${user.status_reason}` : '';
            return res.status(403).json({ message: `Your account has been suspended. Please contact support${reason}` });
        }

        const payload = {
            id: user.id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '7d'
        });

        // Build user response with full data
        const userInfo = { ...user };
        delete userInfo.password_hash;

        if (userInfo.role === 'provider') {
            const profile = await ProviderProfile.findByUserId(user.id);
            userInfo.profile = profile || {};
        }

        res.json({ token, user: userInfo });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// ── Forgot Password ────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const user = await User.findByEmail(email);
        if (!user) {
            // Return 200 so we don't leak which emails are registered
            return res.json({ message: 'If that email exists, a reset code has been sent.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60000); // 10 mins

        await db.execute(
            'UPDATE users SET otp_code=?, otp_expiry=? WHERE id=?',
            [otp, expiry, user.id]
        );

        await mailer.sendPasswordResetOTP(email, otp);

        res.json({ message: 'If that email exists, a reset code has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── Reset Password ─────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP and new password are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const [rows] = await db.execute(
            'SELECT id, otp_code, otp_expiry FROM users WHERE LOWER(email)=LOWER(?)',
            [email]
        );
        const user = rows[0];

        if (!user || user.otp_code !== otp) {
            return res.status(400).json({ message: 'Invalid or expired reset code.' });
        }
        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
        }

        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(newPassword, salt);

        await db.execute(
            'UPDATE users SET password_hash=?, otp_code=NULL, otp_expiry=NULL WHERE id=?',
            [password_hash, user.id]
        );

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// ── Resend OTP ─────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`[resendOTP] Request for email: ${email}`);

        if (!email) return res.status(400).json({ message: 'Email is required.' });

        const user = await User.findByEmail(email);
        if (!user) {
            console.log(`[resendOTP] No user found for: ${email}`);
            return res.json({ message: 'If that email exists and is unverified, a new code has been sent.' });
        }

        console.log(`[resendOTP] User found: id=${user.id}, status=${user.status}, role=${user.role}`);

        if (user.status !== 'pending' || user.role !== 'customer') {
            console.log(`[resendOTP] Skipped — status=${user.status}, role=${user.role}`);
            return res.status(400).json({ message: 'This account does not require email verification.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60000); // 10 mins

        await db.execute(
            'UPDATE users SET otp_code=?, otp_expiry=? WHERE id=?',
            [otp, expiry, user.id]
        );

        const sent = await mailer.sendOTP(email, otp);
        if (!sent) {
            console.error(`[resendOTP] mailer.sendOTP returned false for: ${email}`);
            return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
        }

        console.log(`[resendOTP] OTP sent successfully to: ${email}`);
        res.json({ message: 'A new verification code has been sent to your email.' });
    } catch (error) {
        console.error('[resendOTP] Error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

module.exports = { register, login, verifyOTP, forgotPassword, resetPassword, resendOTP };
