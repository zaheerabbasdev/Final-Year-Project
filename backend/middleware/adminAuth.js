const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');

const adminAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No admin token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify that this is an admin from the admins table
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(403).json({ message: 'Access denied: Admin only' });
        }
        
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired admin token' });
    }
};

module.exports = adminAuth;
