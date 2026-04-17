const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running migration: create reviews table...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                job_id      INT NOT NULL,
                booking_id  INT NOT NULL,
                customer_id INT NOT NULL,
                provider_id INT NOT NULL,
                rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                comment     TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_booking_review (booking_id),
                FOREIGN KEY (job_id)      REFERENCES jobs(id)      ON DELETE CASCADE,
                FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES users(id)     ON DELETE CASCADE,
                FOREIGN KEY (provider_id) REFERENCES users(id)     ON DELETE CASCADE
            );
        `);
        
        // Also update ENUM values for bookings if necessary, but we can just alter it
        await db.query(`
            ALTER TABLE bookings MODIFY COLUMN status ENUM('confirmed', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled') DEFAULT 'confirmed';
        `);
        
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
