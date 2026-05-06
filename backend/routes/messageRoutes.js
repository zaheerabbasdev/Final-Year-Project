const express = require('express');
const router = express.Router();
const { getMessages, getChatList, sendMessage, markRead } = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');


router.use(authMiddleware);

router.get('/list', getChatList);
router.get('/:jobId/:otherUserId', getMessages);
router.post('/send', upload.single('image'), sendMessage);
router.put('/read/:jobId/:senderId', markRead);



module.exports = router;
