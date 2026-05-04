const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar, getTopProviders, getProviders, getUserById } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/me', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.post('/me/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);
router.get('/providers/top', getTopProviders);
router.get('/providers/:id', getUserById);
router.get('/providers', getProviders);
router.get('/:id', getUserById);

module.exports = router;
