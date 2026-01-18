-- Migration: Add Shared Content and Video Jobs, and align Generations
-- Purpose: Support sharing, async job tracking, and improved generation metadata

-- Align Generations table
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS provider_job_id TEXT;

CREATE INDEX IF NOT EXISTS idx_generations_provider_job_id ON public.generations(provider_job_id);

-- Shared Content table
CREATE TABLE IF NOT EXISTS public.shared_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'analysis')),
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_content_slug ON public.shared_content(slug);

ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view shared content
CREATE POLICY "Anyone can view shared content" ON public.shared_content
    FOR SELECT USING (true);

-- Users can only delete their own shared content
CREATE POLICY "Users can manage own shared content" ON public.shared_content
    FOR ALL USING (auth.uid() = user_id);

-- Video Jobs table (for tracking long-running provider processes)
CREATE TABLE IF NOT EXISTS public.video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_job_id TEXT UNIQUE NOT NULL,
    prompt TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result_url TEXT,
    error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON public.video_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_provider_job_id ON public.video_jobs(provider_job_id);

ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own video jobs" ON public.video_jobs
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for video_jobs updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_video_jobs_updated_at ON public.video_jobs;
CREATE TRIGGER update_video_jobs_updated_at
    BEFORE UPDATE ON public.video_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
