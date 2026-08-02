import { io } from 'socket.io-client';

let socket;

const getBackendUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:5000';
  }
  return window.location.origin;
};

export function initSocket(token) {
  if (!token) return null;
  if (socket) return socket;

  socket = io(getBackendUrl(), {
    auth: { token },
    transports: ['websocket'],
    withCredentials: true,
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message || error);
  });

  return socket;
}

export function subscribe(event, callback) {
  if (!socket) return () => {};
  socket.on(event, callback);
  return () => {
    socket.off(event, callback);
  };
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
