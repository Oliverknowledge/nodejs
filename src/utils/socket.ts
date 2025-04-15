import { Server } from 'socket.io';
import { logger } from '../config/logger';

// Global variable to hold the socket instance
let io: Server | null = null;

/**
 * Set the Socket.IO instance
 */
export const setSocketInstance = (socketInstance: Server): void => {
  io = socketInstance;
  logger.info('Socket.IO instance set in utility');
};

/**
 * Emit an event to a room
 */
export const emitToRoom = (room: string, event: string, data: any): void => {
  if (io) {
    io.to(room).emit(event, data);
  } else {
    logger.warn('Attempted to emit socket event but no Socket.IO instance available');
  }
};

/**
 * Emit an event to all clients
 */
export const emitToAll = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  } else {
    logger.warn('Attempted to emit socket event but no Socket.IO instance available');
  }
};

/**
 * Join a client to a room
 */
export const joinRoom = (socketId: string, room: string): void => {
  if (io) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
      logger.info(`Socket ${socketId} joined room: ${room}`);
    }
  }
};

/**
 * Get the Socket.IO instance (for testing or advanced usage)
 */
export const getSocketInstance = (): Server | null => {
  return io;
}; 