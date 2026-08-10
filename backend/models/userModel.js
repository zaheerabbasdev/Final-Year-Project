const db = require('../config/db');

const User = {
    create: async (userData) => {
        const { full_name, email, phone, password_hash, role, avatar, latitude, longitude, status = 'pending', otp_code = null, otp_expiry = null } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, phone, password_hash, role, avatar, latitude, longitude, status, otp_code, otp_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, phone, password_hash, role, avatar || null, latitude || null, longitude || null, status, otp_code, otp_expiry]
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
    },

    deleteById: async (id) => {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    verifyOTP: async (email, otpCode) => {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()',
            [email, otpCode]
        );
        
        if (rows.length > 0) {
            await db.execute('UPDATE users SET status = "verified", otp_code = NULL, otp_expiry = NULL WHERE id = ?', [rows[0].id]);
            return rows[0];
        }
        return null;
    }
};

module.exports = User;
