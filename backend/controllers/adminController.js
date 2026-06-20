const db = require('../config/db');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const mailer = require('../utils/mailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createNotification } = require('../services/notificationService');

const registerAdmin = async (req, res) => {
    try {
        const { username, email, password, full_name, setupKey } = req.body;

        if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
            return res.status(403).json({ message: 'Invalid or missing setup key' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const adminId = await Admin.create({ username, email, password_hash, full_name });
        res.status(201).json({ message: 'Admin registered successfully', adminId });
    } catch (error) {
        res.status(500).json({ message: 'Error registering admin' });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findByEmail(email);
        if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ 
            token, 
            admin: { 
                id: admin.id, 
                username: admin.username, 
                full_name: admin.full_name,
                email: admin.email 
            } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed' });
    }
};

const getStats = async (req, res) => {
    try {
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [jobCount] = await db.execute('SELECT COUNT(*) as count FROM jobs');
        const [bidCount] = await db.execute('SELECT COUNT(*) as count FROM bids');
        const [activeJobs] = await db.execute('SELECT COUNT(*) as count FROM jobs WHERE status = "active"');

        const [categoryCount] = await db.execute('SELECT COUNT(*) as count FROM categories');

        const [userGrowth] = await db.execute(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `);

        const [categoryPopularity] = await db.execute(`
            SELECT c.name, COUNT(j.id) as count
            FROM categories c
            LEFT JOIN jobs j ON j.category_id = c.id
            GROUP BY c.id, c.name
            ORDER BY count DESC
            LIMIT 5
        `);

        res.json({
            users: userCount[0].count,
            jobs: jobCount[0].count,
            bids: bidCount[0].count,
            activeJobs: activeJobs[0].count,
            categories: categoryCount[0].count,
            userGrowth,
            categoryPopularity
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        console.log(`ADMIN_DEBUG: Fetching users with role filter: [${role}]`);
        
        let query = 'SELECT id, full_name, email, role, status, created_at FROM users';
        const params = [];
        
        if (role && role !== 'all') {
            query += ' WHERE role = ?';
            params.push(role);
        }
        
        const [rows] = await db.execute(query, params);
        res.json(rows);
    } catch (error) {
        console.error("ADMIN_DEBUG_ERROR:", error);
        res.status(500).json({ message: 'Error fetching users' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.execute('SELECT id, full_name, email, phone, role, status, avatar, created_at FROM users WHERE id = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        
        if (user.role === 'provider') {
            const [profiles] = await db.execute(`
                SELECT p.*, c.name as category_name 
                FROM provider_profiles p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.user_id = ?
            `, [id]);
            if (profiles.length > 0) {
                user.profile = profiles[0];
            }
        }
        
        res.json(user);
    } catch (error) {
        console.error("ADMIN_DEBUG_ERROR:", error);
        res.status(500).json({ message: 'Error fetching user details' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;
        
        if (!['pending', 'verified', 'rejected', 'blocked'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        
        await db.execute('UPDATE users SET status = ?, status_reason = ? WHERE id = ?', [status, reason || null, id]);

        // Send email notification (Non-blocking)
        User.findById(id).then(user => {
            if (user && user.email) {
                mailer.sendStatusNotification(user.email, status, reason);
            }
        }).catch(err => console.error('Email Notification Error:', err));

        // If this user is being suspended, proactively notify anyone with an active
        // booking against them — the system doesn't auto-cancel (the work may be
        // nearly done), but the other party should know right away rather than
        // waiting on an unresponsive customer/provider before deciding to cancel.
        if (status === 'blocked') {
            db.execute(
                `SELECT b.id, b.job_id, b.customer_id, b.provider_id, j.title as job_title
                 FROM bookings b
                 JOIN jobs j ON b.job_id = j.id
                 WHERE (b.customer_id = ? OR b.provider_id = ?)
                   AND b.status IN ('confirmed', 'in_progress')`,
                [id, id]
            ).then(([bookings]) => {
                for (const booking of bookings) {
                    const otherPartyId = Number(booking.customer_id) === Number(id) ? booking.provider_id : booking.customer_id;
                    createNotification(
                        otherPartyId,
                        'Booking Affected by Account Suspension',
                        `The other party on "${booking.job_title}" has had their account suspended. You may want to cancel this booking to find a replacement.`,
                        'booking_party_suspended'
                    );
                }
            }).catch(err => console.error('Error notifying affected bookings:', err));
        }

        res.json({ message: `User status updated to ${status}` });
    } catch (error) {
        console.error("ADMIN_DEBUG_ERROR:", error);
        res.status(500).json({ message: 'Error updating user status' });
    }
};

const autoVerifyProvider = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.execute('SELECT full_name, email FROM users WHERE id = ? AND role = "provider"', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        
        const [profiles] = await db.execute('SELECT cnic_url FROM provider_profiles WHERE user_id = ?', [id]);
        if (profiles.length === 0 || !profiles[0].cnic_url) {
            return res.status(400).json({ message: 'No CNIC document uploaded' });
        }

        const user = users[0];
        const profile = profiles[0];

        const aiService = require('../services/aiService');
        const verificationResult = await aiService.verifyDocument(profile.cnic_url, {
            full_name: user.full_name,
            email: user.email
        });

        await db.execute(
            'UPDATE provider_profiles SET ai_confidence_score = ?, ai_verification_notes = ? WHERE user_id = ?',
            [verificationResult.confidence, verificationResult.notes, id]
        );

        res.json({ 
            message: 'AI verification completed', 
            confidence: verificationResult.confidence,
            notes: verificationResult.notes
        });
    } catch (error) {
        console.error("ADMIN_DEBUG_ERROR:", error);
        res.status(500).json({ message: 'Error running AI verification' });
    }
};

const getAllJobs = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT j.*, c.name as category_name, u.full_name as customer_name 
            FROM jobs j 
            JOIN categories c ON j.category_id = c.id 
            JOIN users u ON j.customer_id = u.id
            ORDER BY j.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM jobs WHERE id = ?', [id]);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job' });
    }
};

const summarizeJobDispute = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if summary already exists
        const [jobs] = await db.execute('SELECT ai_dispute_summary FROM jobs WHERE id = ?', [id]);
        if (jobs.length === 0) {
            return res.status(404).json({ message: 'Job not found' });
        }
        
        if (jobs[0].ai_dispute_summary) {
            return res.json({ summary: jobs[0].ai_dispute_summary });
        }

        const aiService = require('../services/aiService');
        const summary = await aiService.summarizeDispute(id);

        if (summary) {
            await db.execute('UPDATE jobs SET ai_dispute_summary = ? WHERE id = ?', [summary, id]);
        }

        res.json({ summary });
    } catch (error) {
        console.error("ADMIN_DEBUG_ERROR:", error);
        res.status(500).json({ message: 'Error summarizing dispute' });
    }
};

const getAllBids = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT b.*, j.title as job_title, u.full_name as provider_name 
            FROM bids b 
            JOIN jobs j ON b.job_id = j.id 
            JOIN users u ON b.provider_id = u.id
            ORDER BY b.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bids' });
    }
};

const getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        await db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
        res.status(201).json({ message: 'Category created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category' });
    }
};

module.exports = { 
    registerAdmin, loginAdmin, getStats, getAllUsers, deleteUser, getUserDetails, updateUserStatus, autoVerifyProvider,
    getAllJobs, deleteJob, summarizeJobDispute, getAllBids, getAllCategories, createCategory, deleteCategory 
};
