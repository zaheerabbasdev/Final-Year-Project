const db = require('../config/db');

const getStats = async (req, res) => {
    try {
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        const [jobCount] = await db.execute('SELECT COUNT(*) as count FROM jobs');
        const [bidCount] = await db.execute('SELECT COUNT(*) as count FROM bids');
        const [activeJobs] = await db.execute('SELECT COUNT(*) as count FROM jobs WHERE status = "active"');

        res.json({
            users: userCount[0].count,
            jobs: jobCount[0].count,
            bids: bidCount[0].count,
            activeJobs: activeJobs[0].count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching admin stats' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, full_name, email, role, created_at FROM users');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

module.exports = { getStats, getAllUsers };
