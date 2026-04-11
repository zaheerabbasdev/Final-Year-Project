const express = require('express');
const router = express.Router();
const { getMyBookings, updateBookingStatus } = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

router.get('/my', authMiddleware, getMyBookings);
router.put('/:id/status', authMiddleware, updateBookingStatus);

module.exports = router;
