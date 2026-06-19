const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Require a valid JWT to establish a socket connection at all
    io.use((socket, next) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = Math.floor(Number(decoded.id));
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join the room derived from the authenticated token, never a client-supplied id
        socket.join(`user_${socket.userId}`);

        socket.on('join_room', () => {
            socket.join(`user_${socket.userId}`);
        });

        socket.on('typing', (data) => {
            const { jobId, receiverId, senderId } = data;
            const roomName = `user_${receiverId}`;
            socket.to(roomName).emit('user_typing', { jobId, senderId });
        });

        socket.on('stop_typing', (data) => {
            const { jobId, receiverId, senderId } = data;
            const roomName = `user_${receiverId}`;
            socket.to(roomName).emit('user_stop_typing', { jobId, senderId });
        });


        // ─── Live Location Tracking ───────────────────────────────────────
        // Provider emits location_update → backend relays to customer room
        socket.on('location_update', (data) => {
            const { jobId, customerId, latitude, longitude } = data;
            console.log(`DEBUG: location_update received. Job: ${jobId}, Customer: ${customerId}, Lat: ${latitude}, Lng: ${longitude}`);
            const room = `user_${Math.floor(Number(customerId))}`;
            io.to(room).emit('provider_location', {
                jobId,
                latitude,
                longitude,
            });
            console.log(`DEBUG: Location relayed to room ${room}`);
        });

        socket.on('location_stopped', (data) => {
            const { jobId, customerId } = data;
            console.log(`DEBUG: location_stopped received. Job: ${jobId}, Customer: ${customerId}`);
            const room = `user_${Math.floor(Number(customerId))}`;
            io.to(room).emit('provider_location_stopped', {
                jobId,
            });
            console.log(`DEBUG: Location stop signal relayed to room ${room}`);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const sendNotification = (userId, data) => {
    // Normalize userId to avoid "1.0" or other weird formats
    const normalizedId = Math.floor(Number(userId));
    console.log(`DEBUG: sendNotification called for userId: ${userId} -> normalized: ${normalizedId}`);
    
    if (io) {
        const roomName = `user_${normalizedId}`;
        io.to(roomName).emit('new_notification', data);
        console.log(`Notification emitted to room ${roomName}:`, data.title);
    } else {
        console.warn('DEBUG: Socket.io not initialized, cannot emit notification');
    }
};

module.exports = { initSocket, getIO, sendNotification };
