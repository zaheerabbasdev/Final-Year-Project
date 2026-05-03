const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch latest status from database
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User no longer exists' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({ message: 'Your application has been rejected by the admin.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user || (roles.length && !roles.includes(req.user.role))) {
            return res.status(403).json({ message: 'Forbidden: Unauthorized access' });
        }
        next();
    };
};

module.exports = { authMiddleware, authorize };
