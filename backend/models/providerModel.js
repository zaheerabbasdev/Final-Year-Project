const db = require('../config/db');

const ProviderProfile = {
    create: async (userId, data = {}) => {
        const { bio = '', experience_years = 0, skills = [], availability = true, category_id = null } = data;
        const [result] = await db.execute(
            'INSERT INTO provider_profiles (user_id, bio, experience_years, skills, availability, category_id) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, bio, experience_years, JSON.stringify(skills), availability, category_id]
        );
        return result.affectedRows > 0;
    },

    findByUserId: async (userId) => {
        const [rows] = await db.execute(
            `SELECT p.*, c.name as category_name 
             FROM provider_profiles p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.user_id = ?`,
            [userId]
        );
        return rows[0];
    },

    update: async (userId, data) => {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined) continue;
            fields.push(`${key} = ?`);
            values.push(key === 'skills' ? JSON.stringify(value) : value);
        }
        if (fields.length === 0) return true;
        values.push(userId);
        const [result] = await db.execute(
            `UPDATE provider_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    findTopProviders: async (limit = 5) => {
        const parsedLimit = parseInt(limit, 10) || 5;
        const [rows] = await db.execute(
            `SELECT u.id, u.full_name, u.avatar, p.bio, p.rating, p.total_jobs, c.name as category_name
             FROM users u 
             JOIN provider_profiles p ON u.id = p.user_id 
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE u.role = 'provider' 
             ORDER BY p.rating DESC, p.total_jobs DESC 
             LIMIT ${parsedLimit}`
        );
        return rows;
    },

    findAll: async (filters = {}) => {
        let query = `SELECT u.id, u.full_name, u.avatar, p.bio, p.rating, p.total_jobs, c.name as category_name
                     FROM users u 
                     JOIN provider_profiles p ON u.id = p.user_id 
                     LEFT JOIN categories c ON p.category_id = c.id
                     WHERE u.role = 'provider'`;
        const params = [];

        if (filters.search) {
            query += ' AND u.full_name LIKE ?';
            params.push(`%${filters.search}%`);
        }

        const [rows] = await db.execute(query, params);
        return rows;
    }
};

module.exports = ProviderProfile;
