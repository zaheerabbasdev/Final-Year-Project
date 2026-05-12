const db = require('../config/db');

const Bid = {
    create: async (bidData) => {
        const { job_id, provider_id, amount, estimated_time, cover_letter } = bidData;
        const [result] = await db.execute(
            'INSERT INTO bids (job_id, provider_id, amount, estimated_time, cover_letter) VALUES (?, ?, ?, ?, ?)',
            [job_id, provider_id, amount, estimated_time, cover_letter]
        );
        return result.insertId;
    },

    findByJobId: async (jobId) => {
        const [rows] = await db.execute(
            `SELECT b.*, b.provider_id as user_id, u.full_name as provider_name, u.avatar as provider_avatar, 
                    p.rating as provider_rating,
                    (SELECT COUNT(*) FROM reviews WHERE provider_id = b.provider_id) as review_count
             FROM bids b 
             JOIN users u ON b.provider_id = u.id 
             LEFT JOIN provider_profiles p ON u.id = p.user_id 
             WHERE b.job_id = ? 
             ORDER BY b.amount ASC`,
            [jobId]
        );
        return rows;
    },

    findByProviderId: async (providerId) => {
        const [rows] = await db.execute(
            `SELECT 
                b.*, 
                j.title as job_title, 
                j.status as job_status, 
                j.customer_id as customer_id,
                COALESCE(c.name, 'Other') as category_name 
             FROM bids b 
             JOIN jobs j ON b.job_id = j.id 
             LEFT JOIN categories c ON j.category_id = c.id 
             WHERE b.provider_id = ? 
             ORDER BY b.created_at DESC`,
            [providerId]
        );
        return rows;
    },

    findByJobAndProvider: async (jobId, providerId) => {
        const [rows] = await db.execute(
            'SELECT * FROM bids WHERE job_id = ? AND provider_id = ?',
            [jobId, providerId]
        );
        return rows[0] || null;
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM bids WHERE id = ?', [id]);
        return rows[0];
    },

    updateStatus: async (id, status) => {
        const [result] = await db.execute('UPDATE bids SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    },

    rejectOthers: async (jobId, acceptedBidId) => {
        const [result] = await db.execute(
            'UPDATE bids SET status = ? WHERE job_id = ? AND id != ?',
            ['rejected', jobId, acceptedBidId]
        );
        return result.affectedRows;
    }
};

module.exports = Bid;
