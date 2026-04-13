const db = require('../config/db');

const User = {
    create: async (userData) => {
        const { full_name, email, phone, password_hash, role, avatar, latitude, longitude } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, phone, password_hash, role, avatar, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, password_hash, role, avatar || null, latitude || null, longitude || null]
        );
        return result.insertId;
    },

    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        return rows[0];
    },

    update: async (id, userData) => {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(userData)) {
            fields.push(`${key} = ?`);
            values.push(value);
        }
        values.push(id);
        const [result] = await db.execute(
            `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    }
};

module.exports = User;
