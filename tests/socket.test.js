const { Server } = require('socket.io');
const Client = require('socket.io-client');
const http = require('http');
const { setupRealtime } = require('../src/realtime/socket');

describe('WebSocket Real-time', () => {
  let io, server, clientSocket;
  beforeAll((done) => {
    const app = http.createServer();
    io = new Server(app);
    setupRealtime(io);
    app.listen(() => {
      const port = app.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
    server = app;
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    server.close();
  });

  it('should respond to ping with pong', (done) => {
    clientSocket.emit('ping');
    clientSocket.on('pong', () => {
      done();
    });
  });

  it('should handle subscribe and emit user_joined', (done) => {
    clientSocket.emit('subscribe', { matchId: 'test' });
    clientSocket.on('user_joined', (data) => {
      expect(data).toHaveProperty('userId');
      done();
    });
  });
});
