const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const ProviderProfile = require('../models/providerModel');
const db = require('../config/db');

const register = async (req, res) => {
    try {
        const { full_name, email, phone, password, role, experience_years } = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        let avatarUrl = null;
        let cnicUrl = null;
        let certificatesUrl = null;

        console.log('DEBUG: Register Body:', req.body);
        console.log('DEBUG: Register Files:', req.files);

        if (req.files && Array.isArray(req.files)) {
            req.files.forEach(file => {
                if (file.fieldname === 'avatar') avatarUrl = `/uploads/${file.filename}`;
                if (file.fieldname === 'cnic') cnicUrl = `/uploads/${file.filename}`;
                if (file.fieldname === 'certificates') certificatesUrl = `/uploads/${file.filename}`;
            });
        }

        // Create user
        const userId = await User.create({
            full_name,
            email,
            phone,
            password_hash,
            role: role || 'customer',
            avatar: avatarUrl,
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

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
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

module.exports = { register, login };
