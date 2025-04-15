import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import { logger } from './logger';
import { processIdeogramJob } from '../services/ideogramService';
import IdeogramJob from '../models/ideogramJob';
import { emitToRoom } from '../utils/socket';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// Redis connection config
const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
};

// Define the queue for image processing jobs
export const imageProcessingQueue = new Queue('image-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50, // Keep the last 50 completed jobs
    removeOnFail: 1000, // Keep the last 1000 failed jobs
  },
});

// Set up the worker to process jobs from the queue
export const worker = new Worker(
  'image-processing',
  async (job) => {
    logger.info(`Processing job ${job.id} of type: ${job.name}`);
    
    try {
      // Update job status to processing
      await IdeogramJob.findByIdAndUpdate(job.data.jobId, { status: 'processing' });
      
      // Emit event for job status update
      emitToRoom(`job-${job.data.jobId}`, 'job-update', {
        jobId: job.data.jobId,
        status: 'processing',
      });
      
      const result = await processIdeogramJob(job.data);
      return result;
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  { connection, concurrency: 5 }
);

// Set up event listeners for the worker
worker.on('completed', async (job) => {
  logger.info(`Job ${job?.id} completed`);
  
  if (job?.data.jobId) {
    // Get updated job from database
    const updatedJob = await IdeogramJob.findById(job.data.jobId);
    
    // Emit event for job status update
    emitToRoom(`job-${job.data.jobId}`, 'job-update', {
      jobId: job.data.jobId,
      status: 'completed',
      result: updatedJob?.result,
    });
  }
});

worker.on('failed', async (job, error) => {
  logger.error(`Job ${job?.id} failed:`, error);
  
  if (job?.data.jobId) {
    // Update job status to failed
    await IdeogramJob.findByIdAndUpdate(job.data.jobId, {
      status: 'failed',
      error: error.message || 'Unknown error',
    });
    
    // Emit event for job status update
    emitToRoom(`job-${job.data.jobId}`, 'job-update', {
      jobId: job.data.jobId,
      status: 'failed',
      error: error.message,
    });
  }
});

process.on('SIGTERM', async () => {
  await worker.close();
  await imageProcessingQueue.close();
  logger.info('BullMQ connections closed due to app termination');
});

export default imageProcessingQueue; 