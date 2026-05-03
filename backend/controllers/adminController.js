const db = require('../config/db');
const Admin = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerAdmin = async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        const password_hash = await bcrypt.hash(password, 10);
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
        
        // Calculate Revenue (Example: 10% of all completed jobs)
        const [revenueData] = await db.execute('SELECT SUM(budget) * 0.1 as total FROM jobs WHERE status = "completed"');

        res.json({
            users: userCount[0].count,
            jobs: jobCount[0].count,
            bids: bidCount[0].count,
            activeJobs: activeJobs[0].count,
            revenue: revenueData[0].total || 0
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
        res.json({ message: `User status updated to ${status}` });
    } catch (error) {
        console.error("ADMIN_DEBUG_ERROR:", error);
        res.status(500).json({ message: 'Error updating user status' });
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
    registerAdmin, loginAdmin, getStats, getAllUsers, deleteUser, getUserDetails, updateUserStatus,
    getAllJobs, deleteJob, getAllBids, getAllCategories, createCategory, deleteCategory 
};
