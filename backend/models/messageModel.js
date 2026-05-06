const db = require('../config/db');

class Message {
    static async create(data) {
        const { job_id, sender_id, receiver_id, content, image_url } = data;
        const [result] = await db.execute(
            'INSERT INTO messages (job_id, sender_id, receiver_id, content, image_url) VALUES (?, ?, ?, ?, ?)',
            [job_id, sender_id, receiver_id, content || '', image_url || null]
        );
        return result.insertId;
    }


    static async getConversation(jobId, userId1, userId2) {
        const [rows] = await db.execute(
            `SELECT m.*, u.full_name as sender_name, u.avatar as sender_avatar 
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE job_id = ? AND (
                (sender_id = ? AND receiver_id = ?) OR 
                (sender_id = ? AND receiver_id = ?)
             )
             ORDER BY created_at ASC`,
            [jobId, userId1, userId2, userId2, userId1]
        );
        return rows;
    }


    static async getChatList(userId) {
        const [rows] = await db.execute(
            `SELECT m.*, 
                    j.title as job_title,
                    latest.other_id as other_user_id,
                    u.full_name as other_user_name,
                    u.avatar as other_user_avatar,
                    u.role as other_user_role
             FROM messages m
             JOIN (
                SELECT job_id, 
                       CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
                       MAX(created_at) as last_msg_time
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY job_id, other_id
             ) latest ON m.job_id = latest.job_id AND 
                         (m.sender_id = latest.other_id OR m.receiver_id = latest.other_id) AND 
                         m.created_at = latest.last_msg_time
             JOIN jobs j ON m.job_id = j.id
             JOIN users u ON latest.other_id = u.id
             ORDER BY m.created_at DESC`,

            [userId, userId, userId]
        );
        return rows;
    }

    static async markAsRead(jobId, senderId, receiverId) {
        await db.execute(
            'UPDATE messages SET is_read = TRUE WHERE job_id = ? AND sender_id = ? AND receiver_id = ?',
            [jobId, senderId, receiverId]
        );
    }
}

module.exports = Message;
