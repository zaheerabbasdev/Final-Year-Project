const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding AI KYC columns to provider_profiles...');
        await db.query('ALTER TABLE provider_profiles ADD COLUMN ai_confidence_score INT DEFAULT NULL');
        await db.query('ALTER TABLE provider_profiles ADD COLUMN ai_verification_notes TEXT DEFAULT NULL');
        console.log('Migration successful');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist.');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        process.exit();
    }
}

migrate();
