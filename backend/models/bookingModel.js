const db = require('../config/db');

const Booking = {
    create: async (bookingData) => {
        const { job_id, bid_id, customer_id, provider_id } = bookingData;
        console.log('DEBUG: Booking.create - Values:', { job_id, bid_id, customer_id, provider_id });
        
        const params = [
            job_id || null, 
            bid_id || null, 
            customer_id || null, 
            provider_id || null
        ];
        
        console.log('DEBUG: Booking.create - Params:', params);

        const [result] = await db.execute(
            'INSERT INTO bookings (job_id, bid_id, customer_id, provider_id) VALUES (?, ?, ?, ?)',
            params
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
        // A job can be cancelled and rebooked (cancelBooking reopens it for re-bidding),
        // so more than one booking row can exist per job — always take the latest.
        const [rows] = await db.execute('SELECT * FROM bookings WHERE job_id = ? ORDER BY id DESC LIMIT 1', [jobId]);
        return rows[0] || null;
    },

    updateVerificationToken: async (id, token) => {
        const [result] = await db.execute('UPDATE bookings SET verification_token = ? WHERE id = ?', [token, id]);
        return result.affectedRows > 0;
    },

    verifyToken: async (id, token) => {
        const [rows] = await db.execute('SELECT * FROM bookings WHERE id = ? AND verification_token = ?', [id, token]);
        return rows.length > 0;
    }
};

module.exports = Booking;
