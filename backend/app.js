const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const jobRoutes = require('./routes/jobRoutes');
const bidRoutes = require('./routes/bidRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const aiRoutes = require('./routes/aiRoutes');


const http = require('http');
const { initSocket } = require('./socketManager');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const suspendedCheck = require('./middleware/suspendedCheck');

// CORS — only allow known frontend origins (admin panel, web app, mobile dev tools)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// Flutter web's debug server binds a random port each run, so it can't be
// pinned in ALLOWED_ORIGINS — allow any localhost/127.0.0.1 origin instead.
// This is safe: a remote attacker's browser cannot forge a localhost Origin
// header, since the browser sets it from the page's actual origin.
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes(origin) || isLocalDevOrigin(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization, Accept, Origin');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

    // Handle Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(suspendedCheck);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// ... (routes)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/ai', aiRoutes);


app.get('/', (req, res) => {
    res.json({ message: "Welcome to Kaarkun API" });
});

// Basic Error Handler — log full details server-side, never leak them to the client
app.use((err, req, res, next) => {
    console.error('=== GLOBAL ERROR HANDLER ===');
    console.error('Error message:', err.message || err);
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
    console.error('Request URL:', req.method, req.url);
    console.error('============================');
    res.status(err.status || 500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
