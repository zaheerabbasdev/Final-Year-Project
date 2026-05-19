const db = require('../config/db');

async function createMessagesTable() {
    try {
        console.log('Creating messages table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NOT NULL,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT,
                image_url VARCHAR(255) DEFAULT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Messages table created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating messages table:', error);
        process.exit(1);
    }
}

createMessagesTable();
