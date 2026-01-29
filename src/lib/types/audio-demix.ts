export interface AudioDemixPayload {
  audioUrl: string;
  stems?: ('vocals' | 'drums' | 'bass' | 'other')[];
}

export interface AudioDemixResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  stemUrls?: Record<string, string>;
  estimatedWait?: number;
  error?: string;
}
