const express = require('express');
const router = express.Router();
const { placeBid, getJobBids, getMyBids, acceptBid } = require('../controllers/bidController');
const { authMiddleware, authorize } = require('../middleware/auth');

router.post('/', authMiddleware, authorize('provider'), placeBid);
router.get('/job/:jobId', authMiddleware, getJobBids);
router.get('/my/bids', authMiddleware, authorize('provider'), getMyBids);
router.put('/:id/accept', authMiddleware, authorize('customer'), acceptBid);

module.exports = router;
