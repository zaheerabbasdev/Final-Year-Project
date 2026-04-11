const db = require('../config/db');

const getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

module.exports = { getAllCategories };
