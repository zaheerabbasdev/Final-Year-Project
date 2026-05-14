const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running migration...');
        await db.execute('ALTER TABLE bookings ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL');
        console.log('Migration successful: verification_token column added.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
