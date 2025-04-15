# Ideogram API Server

A Node.js server that processes images via the Ideogram API and saves them to Cloudinary in PNG format.

## Features

- Image generation, reframing, and remixing using Ideogram API
- Job queue management using BullMQ
- Real-time job status updates via WebSockets
- MongoDB for persistence of job status
- Cloudinary integration for image storage

## Prerequisites

- Node.js 18 or higher
- MongoDB
- Redis (for BullMQ)
- Ideogram API key
- Cloudinary account

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ideogram-api
REDIS_HOST=localhost
REDIS_PORT=6379
IDEOGRAM_API_KEY=your_ideogram_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NODE_ENV=development
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the project:
   ```
   npm run build
   ```
4. Start the server:
   ```
   npm start
   ```

For development:
```
npm run dev
```

## API Endpoints

### Generate Image
- **URL**: `/api/ideogram/generate`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "prompt": "A beautiful sunset over mountains",
    "style": "imagine",
    "aspect_ratio": "1:1",
    "seed": 12345
  }
  ```

### Reframe Image
- **URL**: `/api/ideogram/reframe`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "generation_id": "your_generation_id",
    "aspect_ratio": "16:9"
  }
  ```

### Remix Image
- **URL**: `/api/ideogram/remix`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "generation_id": "your_generation_id",
    "prompt": "A beautiful sunset over mountains with birds",
    "style": "imagine",
    "aspect_ratio": "1:1",
    "seed": 12345
  }
  ```

### Get Job Status
- **URL**: `/api/ideogram/jobs/:jobId`
- **Method**: `GET`

### Get All Jobs
- **URL**: `/api/ideogram/jobs`
- **Method**: `GET`

## WebSocket Events

- **subscribe**: Subscribe to job status updates
  ```javascript
  socket.emit('subscribe', 'job_id');
  ```

- **unsubscribe**: Unsubscribe from job status updates
  ```javascript
  socket.emit('unsubscribe', 'job_id');
  ```

- **job-update**: Receive job status updates
  ```javascript
  socket.on('job-update', (data) => {
    console.log(data);
  });
  ```

## Deployment

The server can be deployed to any platform that supports Node.js, such as:
- AWS Elastic Beanstalk
- Heroku
- Digital Ocean
- Google Cloud Run
- Microsoft Azure

For Cloudinary integration, make sure to set the environment variables for your Cloudinary credentials.

## License

MIT 