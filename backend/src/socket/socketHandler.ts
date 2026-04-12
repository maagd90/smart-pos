import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, logger } from '../utils/constants';
import { prisma } from '../db/prismaClient';

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export function setupSocket(io: Server): void {
  // Authentication middleware for socket connections
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    logger.info(`Socket connected: ${socket.id} user: ${socket.userId}`);

    // Join role-based rooms
    if (socket.userRole) {
      void socket.join(`role:${socket.userRole}`);
    }

    // Machine heartbeat
    socket.on('machine:heartbeat', async (data: { machineId: string }) => {
      try {
        await prisma.machine.update({
          where: { id: data.machineId },
          data: { status: 'ONLINE', lastSeen: new Date() },
        });
        io.emit('machine:status', { machineId: data.machineId, status: 'ONLINE' });
      } catch {
        // Machine may not exist yet
      }
    });

    socket.on('machine:offline', async (data: { machineId: string }) => {
      try {
        await prisma.machine.update({
          where: { id: data.machineId },
          data: { status: 'OFFLINE', lastSeen: new Date() },
        });
        io.emit('machine:status', { machineId: data.machineId, status: 'OFFLINE' });
      } catch {
        // ignore
      }
    });

    // Subscribe to inventory updates for a product
    socket.on('inventory:subscribe', (productId: string) => {
      void socket.join(`inventory:${productId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}
