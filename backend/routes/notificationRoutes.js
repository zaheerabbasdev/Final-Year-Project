const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, notificationController.getNotifications);
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);
router.put('/mark-all-read', authMiddleware, notificationController.markAllAsRead);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;
