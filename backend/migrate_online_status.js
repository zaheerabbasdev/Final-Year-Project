const db = require('./config/db');

async function migrate() {
    try {
        console.log('Starting online status migration...');

        // Add is_online column to provider_profiles table
        try {
            await db.execute('ALTER TABLE provider_profiles ADD COLUMN is_online BOOLEAN DEFAULT FALSE');
            console.log('Added is_online column to provider_profiles table');
        } catch (e) {
            console.log('Note: is_online column might already exist or table doesn\'t exist. Error:', e.message);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
