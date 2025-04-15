import { server } from './server';
import { connectToDatabase } from './config/database';
import { logger } from './config/logger';
import './config/queue'; // Import the queue to initialize it

const PORT = process.env.PORT || 3000;

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Start the server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Start the server
startServer(); 