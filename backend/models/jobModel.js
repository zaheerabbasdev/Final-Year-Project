const db = require('../config/db');

const Job = {
    create: async (jobData) => {
        const { customer_id, title, description, category_id, budget, location, preferred_date, preferred_time, images, latitude, longitude, is_negotiable } = jobData;
        const [result] = await db.execute(
            'INSERT INTO jobs (customer_id, title, description, category_id, budget, location, preferred_date, preferred_time, images, latitude, longitude, is_negotiable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                customer_id || null, 
                title || null, 
                description || null, 
                category_id || null, 
                budget || null, 
                location || null, 
                preferred_date || null, 
                preferred_time || null, 
                JSON.stringify(images || []),
                latitude || null,
                longitude || null,
                is_negotiable ? 1 : 0
            ]
        );
        return result.insertId;
    },

    findAll: async (filters = {}) => {
        let selectClause = `j.*, c.name as category_name, u.full_name as customer_name, u.avatar as customer_avatar, 
                            b.status as booking_status, b.id as booking_id, b.provider_id,
                            up.full_name as provider_name, up.avatar as provider_avatar,
                            r.id as review_id`;
        let proximityClause = '';
        const params = [];

        if (filters.lat && filters.lng) {
            proximityClause = `, (
                6371 * acos(
                    cos(radians(?)) * cos(radians(j.latitude)) *
                    cos(radians(j.longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(j.latitude))
                )
            ) AS distance`;
            params.push(filters.lat, filters.lng, filters.lat);
        }

        let query = `
            SELECT ${selectClause} ${proximityClause}
            FROM jobs j 
            LEFT JOIN categories c ON j.category_id = c.id 
            JOIN users u ON j.customer_id = u.id 
            LEFT JOIN bookings b ON j.id = b.job_id AND b.status != 'cancelled'
            LEFT JOIN users up ON b.provider_id = up.id
            LEFT JOIN reviews r ON b.id = r.booking_id
            WHERE 1=1
        `;

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

        // Proximity Filter in WHERE
        if (filters.lat && filters.lng && filters.radius) {
            query += ` HAVING distance <= ?`;
            params.push(filters.radius);
        }

        query += ' ORDER BY j.created_at DESC';
        const [rows] = await db.execute(query, params);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.execute(
            `SELECT j.*, c.name as category_name, u.full_name as customer_name, u.avatar as customer_avatar,
                    b.status as booking_status, b.id as booking_id, b.provider_id,
                    up.full_name as provider_name, up.avatar as provider_avatar,
                    r.id as review_id
             FROM jobs j 
             LEFT JOIN categories c ON j.category_id = c.id 
             JOIN users u ON j.customer_id = u.id 
             LEFT JOIN bookings b ON j.id = b.job_id AND b.status != 'cancelled'
             LEFT JOIN users up ON b.provider_id = up.id
             LEFT JOIN reviews r ON b.id = r.booking_id
             WHERE j.id = ?`,
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
