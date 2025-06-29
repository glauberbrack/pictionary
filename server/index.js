import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const rooms = {};
const WORDS = ['cat', 'car', 'house', 'tree', 'dog'];

function generateRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (rooms[code]);
  return code;
}

function startRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  // Rotate drawer
  room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.players.length;
  const drawer = room.players[room.currentDrawerIndex];
  // Pick a new word
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  room.drawerId = drawer.id;
  room.word = word;
  room.chat = [];
  // Notify all players
  io.to(roomCode).emit('game_started', {
    drawerId: drawer.id,
    players: room.players,
    scores: room.scores,
  });
  // Send the word only to the drawer
  io.to(drawer.id).emit('your_word', { word });
  // Clear drawing (frontend should clear on new round)
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create_room', ({ playerName }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      creatorId: socket.id,
      players: [{ id: socket.id, name: playerName }],
      started: false,
      chat: [],
      scores: {},
      currentDrawerIndex: 0,
      drawerId: socket.id,
      word: '',
    };
    rooms[roomCode].scores[socket.id] = 0;
    socket.join(roomCode);
    socket.emit('room_created', {
      roomCode,
      players: rooms[roomCode].players,
      creatorId: socket.id,
    });
    console.log(`Room created: ${roomCode} by ${playerName}`);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('join_error', { message: 'Room not found.' });
      return;
    }
    if (room.started) {
      socket.emit('join_error', { message: 'Game already started.' });
      return;
    }
    // Prevent duplicate join
    if (!room.players.find(p => p.id === socket.id)) {
      room.players.push({ id: socket.id, name: playerName });
      room.scores[socket.id] = 0;
    }
    socket.join(roomCode);
    // Send chat history to the new player
    socket.emit('chat_history', room.chat || []);
    io.to(roomCode).emit('room_updated', {
      roomCode,
      players: room.players,
      creatorId: room.creatorId,
    });
    console.log(`${playerName} joined room ${roomCode}`);
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    if (room.creatorId !== socket.id) return;
    if (room.started) return;
    room.started = true;
    room.currentDrawerIndex = Math.floor(Math.random() * room.players.length);
    // Initialize scores
    room.scores = {};
    for (const p of room.players) room.scores[p.id] = 0;
    // Pick a random drawer
    const drawer = room.players[room.currentDrawerIndex];
    // Pick a random word
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    room.drawerId = drawer.id;
    room.word = word;
    room.chat = [];
    io.to(roomCode).emit('game_started', {
      drawerId: drawer.id,
      players: room.players,
      scores: room.scores,
    });
    io.to(drawer.id).emit('your_word', { word });
    console.log(`Game started in room ${roomCode}. Drawer: ${drawer.name}, Word: ${word}`);
  });

  socket.on('drawing_data', ({ roomCode, data }) => {
    // Broadcast to all except sender
    socket.to(roomCode).emit('drawing_data', data);
  });

  socket.on('guess', ({ roomCode, playerName, message }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const chatMsg = { playerName, message };
    room.chat = room.chat || [];
    // Check if guess is correct (case-insensitive, trimmed)
    if (message.trim().toLowerCase() === (room.word || '').trim().toLowerCase()) {
      // Award point to guesser
      room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
      io.to(roomCode).emit('correct_guess', { playerName, word: room.word, scores: room.scores });
      // Start next round after short delay
      setTimeout(() => startRound(roomCode), 2000);
    } else {
      room.chat.push(chatMsg);
      io.to(roomCode).emit('chat_message', chatMsg);
    }
  });

  socket.on('disconnect', () => {
    // Remove player from all rooms
    for (const [code, room] of Object.entries(rooms)) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        const [removed] = room.players.splice(idx, 1);
        io.to(code).emit('room_updated', {
          roomCode: code,
          players: room.players,
          creatorId: room.creatorId,
        });
        console.log(`${removed.name} left room ${code}`);
        // Clean up empty rooms
        if (room.players.length === 0) {
          delete rooms[code];
          console.log(`Room ${code} deleted (empty)`);
        }
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 