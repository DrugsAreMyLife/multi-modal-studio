import type { ComfyUIWorkflow } from './types';

// Workflow Generation Types
export enum GenerationConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export interface WorkflowGenerationConfig {
  model: 'gpt-4o-mini' | 'claude-haiku-3.5' | 'gemini-pro';
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
  timeout: number; // milliseconds
}

export interface WorkflowGenerationMetrics {
  generationTimeMs: number;
  tokenCount: number;
  retryCount: number;
  fallbackUsed: boolean;
}

export interface TemplateMatchScore {
  templateId: string;
  score: number; // 0-1
  confidence: GenerationConfidence;
  reasoning: string;
}

export interface ParameterExtractionResult {
  parameters: Record<string, unknown>;
  confidence: number; // 0-1
  missingRequired: string[];
  inferredDefaults: Record<string, unknown>;
}

export interface WorkflowGenerationResult {
  workflow: ComfyUIWorkflow;
  confidence: GenerationConfidence;
  explanation: string;
  templateUsed: string;
  parameters: Record<string, unknown>;
  metrics: WorkflowGenerationMetrics;
}
