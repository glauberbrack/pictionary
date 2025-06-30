import { WORDS, startRound } from './gameLogic.js';
import { createRoom, joinRoom } from './roomManager.js';

function registerSocketHandlers(io, rooms) {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('create_room', ({ playerName }) => {
      const roomCode = createRoom(rooms, socket, playerName);
      socket.emit('room_created', {
        roomCode,
        players: rooms[roomCode].players,
        creatorId: socket.id,
      });
      console.log(`Room created: ${roomCode} by ${playerName}`);
    });

    socket.on('join_room', ({ roomCode, playerName }) => {
      const result = joinRoom(rooms, socket, roomCode, playerName);
      if (result.error) {
        socket.emit('join_error', { message: result.error });
        return;
      }
      const room = result.room;
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
      room.scores = {};
      for (const p of room.players) room.scores[p.id] = 0;
      const drawer = room.players[room.currentDrawerIndex];
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
      socket.to(roomCode).emit('drawing_data', data);
    });

    socket.on('guess', ({ roomCode, playerName, message }) => {
      const room = rooms[roomCode];
      if (!room) return;
      const chatMsg = { playerName, message };
      room.chat = room.chat || [];
      if (message.trim().toLowerCase() === (room.word || '').trim().toLowerCase()) {
        room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
        io.to(roomCode).emit('correct_guess', { playerName, word: room.word, scores: room.scores });
        setTimeout(() => startRound(io, rooms, roomCode), 2000);
      } else {
        room.chat.push(chatMsg);
        io.to(roomCode).emit('chat_message', chatMsg);
      }
    });

    socket.on('disconnect', () => {
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
          if (room.players.length === 0) {
            delete rooms[code];
            console.log(`Room ${code} deleted (empty)`);
          }
        }
      }
      console.log('User disconnected:', socket.id);
    });
  });
}

export { registerSocketHandlers }; 