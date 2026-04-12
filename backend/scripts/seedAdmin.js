const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seedAdmin() {
    try {
        const email = 'admin@servicehub.com';
        const password = 'admin123';
        const fullName = 'System Administrator';
        const role = 'admin';

        // Check if admin already exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert admin user
        await db.execute(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [fullName, email, passwordHash, role]
        );

        console.log('Admin user created successfully!');
        console.log('Email: ' + email);
        console.log('Password: ' + password);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
