import { io } from 'socket.io-client';

let socket = null;
let socketToken = null;

export function getSocket() {
  return socket;
}

// Reuses the open connection unless the player has signed in or out since it was made.
export function connectSocket(token) {
  if (socket && socketToken === (token || null)) return socket;
  if (socket) socket.disconnect();

  socketToken = token || null;
  socket = io('/', {
    auth: { token: socketToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
}
