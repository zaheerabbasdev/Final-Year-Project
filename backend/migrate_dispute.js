const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding ai_dispute_summary column to jobs...');
        await db.query('ALTER TABLE jobs ADD COLUMN ai_dispute_summary TEXT DEFAULT NULL');
        console.log('Migration successful');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        process.exit();
    }
}

migrate();
