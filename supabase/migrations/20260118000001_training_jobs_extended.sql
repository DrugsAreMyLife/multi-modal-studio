-- Migration: Extended Training Jobs Schema
-- Purpose: Add monitoring fields for real-time progress tracking and visualization

-- Add monitoring fields to training_jobs
ALTER TABLE public.training_jobs
ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_steps INTEGER,
ADD COLUMN IF NOT EXISTS loss_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sample_images JSONB DEFAULT '[]'::jsonb;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_training_jobs_progress ON public.training_jobs(progress_percent);

-- Add fields to trained_models for better metadata
ALTER TABLE public.trained_models
ADD COLUMN IF NOT EXISTS output_path TEXT,
ADD COLUMN IF NOT EXISTS safetensors_url TEXT,
ADD COLUMN IF NOT EXISTS training_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS final_loss NUMERIC(10, 6);

-- Create index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_trained_models_name ON public.trained_models(name);

-- Comment for documentation
COMMENT ON COLUMN public.training_jobs.loss_history IS 'Array of {step: number, loss: number} objects tracking loss over time';
COMMENT ON COLUMN public.training_jobs.sample_images IS 'Array of {step: number, url: string} objects for sample images generated during training';
COMMENT ON COLUMN public.training_jobs.progress_percent IS 'Training progress from 0-100 percent';
