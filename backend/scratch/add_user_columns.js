const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting migration: Adding latitude and longitude to users table...');
        
        // Add latitude
        try {
            await db.execute('ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8)');
            console.log('Added latitude column');
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') {
                console.log('latitude column already exists');
            } else {
                throw e;
            }
        }

        // Add longitude
        try {
            await db.execute('ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8)');
            console.log('Added longitude column');
        } catch (e) {
            if (e.code === 'ER_DUP_COLUMN_NAME') {
                console.log('longitude column already exists');
            } else {
                throw e;
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
