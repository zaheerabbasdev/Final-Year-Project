const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Adjust this for production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_room', (userId) => {
            const normalizedId = Math.floor(Number(userId));
            console.log(`DEBUG: Socket ${socket.id} joining room for userId: ${userId} -> normalized: ${normalizedId}`);
            const roomName = `user_${normalizedId}`;
            socket.join(roomName);
            console.log(`User ${normalizedId} joined room: ${roomName}`);
            console.log(`DEBUG: Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
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
