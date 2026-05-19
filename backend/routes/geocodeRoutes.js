const express = require('express');
const router = express.Router();
const axios = require('axios');

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = {
  'User-Agent': 'Kaarkun-App/1.0 (contact@kaarkun.com)',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ─── Autocomplete (Search as you type) ───────────────────────────────
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.status(400).json({ error: 'Missing input parameter' });

    const { data } = await axios.get(`${NOMINATIM}/search`, {
      headers: HEADERS,
      params: {
        q: input,
        format: 'json',
        addressdetails: 1,
        limit: 5,
        countrycodes: 'pk', // Bias to Pakistan
      },
    });

    // Map Nominatim results to a common format
    const predictions = data.map(item => ({
      description: item.display_name,
      place_id: item.place_id,
      lat: item.lat,
      lng: item.lon,
    }));

    res.json(predictions);
  } catch (err) {
    console.error('Autocomplete error:', err.message);
    res.status(502).json({ error: 'Search service unavailable' });
  }
});

// ─── Forward Search (Text → Lat/Lng) ─────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

    const { data } = await axios.get(`${NOMINATIM}/search`, {
      headers: HEADERS,
      params: {
        q: q,
        format: 'json',
        limit: 1,
        countrycodes: 'pk',
      },
    });

    if (data && data.length > 0) {
      const first = data[0];
      res.json({
        lat: first.lat,
        lng: first.lon,
        address: first.display_name,
      });
    } else {
      res.status(404).json({ error: 'Location not found' });
    }
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(502).json({ error: 'Search service unavailable' });
  }
});

// ─── Reverse Geocode (Lat/Lng → Address) ────────────────────────────────────
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon)
      return res.status(400).json({ error: 'Missing lat/lon parameters' });

    const { data } = await axios.get(`${NOMINATIM}/reverse`, {
      headers: HEADERS,
      params: { lat, lon, format: 'json', zoom: 18 },
    });

    if (data && data.display_name) {
      res.json({
        display_name: data.display_name,
      });
    } else {
      res.status(404).json({ error: 'Address not found' });
    }
  } catch (err) {
    console.error('Reverse Geocode error:', err.message);
    res.status(502).json({ error: 'Geocoding service unavailable' });
  }
});

module.exports = router;
