export interface DepthPayload {
  imageUrl: string;
  model?: 'v2-small' | 'v2-medium' | 'v2-large';
}

export interface DepthResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  depthMapUrl?: string;
  estimatedWait?: number;
  error?: string;
}
