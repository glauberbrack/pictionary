import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const rooms = {};

registerSocketHandlers(io, rooms);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 