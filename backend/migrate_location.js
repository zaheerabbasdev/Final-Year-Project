const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add columns to users table
        try {
            await db.execute('ALTER TABLE users ADD COLUMN latitude DECIMAL(10, 8)');
            await db.execute('ALTER TABLE users ADD COLUMN longitude DECIMAL(11, 8)');
            console.log('Added latitude/longitude to users table');
        } catch (e) {
            console.log('Note: users table columns might already exist.');
        }

        // Add columns to jobs table
        try {
            await db.execute('ALTER TABLE jobs ADD COLUMN latitude DECIMAL(10, 8)');
            await db.execute('ALTER TABLE jobs ADD COLUMN longitude DECIMAL(11, 8)');
            console.log('Added latitude/longitude to jobs table');
        } catch (e) {
            console.log('Note: jobs table columns might already exist.');
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
