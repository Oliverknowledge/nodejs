import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';
import { uploadImageToCloudinary } from '../config/cloudinary';
import { IdeogramJobType } from '../models/ideogramJob';

// API URLs
const IDEOGRAM_API_BASE_URL = 'https://api.ideogram.ai';
const GENERATE_ENDPOINT = `${IDEOGRAM_API_BASE_URL}/generate`;
const REFRAME_ENDPOINT = `${IDEOGRAM_API_BASE_URL}/reframe`;
const REMIX_ENDPOINT = `${IDEOGRAM_API_BASE_URL}/remix`;

// Ideogram API Key from environment variables
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY;

// Interface for API response
interface IdeogramApiResponse {
  success: boolean;
  message?: string;
  imageUrl?: string;
  generation_id?: string;
  error?: any;
  cloudinaryUrl?: string;
}

/**
 * Process a job from the queue
 */
export const processIdeogramJob = async (jobData: any): Promise<IdeogramApiResponse> => {
  try {
    let result: IdeogramApiResponse;
    
    // Process different job types
    switch (jobData.type) {
      case 'generate':
        result = await generateImage(jobData);
        break;
      case 'reframe':
        result = await reframeImage(jobData);
        break;
      case 'remix':
        result = await remixImage(jobData);
        break;
      default:
        throw new Error(`Unknown job type: ${jobData.type}`);
    }

    // If successful, download the image and upload to Cloudinary
    if (result.success && result.imageUrl) {
      const cloudinaryUrl = await downloadAndUploadImage(result.imageUrl, jobData.type);
      return { ...result, cloudinaryUrl };
    }

    return result;
  } catch (error) {
    logger.error('Error processing Ideogram job:', error);
    return {
      success: false,
      error,
      message: (error as Error).message,
    };
  }
};

/**
 * Generate a new image using Ideogram API
 */
const generateImage = async (data: any): Promise<IdeogramApiResponse> => {
  try {
    // Set up request configuration
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IDEOGRAM_API_KEY}`,
      },
    };

    // Prepare request payload
    const payload = {
      prompt: data.prompt,
      style: data.style || 'imagine',
      aspect_ratio: data.aspect_ratio || '1:1',
      seed: data.seed,
    };

    // Make API request
    const response = await axios.post(GENERATE_ENDPOINT, payload, config);

    // Check if successful
    if (response.data && response.data.generation_id) {
      return {
        success: true,
        generation_id: response.data.generation_id,
        imageUrl: response.data.url,
      };
    }

    return {
      success: false,
      message: 'Failed to generate image, no generation_id returned',
      error: response.data,
    };
  } catch (error) {
    logger.error('Error generating image with Ideogram API:', error);
    return {
      success: false,
      message: (error as Error).message,
      error,
    };
  }
};

/**
 * Reframe an existing image using Ideogram API
 */
const reframeImage = async (data: any): Promise<IdeogramApiResponse> => {
  try {
    // Set up request configuration
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IDEOGRAM_API_KEY}`,
      },
    };

    // Prepare request payload
    const payload = {
      generation_id: data.generation_id,
      aspect_ratio: data.aspect_ratio || '1:1',
    };

    // Make API request
    const response = await axios.post(REFRAME_ENDPOINT, payload, config);

    // Check if successful
    if (response.data && response.data.url) {
      return {
        success: true,
        generation_id: data.generation_id,
        imageUrl: response.data.url,
      };
    }

    return {
      success: false,
      message: 'Failed to reframe image',
      error: response.data,
    };
  } catch (error) {
    logger.error('Error reframing image with Ideogram API:', error);
    return {
      success: false,
      message: (error as Error).message,
      error,
    };
  }
};

/**
 * Remix an existing image using Ideogram API
 */
const remixImage = async (data: any): Promise<IdeogramApiResponse> => {
  try {
    // Set up request configuration
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IDEOGRAM_API_KEY}`,
      },
    };

    // Prepare request payload
    const payload = {
      generation_id: data.generation_id,
      prompt: data.prompt,
      style: data.style || 'imagine',
      aspect_ratio: data.aspect_ratio || '1:1',
      seed: data.seed,
    };

    // Make API request
    const response = await axios.post(REMIX_ENDPOINT, payload, config);

    // Check if successful
    if (response.data && response.data.generation_id) {
      return {
        success: true,
        generation_id: response.data.generation_id,
        imageUrl: response.data.url,
      };
    }

    return {
      success: false,
      message: 'Failed to remix image',
      error: response.data,
    };
  } catch (error) {
    logger.error('Error remixing image with Ideogram API:', error);
    return {
      success: false,
      message: (error as Error).message,
      error,
    };
  }
};

/**
 * Download image from URL and upload to Cloudinary
 */
const downloadAndUploadImage = async (imageUrl: string, jobType: IdeogramJobType): Promise<string> => {
  try {
    // Create a temporary file path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `ideogram-${uuidv4()}.png`);
    
    // Download the image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
    });

    // Save the image to a temporary file
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);

    // Wait for the download to complete
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', (err) => reject(err));
    });

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadImageToCloudinary(tempFilePath, `ideogram/${jobType}`);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    return cloudinaryUrl;
  } catch (error) {
    logger.error('Error downloading and uploading image:', error);
    throw error;
  }
}; 