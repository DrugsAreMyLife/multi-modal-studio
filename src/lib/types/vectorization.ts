export type VectorizationMode = 'trace' | 'centerline' | 'polygon';
export type OutputFormat = 'svg' | 'pdf' | 'eps' | 'dxf';

export interface VectorizationPayload {
  imageUrl: string;
  mode?: VectorizationMode;
  outputFormat?: OutputFormat;
  colorMode?: 'color' | 'grayscale' | 'binary';
  threshold?: number; // 0-255 for binary
  smoothing?: number; // 0-100
  simplification?: number; // 0-100
  minPathLength?: number;
  strokeWidth?: number;
}

export interface VectorizationPath {
  d: string; // SVG path data
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface VectorizationResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  svgUrl?: string;
  svgContent?: string;
  paths?: VectorizationPath[];
  dimensions?: { width: number; height: number };
  inputImageUrl: string;
  processingTime?: number;
  error?: string;
}
