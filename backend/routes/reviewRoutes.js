const express = require('express');
const router = express.Router();
const { submitReview, getProviderReviews, getBookingReview } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, submitReview);
router.get('/provider/:providerId', authMiddleware, getProviderReviews);
router.get('/booking/:bookingId', authMiddleware, getBookingReview);

module.exports = router;
