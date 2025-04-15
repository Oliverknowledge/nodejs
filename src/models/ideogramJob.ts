import mongoose, { Document, Schema } from 'mongoose';

// Define the job type enum
export type IdeogramJobType = 'generate' | 'reframe' | 'remix';

// Define the job status enum
export type IdeogramJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Interface for the Ideogram job
export interface IIdeogramJob extends Document {
  type: IdeogramJobType;
  status: IdeogramJobStatus;
  params: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const ideogramJobSchema = new Schema<IIdeogramJob>(
  {
    type: {
      type: String,
      required: true,
      enum: ['generate', 'reframe', 'remix'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    params: {
      type: Schema.Types.Mixed,
      required: true,
    },
    result: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create and export the model
export const IdeogramJob = mongoose.model<IIdeogramJob>('IdeogramJob', ideogramJobSchema);

export default IdeogramJob; 