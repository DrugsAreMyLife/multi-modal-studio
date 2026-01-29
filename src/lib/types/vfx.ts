export interface VfxCompositePayload {
  subjectUrl: string;
  backgroundUrl: string;
  mode?: 'alpha-matting' | 'chroma-key';
}

export interface VfxCompositeResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  compositionUrl?: string;
  estimatedWait?: number;
  error?: string;
}
