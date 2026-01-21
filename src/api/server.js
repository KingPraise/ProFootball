require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const matchRoutes = require('./matches');
const { setupRealtime } = require('../realtime/socket');
const { startSimulator } = require('../simulator/simulator');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

// REST API routes
app.use('/api/matches', matchRoutes);

// Health check
app.get('/health', (req, res) => res.json({ success: true, data: 'OK', error: null }));

// Real-time (WebSocket) setup
setupRealtime(io);

// Start match simulator
startSimulator(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
