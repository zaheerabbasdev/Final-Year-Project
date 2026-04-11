const express = require('express');
const router = express.Router();
const { getStats, getAllUsers } = require('../controllers/adminController');
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/stats', authMiddleware, authorize('admin'), getStats);
router.get('/users', authMiddleware, authorize('admin'), getAllUsers);

module.exports = router;
