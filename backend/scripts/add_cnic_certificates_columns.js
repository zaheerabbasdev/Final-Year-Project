const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting migration: Adding CNIC and Certificates columns to provider_profiles...');
        
        await db.execute(`
            ALTER TABLE provider_profiles 
            ADD COLUMN cnic_url VARCHAR(255) DEFAULT NULL,
            ADD COLUMN certificates_url VARCHAR(255) DEFAULT NULL
        `);
        
        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('Columns already exist. Skipping.');
            process.exit(0);
        }
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
