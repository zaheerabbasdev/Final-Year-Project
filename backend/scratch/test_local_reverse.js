const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/geocode/reverse?lat=33.7233&lon=73.0435');
    console.log('Backend response:', res.data);
  } catch (err) {
    console.error('Backend error:', err.response ? err.response.data : err.message);
  }
}

test();
