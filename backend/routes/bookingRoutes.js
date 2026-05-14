const express = require('express');
const router = express.Router();
const { 
    getMyBookings, 
    updateBookingStatus, 
    updateBookingStatusByJob, 
    getBookingByJob,
    generateHandshakeToken,
    verifyHandshakeToken
} = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

router.get('/my', authMiddleware, getMyBookings);
router.get('/job/:jobId', authMiddleware, getBookingByJob);
router.put('/job/:jobId/status', authMiddleware, updateBookingStatusByJob);
router.put('/:id/status', authMiddleware, updateBookingStatus);
router.post('/:id/handshake/generate', authMiddleware, generateHandshakeToken);
router.post('/:id/handshake/verify', authMiddleware, verifyHandshakeToken);

module.exports = router;
