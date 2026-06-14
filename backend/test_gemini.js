const axios = require('axios');
require('dotenv').config();

async function test() {
    try {
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`;
        const response = await axios.get(url);
        console.log(response.data.models.map(m => m.name).filter(n => n.includes('flash')));
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}
test();
