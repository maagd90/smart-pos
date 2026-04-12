import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(events?: Record<string, (data: unknown) => void>) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return socketRef;
}
