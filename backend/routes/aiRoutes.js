const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const {
    getMatchingJobs,
    getSuggestedBid,
    getFraudReviews,
    getAutocomplete,
    supportChatbot
} = require('../controllers/aiController');

// Smart Matching Jobs for Providers (Requires Authenticated Provider Role)
router.get('/matching-jobs', authMiddleware, authorize('provider'), getMatchingJobs);

// Bid Price Suggestion (Public / Authenticated User)
router.get('/suggest-bid/:jobId', authMiddleware, getSuggestedBid);

// Fraud logs checking (Typically Admin view, authMiddleware is used)
router.get('/fraud-reviews', authMiddleware, getFraudReviews);

// Autocomplete recommendations (Customers posting jobs)
router.post('/autocomplete', authMiddleware, getAutocomplete);

// Support Chatbot helper
router.post('/support-chatbot', authMiddleware, supportChatbot);

module.exports = router;
