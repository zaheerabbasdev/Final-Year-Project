const axios = require('axios');
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  'User-Agent': 'Kaarkun-App/1.0 (contact@kaarkun.com)',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function test() {
  try {
    const lat = 33.6844;
    const lon = 73.0479;
    const { data } = await axios.get(`${NOMINATIM}/reverse`, {
      headers: HEADERS,
      params: { lat, lon, format: 'json', zoom: 18 },
    });
    console.log('Nominatim response display_name:', data.display_name);
  } catch (err) {
    console.error('Error querying Nominatim:', err.message);
  }
}

test();
