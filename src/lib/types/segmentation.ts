export type SegmentationMode = 'automatic' | 'point' | 'box' | 'text';

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SegmentationPayload {
  imageUrl: string;
  mode: SegmentationMode;
  points?: Point2D[];
  labels?: number[]; // 1 for foreground, 0 for background
  boxes?: BoundingBox[];
  textPrompt?: string;
  multimaskOutput?: boolean;
  returnLogits?: boolean;
}

export interface SegmentationMask {
  id: string;
  maskUrl: string;
  score: number;
  area: number;
  bbox: BoundingBox;
  predictedIou: number;
  stability: number;
}

export interface SegmentationResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  masks?: SegmentationMask[];
  inputImageUrl?: string;
  outputDir?: string;
  processingTime?: number;
  estimatedWait?: number;
  error?: string;
}
