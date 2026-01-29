export interface JobResult<T = unknown> {
  jobId: string;
  status: 'completed' | 'failed';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  duration: number; // ms
  completedAt: number;
}

export interface ProgressUpdate {
  jobId: string;
  progress: number; // 0-100
  stage?: string;
  message?: string;
  timestamp: number;
}

export interface SegmentationResult {
  masks: string[]; // URLs to mask images
  scores: number[];
  inputImageUrl: string;
  outputDir: string;
}

export interface VectorizationResult {
  svgUrl: string;
  svgContent: string;
  inputImageUrl: string;
}

export interface CreativeOperationResult {
  operation: string;
  artifactUrl: string;
  maskUrl?: string;
  metadata: Record<string, unknown>;
}
