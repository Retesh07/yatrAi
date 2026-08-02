const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error')); 
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      return next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    console.log(`Socket connected: ${socket.id} user:${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function broadcastPublicTrip(payload) {
  if (!io) return;
  io.emit('publicTripShared', payload);
}

module.exports = {
  initSocket,
  emitToUser,
  broadcastPublicTrip,
};
