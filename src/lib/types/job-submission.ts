export type WorkerId =
  | 'sam2'
  | 'hunyuan-video'
  | 'hunyuan-image'
  | 'qwen-image'
  | 'qwen-geo'
  | 'svg-turbo'
  | 'depth-anything'
  | 'demucs'
  | 'vfx-composite'
  | 'color-grading'
  | 'retouch-inpaint'
  | 'audio-master'
  | 'audio-tts'
  | 'video-stabilize'
  | 'forge-training';

export interface JobSubmission {
  id: string;
  workerId: WorkerId;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  createdAt: number;
}

export interface JobStatus {
  id: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed';
  workerId: WorkerId;
  progress: number; // 0-100
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

export interface SubmitJobOptions {
  workerId: WorkerId;
  payload: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  waitForReady?: boolean;
  timeout?: number;
}

export interface SubmitJobResult {
  jobId: string;
  status: JobStatus['status'];
  estimatedWait?: number;
}
