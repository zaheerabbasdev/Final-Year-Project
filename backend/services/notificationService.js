const db = require('../config/db');
const { sendNotification } = require('../socketManager');

const createNotification = async (userId, title, message, type) => {
    try {
        console.log(`DEBUG: Creating notification for userId: ${userId} (type: ${typeof userId})`);
        const [result] = await db.execute(
            'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
            [userId, title, message, type]
        );

        const newNotification = {
            id: result.insertId,
            user_id: userId,
            title,
            message,
            type,
            is_read: 0,
            created_at: new Date()
        };

        // 2. Emit via Socket.io
        sendNotification(userId, newNotification);

        return newNotification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = { createNotification };
