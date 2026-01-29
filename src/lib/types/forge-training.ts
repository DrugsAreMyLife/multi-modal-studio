export interface ForgeTrainingPayload {
  images: string[];
  conceptName: string;
  instancePrompt: string;
}

export interface ForgeTrainingResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  modelPath?: string;
  estimatedWait?: number;
  error?: string;
}
