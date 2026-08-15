const Booking = require('../models/bookingModel');
const Job = require('../models/jobModel');
const Wallet = require('../models/walletModel');
const db = require('../config/db');
const crypto = require('crypto');
const { createNotification } = require('../services/notificationService');

const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.findByUserId(req.user.id, req.user.role);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings' });
    }
};

const ALLOWED_BOOKING_STATUSES = ['confirmed', 'in_progress', 'awaiting_confirmation', 'completed', 'cancelled'];

const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!ALLOWED_BOOKING_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const existing = await Booking.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Booking not found' });
        if (req.user.id !== existing.customer_id && req.user.id !== existing.provider_id) {
            return res.status(403).json({ message: 'You are not part of this booking' });
        }

        await Booking.updateStatus(req.params.id, status);

        const booking = await Booking.findById(req.params.id);
        if (booking) {
            if (status === 'completed') {
                await Job.update(booking.job_id, { status: 'completed' });

                // Release escrow → credit provider wallet
                try {
                    await Wallet.releaseEscrow(booking.id);
                } catch (e) {
                    console.error('Escrow release failed:', e.message);
                }

                const [jobRows] = await db.execute('SELECT title FROM jobs WHERE id = ?', [booking.job_id]);
                const jobTitle = jobRows[0] ? jobRows[0].title : 'your job';
                await createNotification(
                    booking.provider_id,
                    'Job Completed & Payment Released',
                    `The customer confirmed "${jobTitle}". Your earnings have been credited to your wallet.`,
                    'booking'
                );
            } else if (status === 'awaiting_confirmation') {
                const [jobRows] = await db.execute('SELECT title FROM jobs WHERE id = ?', [booking.job_id]);
                const jobTitle = jobRows[0] ? jobRows[0].title : 'your job';
                await createNotification(
                    booking.customer_id,
                    'Job Done Request',
                    `The provider has marked "${jobTitle}" as done. Please confirm.`,
                    'booking'
                );
            }
        }

        res.json({ message: 'Booking status updated' });
    } catch (error) {
        console.error('Error updating booking status:', error);
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
             WHERE b.job_id = ?
             ORDER BY b.id DESC LIMIT 1`,
            [req.params.jobId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Booking not found' });

        const booking = rows[0];
        if (req.user.id !== booking.customer_id && req.user.id !== booking.provider_id) {
            return res.status(403).json({ message: 'You are not part of this booking' });
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking' });
    }
};

const updateBookingStatusByJob = async (req, res) => {
    try {
        const { status } = req.body;
        if (!ALLOWED_BOOKING_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findByJobId(req.params.jobId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (req.user.id !== booking.customer_id && req.user.id !== booking.provider_id) {
            return res.status(403).json({ message: 'You are not part of this booking' });
        }

        await Booking.updateStatus(booking.id, status);

        if (status === 'completed') {
            await Job.update(booking.job_id, { status: 'completed' });

            // Release escrow → credit provider wallet
            try {
                await Wallet.releaseEscrow(booking.id);
            } catch (e) {
                console.error('Escrow release failed:', e.message);
            }

            const [jobRows] = await db.execute('SELECT title FROM jobs WHERE id = ?', [booking.job_id]);
            const jobTitle = jobRows[0] ? jobRows[0].title : 'your job';
            await createNotification(
                booking.provider_id,
                'Job Completed & Payment Released',
                `The customer confirmed "${jobTitle}". Your earnings have been credited to your wallet.`,
                'booking'
            );
        } else if (status === 'awaiting_confirmation') {
            const [jobRows] = await db.execute('SELECT title FROM jobs WHERE id = ?', [booking.job_id]);
            const jobTitle = jobRows[0] ? jobRows[0].title : 'your job';
            await createNotification(
                booking.customer_id,
                'Job Done Request',
                `The provider has marked "${jobTitle}" as done. Please confirm.`,
                'booking'
            );
        }

        res.json({ message: 'Booking status updated' });
    } catch (error) {
        console.error('Error updating booking status by job:', error);
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

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const booking = await Booking.findById(id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        // Only allow cancellation for confirmed or in_progress bookings
        if (!['confirmed', 'in_progress'].includes(booking.status)) {
            return res.status(400).json({ message: `Cannot cancel a booking with status "${booking.status}"` });
        }

        // Ensure the user is part of this booking
        if (userId !== booking.customer_id && userId !== booking.provider_id) {
            return res.status(403).json({ message: 'You are not authorized to cancel this booking' });
        }

        // Cancel the booking
        await Booking.updateStatus(id, 'cancelled');

        // Refund escrow back to customer wallet
        try {
            await Wallet.refundEscrow(parseInt(id));
        } catch (e) {
            console.error('Escrow refund failed:', e.message);
        }

        // Reset all other bids for this job back to 'pending'
        await db.execute('UPDATE bids SET status = ? WHERE job_id = ? AND id != ?', ['pending', booking.job_id, booking.bid_id || 0]);

        // Delete the accepted bid so the provider can bid again and it doesn't show as accepted
        if (booking.bid_id) {
            await db.execute('DELETE FROM bids WHERE id = ?', [booking.bid_id]);
        }

        // Reopen the job so other providers can bid
        await Job.update(booking.job_id, { status: 'open' });

        // Notify the other party
        const [jobRows] = await db.execute('SELECT title FROM jobs WHERE id = ?', [booking.job_id]);
        const jobTitle = jobRows[0] ? jobRows[0].title : 'a job';
        const cancellerRole = userId === booking.customer_id ? 'customer' : 'provider';
        const recipientId = userId === booking.customer_id ? booking.provider_id : booking.customer_id;

        await createNotification(
            recipientId,
            'Booking Cancelled',
            `The ${cancellerRole} has cancelled the booking for "${jobTitle}".`,
            'booking'
        );

        res.json({ message: 'Booking cancelled successfully. The job has been reopened.' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ message: 'Error cancelling booking' });
    }
};

module.exports = { 
    getMyBookings, 
    updateBookingStatus, 
    updateBookingStatusByJob, 
    getBookingByJob,
    generateHandshakeToken,
    verifyHandshakeToken,
    cancelBooking
};
