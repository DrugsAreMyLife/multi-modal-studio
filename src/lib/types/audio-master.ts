export interface AudioMasterPayload {
  audioUrl: string;
  targetLufs?: number;
}

export interface AudioMasterResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  masteredAudioUrl?: string;
  estimatedWait?: number;
  error?: string;
}
