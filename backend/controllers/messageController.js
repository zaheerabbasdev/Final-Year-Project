const Message = require('../models/messageModel');
const { getIO } = require('../socketManager');
const db = require('../config/db');



const getMessages = async (req, res) => {
    try {
        const { jobId, otherUserId } = req.params;
        const messages = await Message.getConversation(jobId, req.user.id, otherUserId);
        
        // Mark messages as read when fetched
        await Message.markAsRead(jobId, otherUserId, req.user.id);
        
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

const getChatList = async (req, res) => {
    try {
        const chats = await Message.getChatList(req.user.id);
        res.json(chats);
    } catch (error) {
        console.error('Error fetching chat list:', error);
        res.status(500).json({ message: 'Error fetching chat list' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { job_id, receiver_id, content } = req.body;
        let image_url = null;
        
        if (req.file) {
            image_url = `uploads/${req.file.filename}`;
        }

        const messageId = await Message.create({
            job_id: parseInt(job_id),
            sender_id: req.user.id,
            receiver_id: parseInt(receiver_id),
            content: content || '',
            image_url
        });


        // Fetch sender details for the socket payload
        const [senderInfo] = await db.execute('SELECT full_name, avatar FROM users WHERE id = ?', [req.user.id]);
        const sender = senderInfo[0];

        // Emit via Socket.io for real-time delivery to both parties
        const io = getIO();
        const payload = {
            id: messageId,
            job_id: parseInt(job_id),
            sender_id: req.user.id,
            sender_name: sender.full_name,
            sender_avatar: sender.avatar,
            receiver_id: parseInt(receiver_id),
            content: content || '',
            image_url,
            created_at: new Date()
        };


        io.to(`user_${receiver_id}`).emit('new_message', payload);
        io.to(`user_${req.user.id}`).emit('new_message', payload);

        
        res.status(201).json({ message: 'Message sent', messageId, image_url });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

const markRead = async (req, res) => {
    try {
        const { jobId, senderId } = req.params;
        await Message.markAsRead(jobId, senderId, req.user.id);
        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking read:', error);
        res.status(500).json({ message: 'Error marking read' });
    }
};

module.exports = { getMessages, getChatList, sendMessage, markRead };

