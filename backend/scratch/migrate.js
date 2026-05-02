const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Add columns to users table
        try {
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN status ENUM('pending', 'verified', 'rejected', 'blocked') DEFAULT 'pending',
                ADD COLUMN otp_code VARCHAR(10),
                ADD COLUMN otp_expiry TIMESTAMP
            `);
            console.log('Users table updated.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('Users table columns already exist.');
            else throw e;
        }

        // Add columns to provider_profiles table
        try {
            await db.execute(`
                ALTER TABLE provider_profiles 
                ADD COLUMN cnic_url VARCHAR(255),
                ADD COLUMN certificates_url VARCHAR(255)
            `);
            console.log('Provider profiles table updated.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('Provider profiles table columns already exist.');
            else throw e;
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
