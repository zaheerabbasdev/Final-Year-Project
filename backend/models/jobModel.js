const db = require('../config/db');

const Job = {
    create: async (jobData) => {
        const { customer_id, title, description, category_id, budget, location, preferred_date, preferred_time, images } = jobData;
        const [result] = await db.execute(
            'INSERT INTO jobs (customer_id, title, description, category_id, budget, location, preferred_date, preferred_time, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                customer_id || null, 
                title || null, 
                description || null, 
                category_id || null, 
                budget || null, 
                location || null, 
                preferred_date || null, 
                preferred_time || null, 
                JSON.stringify(images || [])
            ]
        );
        return result.insertId;
    },

    findAll: async (filters = {}) => {
        let query = 'SELECT j.*, c.name as category_name, u.full_name as customer_name, u.avatar as customer_avatar FROM jobs j LEFT JOIN categories c ON j.category_id = c.id JOIN users u ON j.customer_id = u.id WHERE 1=1';
        const params = [];

        if (filters.category_id) {
            query += ' AND j.category_id = ?';
            params.push(filters.category_id);
        }
        if (filters.status) {
            query += ' AND j.status = ?';
            params.push(filters.status);
        }
        if (filters.location) {
            query += ' AND j.location LIKE ?';
            params.push(`%${filters.location}%`);
        }
        if (filters.search) {
            query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        query += ' ORDER BY j.created_at DESC';
        const [rows] = await db.execute(query, params);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            'SELECT j.*, c.name as category_name, u.full_name as customer_name, u.avatar as customer_avatar FROM jobs j LEFT JOIN categories c ON j.category_id = c.id JOIN users u ON j.customer_id = u.id WHERE j.id = ?',
            [id]
        );
        return rows[0];
    },

    update: async (id, jobData) => {
        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(jobData)) {
            fields.push(`${key} = ?`);
            values.push(key === 'images' ? JSON.stringify(value) : value);
        }
        values.push(id);
        const [result] = await db.execute(
            `UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows > 0;
    },

    delete: async (id) => {
        const [result] = await db.execute('DELETE FROM jobs WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = Job;
