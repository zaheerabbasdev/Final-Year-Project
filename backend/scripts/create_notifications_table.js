const db = require('../config/db');

async function createNotificationsTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await db.execute(query);
        console.log('Notifications table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating notifications table:', error);
        process.exit(1);
    }
}

createNotificationsTable();
