const db = require('../config/db');

const Review = {
    create: async (data) => {
        const { job_id, booking_id, customer_id, provider_id, rating, comment } = data;
        
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert review
            const [result] = await connection.execute(
                'INSERT INTO reviews (job_id, booking_id, customer_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
                [job_id, booking_id, customer_id, provider_id, rating, comment]
            );

            // Recalculate average rating for provider
            await connection.execute(
                `UPDATE provider_profiles 
                 SET rating = (SELECT AVG(rating) FROM reviews WHERE provider_id = ?) 
                 WHERE user_id = ?`,
                [provider_id, provider_id]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    findByProvider: async (providerId) => {
        const [rows] = await db.execute(
            `SELECT r.*, u.full_name as customer_name, u.avatar as customer_avatar 
             FROM reviews r 
             JOIN users u ON r.customer_id = u.id 
             WHERE r.provider_id = ? 
             ORDER BY r.created_at DESC`,
            [providerId]
        );
        return rows;
    },

    findByBooking: async (bookingId) => {
        const [rows] = await db.execute('SELECT * FROM reviews WHERE booking_id = ?', [bookingId]);
        return rows[0] || null;
    },

    hasReviewed: async (bookingId) => {
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM reviews WHERE booking_id = ?', [bookingId]);
        return rows[0].count > 0;
    }
};

module.exports = Review;
