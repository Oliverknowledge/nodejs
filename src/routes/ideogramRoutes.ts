import { Router } from 'express';
import {
  generateImage,
  reframeImage,
  remixImage,
  getJobStatus,
  getAllJobs,
} from '../controllers/ideogramController';

const router = Router();

// POST route for image generation
router.post('/generate', generateImage);

// POST route for image reframing
router.post('/reframe', reframeImage);

// POST route for image remixing
router.post('/remix', remixImage);

// GET route for job status
router.get('/jobs/:jobId', getJobStatus);

// GET route for all jobs
router.get('/jobs', getAllJobs);

export default router; 