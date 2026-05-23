const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function test() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'kaarkun_db'
        });
        console.log('Connected to MySQL successfully!');
        const [rows] = await connection.execute('SELECT id, full_name, email, role, status FROM users');
        console.log('Users in database:', rows);
        await connection.end();
    } catch (e) {
        console.error('Error connecting to DB:', e.message);
    }
}

test();
