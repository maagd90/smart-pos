import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const onInventoryUpdate = (callback: (data: unknown) => void) => {
  socket?.on('inventory:update', callback);
};

export const onNewTransaction = (callback: (data: unknown) => void) => {
  socket?.on('transaction:new', callback);
};

export const onLowStockAlert = (callback: (data: unknown) => void) => {
  socket?.on('inventory:low-stock', callback);
};

export const offInventoryUpdate = (callback: (data: unknown) => void) => {
  socket?.off('inventory:update', callback);
};

export const offNewTransaction = (callback: (data: unknown) => void) => {
  socket?.off('transaction:new', callback);
};
