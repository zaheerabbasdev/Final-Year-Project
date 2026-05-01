const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting migration: Adding is_negotiable column to jobs...');
        
        await db.execute(`
            ALTER TABLE jobs 
            ADD COLUMN is_negotiable BOOLEAN DEFAULT FALSE
        `);
        
        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Column already exists. Skipping.');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
