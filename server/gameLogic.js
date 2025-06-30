const WORDS = ['cat', 'car', 'house', 'tree', 'dog'];

function generateRoomCode(rooms) {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 7).toUpperCase();
  } while (rooms[code]);
  return code;
}

function startRound(io, rooms, roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.players.length;
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
}

export { WORDS, generateRoomCode, startRound }; 