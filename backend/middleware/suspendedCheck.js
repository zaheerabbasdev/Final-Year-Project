const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const suspendedCheck = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (user) {
                console.log(`[SuspendedCheck] User ${user.id} status: ${user.status}`);
                if (user.status === 'blocked') {
                    console.log(`[SuspendedCheck] Blocking suspended user ${user.id}`);
                    return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
                }
                if (user.status === 'rejected') {
                    console.log(`[SuspendedCheck] Blocking rejected provider ${user.id}`);
                    return res.status(403).json({ message: 'Your application has been rejected by the admin.' });
                }
            }
        } catch (err) {
            // Ignore invalid tokens here, authMiddleware will catch them if needed
        }
    }
    next();
};

module.exports = suspendedCheck;
