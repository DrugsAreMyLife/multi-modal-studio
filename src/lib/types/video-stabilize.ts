export interface VideoStabilizePayload {
  videoUrl: string;
  intensity?: number;
}

export interface VideoStabilizeResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stabilizedVideoUrl?: string;
  estimatedWait?: number;
  error?: string;
}
