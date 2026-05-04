const express = require('express');
const router = express.Router();
const { submitReview, getProviderReviews, getBookingReview } = require('../controllers/reviewController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, submitReview);
router.get('/provider/:providerId', getProviderReviews);
router.get('/booking/:bookingId', getBookingReview);

module.exports = router;
