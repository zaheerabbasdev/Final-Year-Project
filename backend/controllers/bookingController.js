const Booking = require('../models/bookingModel');

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
        res.json({ message: 'Booking status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking' });
    }
};

module.exports = { getMyBookings, updateBookingStatus };
