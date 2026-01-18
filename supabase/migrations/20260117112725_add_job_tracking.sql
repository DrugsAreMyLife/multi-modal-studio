-- Add status and provider_job_id to generations table
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS provider_job_id TEXT;

-- Create an index for searching by job id
CREATE INDEX IF NOT EXISTS idx_generations_provider_job_id ON public.generations(provider_job_id);
