// A stand-in for Socket.IO that records every emit, per room or socket.
function fakeIo() {
  const sent = [];
  const sockets = new Map();
  const io = {
    sent,
    sockets: { sockets },
    to: (target) => ({ emit: (event, data) => sent.push({ target, event, data }) }),
    addSocket(id) {
      const socket = {
        id,
        rooms: new Set(),
        emitted: [],
        join(room) { this.rooms.add(room); },
        leave(room) { this.rooms.delete(room); },
        emit(event, data) { this.emitted.push({ event, data }); },
      };
      sockets.set(id, socket);
      return socket;
    },
    events: (name) => sent.filter((e) => e.event === name),
  };
  return io;
}

// An 11x11 board with open corridors and no crates, for predictable tests.
function openMaze() {
  const width = 11;
  const height = 11;
  const grid = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      const edge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      grid[y][x] = edge || (x % 2 === 0 && y % 2 === 0) ? 1 : 0;
    }
  }
  return { width, height, grid, powerUps: [], spawnPoints: [{ x: 1, y: 1 }, { x: 9, y: 9 }, { x: 9, y: 1 }, { x: 1, y: 9 }] };
}

const QUESTION = {
  id: 'q1',
  questionText: 'What is 3 + 4?',
  options: [{ text: '5', isCorrect: false }, { text: '7', isCorrect: true }, { text: '8', isCorrect: false }],
};

module.exports = { fakeIo, openMaze, QUESTION };
