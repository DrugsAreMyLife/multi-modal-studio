export interface AudioTtsPayload {
  text: string;
  voiceId?: string;
  language?: string;
}

export interface AudioTtsResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  estimatedWait?: number;
  error?: string;
}
