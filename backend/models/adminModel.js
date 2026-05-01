const db = require('../config/db');

const Admin = {
    create: async (adminData) => {
        const { username, email, password_hash, full_name } = adminData;
        const [result] = await db.execute(
            'INSERT INTO admins (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, full_name]
        );
        return result.insertId;
    },

    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
        return rows[0];
    }
};

module.exports = Admin;
