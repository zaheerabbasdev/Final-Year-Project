const Booking = require('../models/bookingModel');
const Job = require('../models/jobModel');
const db = require('../config/db');

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

module.exports = { getMyBookings, updateBookingStatus, updateBookingStatusByJob, getBookingByJob };
