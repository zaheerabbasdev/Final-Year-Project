const Booking = require('../models/bookingModel');
const Job = require('../models/jobModel');
const db = require('../config/db');
const crypto = require('crypto');

const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.findByUserId(req.user.id, req.user.role);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings' });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        // Logic to verify if user is part of the booking
        // ...
        await Booking.updateStatus(req.params.id, status);

        if (status === 'completed') {
            const booking = await Booking.findById(req.params.id);
            if (booking) {
                await Job.update(booking.job_id, { status: 'completed' });
            }
        }

        res.json({ message: 'Booking status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking' });
    }
};

const getBookingByJob = async (req, res) => {
    try {
        // We will need to join with provider details so the review screen has it
        const [rows] = await db.execute(
            `SELECT b.*, u.full_name as provider_name, u.avatar as provider_avatar 
             FROM bookings b 
             JOIN users u ON b.provider_id = u.id 
             WHERE b.job_id = ?`,
            [req.params.jobId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking' });
    }
};

const updateBookingStatusByJob = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByJobId(req.params.jobId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        await Booking.updateStatus(booking.id, status);

        if (status === 'completed') {
            await Job.update(booking.job_id, { status: 'completed' });
        }

        res.json({ message: 'Booking status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking' });
    }
};

const generateHandshakeToken = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        
        // Ensure only the provider of this booking can generate the token
        if (req.user.id !== booking.provider_id) {
            return res.status(403).json({ message: 'Not authorized to generate token' });
        }

        // Generate a random 6-digit numeric PIN
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        await Booking.updateVerificationToken(id, token);
        
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error generating handshake token' });
    }
};

const verifyHandshakeToken = async (req, res) => {
    try {
        const { id } = req.params;
        const { token } = req.body;
        
        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Ensure only the customer of this booking can verify the token
        if (req.user.id !== booking.customer_id) {
            return res.status(403).json({ message: 'Not authorized to verify token' });
        }

        const isValid = await Booking.verifyToken(id, token);
        if (!isValid) return res.status(400).json({ message: 'Invalid or expired token' });

        // Update status to in_progress
        await Booking.updateStatus(id, 'in_progress');
        
        // Optional: Clear token after verification to prevent reuse
        await Booking.updateVerificationToken(id, null);

        res.json({ message: 'Handshake successful! Job is now in progress.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying handshake token' });
    }
};

module.exports = { 
    getMyBookings, 
    updateBookingStatus, 
    updateBookingStatusByJob, 
    getBookingByJob,
    generateHandshakeToken,
    verifyHandshakeToken
};
