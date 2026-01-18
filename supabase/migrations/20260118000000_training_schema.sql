-- Migration: Training Infrastructure Schema
-- Purpose: Support dataset management, training jobs, and trained models

-- Datasets table
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lora', 'dreambooth', 'textual_inversion', 'checkpoint', 'general')),
    image_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'creating' CHECK (status IN ('creating', 'ready', 'processing', 'error')),
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_status ON public.datasets(status);

-- Dataset images table
CREATE TABLE IF NOT EXISTS public.dataset_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    caption TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dataset_images_dataset_id ON public.dataset_images(dataset_id);

-- Training jobs table
CREATE TABLE IF NOT EXISTS public.training_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
    name TEXT,
    type TEXT NOT NULL CHECK (type IN ('lora', 'dreambooth', 'textual_inversion', 'checkpoint')),
    base_model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled')),
    config JSONB NOT NULL,
    logs_path TEXT,
    output_model_path TEXT,
    progress JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_jobs_user_id ON public.training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON public.training_jobs(status);
CREATE INDEX IF NOT EXISTS idx_training_jobs_dataset_id ON public.training_jobs(dataset_id);

-- Trained models table
CREATE TABLE IF NOT EXISTS public.trained_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    training_job_id UUID REFERENCES public.training_jobs(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('lora', 'dreambooth', 'textual_inversion', 'checkpoint')),
    base_model TEXT NOT NULL,
    file_path TEXT NOT NULL,
    trigger_words TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trained_models_user_id ON public.trained_models(user_id);
CREATE INDEX IF NOT EXISTS idx_trained_models_training_job_id ON public.trained_models(training_job_id);

-- Enable RLS
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trained_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own datasets" ON public.datasets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own dataset images" ON public.dataset_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.datasets
            WHERE datasets.id = dataset_images.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own training jobs" ON public.training_jobs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trained models" ON public.trained_models
    FOR ALL USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_datasets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_datasets_updated_at_trigger ON public.datasets;
CREATE TRIGGER update_datasets_updated_at_trigger
    BEFORE UPDATE ON public.datasets
    FOR EACH ROW EXECUTE FUNCTION update_datasets_updated_at();

DROP TRIGGER IF EXISTS update_training_jobs_updated_at_trigger ON public.training_jobs;
CREATE TRIGGER update_training_jobs_updated_at_trigger
    BEFORE UPDATE ON public.training_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
