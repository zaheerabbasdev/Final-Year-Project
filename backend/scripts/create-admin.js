/**
 * One-time script to create an admin account.
 * Run: node scripts/create-admin.js
 *
 * Uses the same DB credentials as the backend (.env in the project root).
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/db');
const bcrypt = require('bcryptjs');

const ADMIN = {
    full_name: 'Zaheer Abbas',
    username:  'zaheer_admin',
    email:     'learntechdigital@gmail.com',
    password:  'Admin@1234',
};

(async () => {
    try {
        const [existing] = await db.execute('SELECT id FROM admins WHERE email = ?', [ADMIN.email]);
        if (existing.length > 0) {
            console.log(`Admin already exists with email ${ADMIN.email} (id=${existing[0].id})`);
            console.log('If you forgot the password, update it with:');
            console.log(`  node scripts/create-admin.js --reset`);
            process.exit(0);
        }

        const password_hash = await bcrypt.hash(ADMIN.password, 12);
        const [result] = await db.execute(
            'INSERT INTO admins (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
            [ADMIN.username, ADMIN.email, password_hash, ADMIN.full_name]
        );

        console.log(`✅  Admin created! id=${result.insertId}`);
        console.log(`    Email   : ${ADMIN.email}`);
        console.log(`    Password: ${ADMIN.password}`);
        console.log(`\n⚠️  Change the password after first login.`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit(0);
    }
})();
