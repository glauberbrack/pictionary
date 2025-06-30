import { generateRoomCode } from './gameLogic.js';

function createRoom(rooms, socket, playerName) {
  const roomCode = generateRoomCode(rooms);
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
  return roomCode;
}

function joinRoom(rooms, socket, roomCode, playerName) {
  const room = rooms[roomCode];
  if (!room) return { error: 'Room not found.' };
  if (room.started) return { error: 'Game already started.' };
  if (!room.players.find(p => p.id === socket.id)) {
    room.players.push({ id: socket.id, name: playerName });
    room.scores[socket.id] = 0;
  }
  socket.join(roomCode);
  return { room };
}

function deleteRoom(rooms, roomCode) {
  delete rooms[roomCode];
}

export { createRoom, joinRoom, deleteRoom }; 