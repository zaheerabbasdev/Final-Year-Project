const axios = require('axios');

async function createAdmin() {
    try {
        const response = await axios.post('http://localhost:5000/api/admin/auth/register', {
            username: 'admin',
            email: 'admin@kaarkun.com',
            password: 'adminpassword123',
            full_name: 'System Administrator'
        });
        console.log('Admin created successfully:', response.data);
    } catch (error) {
        console.error('Error creating admin:', error.response ? error.response.data : error.message);
    }
}

createAdmin();
