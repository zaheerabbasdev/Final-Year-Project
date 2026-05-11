const express = require('express');
const router = express.Router();
const axios = require('axios');

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  'User-Agent': 'ServiceHub-App/1.0 (contact@servicehub.com)',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',  // Force English results
};

// ─── Forward search (text → lat/lng) ────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    const { data } = await axios.get(`${NOMINATIM}/search`, {
      headers: HEADERS,
      params: { 
        q, 
        format: 'json', 
        addressdetails: 1, 
        limit,
        countrycodes: 'pk' // Bias results to Pakistan
      },
      timeout: 15000,
    });

    res.json(data);
  } catch (err) {
    console.error('Geocode search error:', err.message);
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

// ─── Reverse geocode (lat/lng → address) ────────────────────────────────────
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon)
      return res.status(400).json({ error: 'Missing lat/lon parameters' });

    const { data } = await axios.get(`${NOMINATIM}/reverse`, {
      headers: HEADERS,
      params: { lat, lon, format: 'json', addressdetails: 1, zoom: 18 },
      timeout: 15000,
    });

    res.json(data);
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

module.exports = router;
