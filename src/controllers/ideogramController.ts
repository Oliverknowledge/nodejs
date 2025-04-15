import { Request, Response } from 'express';
import { imageProcessingQueue } from '../config/queue';
import IdeogramJob, { IIdeogramJob } from '../models/ideogramJob';
import { logger } from '../config/logger';

// Controller for creating a new image generation job
export const generateImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, style, aspect_ratio, seed } = req.body;

    // Validate required parameters
    if (!prompt) {
      res.status(400).json({ success: false, message: 'Prompt is required' });
      return;
    }

    // Create a new job in database
    const job = await IdeogramJob.create({
      type: 'generate',
      status: 'pending',
      params: { prompt, style, aspect_ratio, seed },
    });

    // Add job to the queue
    await imageProcessingQueue.add(
      'generate',
      { 
        jobId: job._id,
        type: 'generate', 
        prompt, 
        style,
        aspect_ratio,
        seed 
      }
    );

    res.status(201).json({
      success: true,
      message: 'Image generation job queued successfully',
      jobId: job._id,
    });
  } catch (error) {
    logger.error('Error in generateImage controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error queuing image generation job',
      error: (error as Error).message
    });
  }
};

// Controller for reframing an existing image
export const reframeImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { generation_id, aspect_ratio } = req.body;

    // Validate required parameters
    if (!generation_id) {
      res.status(400).json({ success: false, message: 'Generation ID is required' });
      return;
    }

    // Create a new job in database
    const job = await IdeogramJob.create({
      type: 'reframe',
      status: 'pending',
      params: { generation_id, aspect_ratio },
    });

    // Add job to the queue
    await imageProcessingQueue.add(
      'reframe',
      { 
        jobId: job._id,
        type: 'reframe', 
        generation_id, 
        aspect_ratio,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Image reframing job queued successfully',
      jobId: job._id,
    });
  } catch (error) {
    logger.error('Error in reframeImage controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error queuing image reframing job',
      error: (error as Error).message
    });
  }
};

// Controller for remixing an existing image
export const remixImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { generation_id, prompt, style, aspect_ratio, seed } = req.body;

    // Validate required parameters
    if (!generation_id || !prompt) {
      res.status(400).json({ 
        success: false, 
        message: 'Generation ID and prompt are required' 
      });
      return;
    }

    // Create a new job in database
    const job = await IdeogramJob.create({
      type: 'remix',
      status: 'pending',
      params: { generation_id, prompt, style, aspect_ratio, seed },
    });

    // Add job to the queue
    await imageProcessingQueue.add(
      'remix',
      { 
        jobId: job._id,
        type: 'remix', 
        generation_id, 
        prompt, 
        style,
        aspect_ratio,
        seed 
      }
    );

    res.status(201).json({
      success: true,
      message: 'Image remix job queued successfully',
      jobId: job._id,
    });
  } catch (error) {
    logger.error('Error in remixImage controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error queuing image remix job',
      error: (error as Error).message
    });
  }
};

// Controller for getting job status
export const getJobStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;

    const job = await IdeogramJob.findById(jobId);
    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }

    res.status(200).json({
      success: true,
      job: {
        id: job._id,
        type: job.type,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    });
  } catch (error) {
    logger.error('Error in getJobStatus controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting job status',
      error: (error as Error).message
    });
  }
};

// Controller for getting all jobs
export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await IdeogramJob.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs: jobs.map((job: IIdeogramJob) => ({
        id: job._id,
        type: job.type,
        status: job.status,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      })),
    });
  } catch (error) {
    logger.error('Error in getAllJobs controller:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting jobs',
      error: (error as Error).message
    });
  }
}; 