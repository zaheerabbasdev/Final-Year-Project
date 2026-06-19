const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ProviderProfile = require('../models/providerModel');
const db = require('../config/db');
const mailer = require('../utils/mailer');

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
            req.files.forEach(file => {
                if (file.fieldname === 'avatar') avatarUrl = `/uploads/${file.filename}`;
                if (file.fieldname === 'cnic') cnicUrl = `/uploads/${file.filename}`;
                if (file.fieldname === 'certificates') certificatesUrl = `/uploads/${file.filename}`;
            });
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
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
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

module.exports = { register, login, verifyOTP };
