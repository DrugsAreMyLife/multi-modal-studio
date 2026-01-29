export interface RetouchInpaintPayload {
  imageUrl: string;
  maskUrl: string;
  prompt: string;
}

export interface RetouchInpaintResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  inpaintedImageUrl?: string;
  estimatedWait?: number;
  error?: string;
}
