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


const http = require('http');
const { initSocket } = require('./socketManager');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const suspendedCheck = require('./middleware/suspendedCheck');
// ... (rest of middleware)
app.use(cors());
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


app.get('/', (req, res) => {
    res.json({ message: "Welcome to ServiceHub API" });
});

// Basic Error Handler
app.use((err, req, res, next) => {
    console.error('=== GLOBAL ERROR HANDLER ===');
    console.error('Error message:', err.message || err);
    console.error('Error code:', err.code);
    console.error('Error stack:', err.stack);
    console.error('Request URL:', req.method, req.url);
    console.error('============================');
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
