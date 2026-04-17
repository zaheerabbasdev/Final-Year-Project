const db = require('../config/db');

const Booking = {
    create: async (bookingData) => {
        const { job_id, bid_id, customer_id, provider_id } = bookingData;
        const [result] = await db.execute(
            'INSERT INTO bookings (job_id, bid_id, customer_id, provider_id) VALUES (?, ?, ?, ?)',
            [job_id, bid_id, customer_id, provider_id]
        );
        return result.insertId;
    },

    findByUserId: async (userId, role) => {
        const field = role === 'customer' ? 'customer_id' : 'provider_id';
        const otherField = role === 'customer' ? 'provider_id' : 'customer_id';
        const [rows] = await db.execute(
            `SELECT b.*, j.title as job_title, j.location as job_location, u.full_name as other_party_name, u.avatar as other_party_avatar, u.phone as other_party_phone 
             FROM bookings b 
             JOIN jobs j ON b.job_id = j.id 
             JOIN users u ON b.${otherField} = u.id 
             WHERE b.${field} = ? 
             ORDER BY b.created_at DESC`,
            [userId]
        );
        return rows;
    },

    updateStatus: async (id, status) => {
        const [result] = await db.execute('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    },

    findById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM bookings WHERE id = ?', [id]);
        return rows[0] || null;
    },

    findByJobId: async (jobId) => {
        const [rows] = await db.execute('SELECT * FROM bookings WHERE job_id = ?', [jobId]);
        return rows[0] || null;
    }
};

module.exports = Booking;
