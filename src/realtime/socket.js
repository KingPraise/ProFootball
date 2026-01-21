const { v4: uuidv4 } = require('uuid');
const redis = require('../services/redis');
const { EventType } = require('../types');

const CHAT_RATE_LIMIT_MS = 1000;
const CHAT_MAX_LENGTH = 300;
const TYPING_TIMEOUT_MS = 4000;

const userLastMessage = new Map(); // userId -> timestamp
const typingTimers = new Map(); // socket.id -> timeout

function setupRealtime(io) {
  io.on('connection', (socket) => {
    let currentRooms = new Set();
    let userId = socket.handshake.query.userId || uuidv4();
    socket.data.userId = userId;

    // Heartbeat
    socket.on('ping', () => socket.emit('pong'));

    // Subscribe to match room
    socket.on('subscribe', ({ matchId }) => {
      if (!matchId) return socket.emit('error', { error: 'matchId required' });
      socket.join(`match:${matchId}`);
      currentRooms.add(matchId);
      io.to(`match:${matchId}`).emit('user_joined', { userId });
      updateUserCount(io, matchId);
    });

    // Unsubscribe
    socket.on('unsubscribe', ({ matchId }) => {
      if (!matchId) return;
      socket.leave(`match:${matchId}`);
      currentRooms.delete(matchId);
      io.to(`match:${matchId}`).emit('user_left', { userId });
      updateUserCount(io, matchId);
    });

    // Chat message
    socket.on('chat', ({ matchId, message }) => {
      if (!matchId || typeof message !== 'string') return;
      if (message.length > CHAT_MAX_LENGTH || !message.trim()) {
        return socket.emit('error', { error: 'Invalid message' });
      }
      const now = Date.now();
      if (userLastMessage.get(userId) && now - userLastMessage.get(userId) < CHAT_RATE_LIMIT_MS) {
        return socket.emit('error', { error: 'Rate limit exceeded' });
      }
      userLastMessage.set(userId, now);
      io.to(`match:${matchId}`).emit('chat', { userId, message, ts: now });
    });

    // Typing indicator
    socket.on('typing', ({ matchId, typing }) => {
      if (!matchId) return;
      io.to(`match:${matchId}`).emit('typing', { userId, typing: !!typing });
      if (typing) {
        clearTimeout(typingTimers.get(socket.id));
        typingTimers.set(socket.id, setTimeout(() => {
          io.to(`match:${matchId}`).emit('typing', { userId, typing: false });
        }, TYPING_TIMEOUT_MS));
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      for (const matchId of currentRooms) {
        io.to(`match:${matchId}`).emit('user_left', { userId });
        updateUserCount(io, matchId);
      }
      typingTimers.delete(socket.id);
    });
  });
}

async function updateUserCount(io, matchId) {
  const room = io.sockets.adapter.rooms.get(`match:${matchId}`);
  const count = room ? room.size : 0;
  io.to(`match:${matchId}`).emit('user_count', { count });
}

module.exports = { setupRealtime };
