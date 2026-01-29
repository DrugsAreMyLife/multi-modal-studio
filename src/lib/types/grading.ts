export interface GradingApplyPayload {
  imageUrl: string;
  lutUrl?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export interface GradingApplyResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  gradedImageUrl?: string;
  estimatedWait?: number;
  error?: string;
}
