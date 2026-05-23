const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function dump() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'kaarkun_db'
        });
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('--- USERS ---');
        console.log(users);
        
        const [admins] = await connection.execute('SELECT * FROM admins');
        console.log('--- ADMINS ---');
        console.log(admins);
        
        await connection.end();
    } catch (e) {
        console.error('Error:', e.message);
    }
}

dump();
