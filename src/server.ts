import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { logger, stream } from './config/logger';
import { connectToDatabase } from './config/database';
import ideogramRoutes from './routes/ideogramRoutes';
import errorHandler from './middlewares/errorHandler';
import { setSocketInstance } from './utils/socket';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Set socket instance in the utility
setSocketInstance(io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe', (jobId) => {
    logger.info(`Client ${socket.id} subscribed to job: ${jobId}`);
    socket.join(`job-${jobId}`);
  });

  socket.on('unsubscribe', (jobId) => {
    logger.info(`Client ${socket.id} unsubscribed from job: ${jobId}`);
    socket.leave(`job-${jobId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Store io instance on app for use in controllers
app.set('io', io);

// API Routes
app.use('/api/ideogram', ideogramRoutes);

// Root route - redirect to HTML client
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use(errorHandler);

// Export the app and server
export { app, server }; 