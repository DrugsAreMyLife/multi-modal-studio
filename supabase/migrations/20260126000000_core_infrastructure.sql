-- Migration: Core Infrastructure Extensions
-- Phase 1.1: model_registry, batch_queue, notifications, admin_approvals, tutorials, node_resources

-- 1. Model Registry
CREATE TABLE IF NOT EXISTS public.model_registry (
    id TEXT PRIMARY KEY, -- e.g., 'openai/gpt-5' or 'local/qwen-image'
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('cloud', 'local', 'edge')),
    type TEXT NOT NULL CHECK (type IN ('llm', 'image', 'video', 'audio', 'icon', 'multimodal')),
    vram_required_gb NUMERIC,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'downloading', 'error', 'offline')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_registry_category ON public.model_registry(category);
CREATE INDEX IF NOT EXISTS idx_model_registry_type ON public.model_registry(type);

-- 2. Batch Queue
CREATE TABLE IF NOT EXISTS public.batch_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id TEXT REFERENCES public.model_registry(id),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    priority INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'batched', 'processing', 'completed', 'failed')),
    batch_id UUID, -- If grouped into a single multi-job request
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batch_queue_model_id ON public.batch_queue(model_id);
CREATE INDEX IF NOT EXISTS idx_batch_queue_status ON public.batch_queue(status);

-- 3. User Notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'model_ready')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON public.user_notifications(user_id) WHERE is_read = FALSE;

-- 4. Model Tutorials
CREATE TABLE IF NOT EXISTS public.model_tutorials (
    model_id TEXT PRIMARY KEY REFERENCES public.model_registry(id) ON DELETE CASCADE,
    content_markdown TEXT NOT NULL,
    examples JSONB DEFAULT '[]'::jsonb,
    last_generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Node Resources (GPU Monitoring)
CREATE TABLE IF NOT EXISTS public.node_resources (
    id TEXT PRIMARY KEY, -- Hostname or unique node ID
    name TEXT NOT NULL,
    gpu_vram_total_gb NUMERIC NOT NULL,
    gpu_vram_used_gb NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_node_resources_status ON public.node_resources(status);

-- 6. Admin Approval Requests
CREATE TABLE IF NOT EXISTS public.admin_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  model_id TEXT REFERENCES public.model_registry(id) NOT NULL,
  node_id TEXT REFERENCES public.node_resources(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  request_reason TEXT,
  denial_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_approval_pending ON public.admin_approval_requests(node_id, status) WHERE status = 'pending';
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_duplicate_pending ON public.admin_approval_requests(user_id, model_id, node_id) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_approval_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view models" ON public.model_registry FOR SELECT USING (true);
CREATE POLICY "Anyone can view tutorials" ON public.model_tutorials FOR SELECT USING (true);

CREATE POLICY "Users can manage own notifications" ON public.user_notifications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can see own batch status" ON public.batch_queue
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own approvals" ON public.admin_approval_requests
    FOR SELECT USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_model_registry_updated_at
    BEFORE UPDATE ON public.model_registry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_batch_queue_updated_at
    BEFORE UPDATE ON public.batch_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
