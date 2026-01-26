// Server-side Supabase client (no 'use client' directive)
// Use this in API routes and server components
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server uses private env vars (not NEXT_PUBLIC_*)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create server-side Supabase client with service role
// Create server-side Supabase client with anon key (Respects RLS)
let supabaseAnon: SupabaseClient;
if (supabaseUrl && supabaseAnonKey) {
  supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
} else {
  supabaseAnon = createStubClient();
}

// Create server-side Supabase client with service role (Bypasses RLS)
// ONLY use this for system-level tasks, webhooks, or admin operations
let supabaseAdmin: SupabaseClient;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn('Supabase service role not configured - falling back to anon stub');
  supabaseAdmin = supabaseAnon;
}

function createStubClient(): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      upsert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  } as any;
}

export { supabaseAnon as supabase, supabaseAdmin };

// Export types (same as client)
export interface DbUser {
  id: string;
  email: string;
  created_at: string;
  settings_json?: Record<string, any>;
}

export interface DbConversation {
  id: string;
  user_id: string;
  title: string;
  model_id?: string;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  parent_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface DbGeneration {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'audio';
  prompt: string;
  model_id: string;
  provider: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  provider_job_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DbApiUsage {
  id: string;
  user_id: string;
  provider: string;
  endpoint: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_cents: number;
  created_at: string;
}

// Helper functions (server-side only)
export async function getUserConversations(userId: string): Promise<DbConversation[]> {
  const { data, error } = await supabaseAnon
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) {
    if (error) console.error('Failed to get conversations:', error);
    return [];
  }
  return data as unknown as DbConversation[];
}

export async function getConversationMessages(conversationId: string): Promise<DbMessage[]> {
  const { data, error } = await supabaseAnon
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    if (error) console.error('Failed to get messages:', error);
    return [];
  }
  return data as unknown as DbMessage[];
}

export async function saveMessage(
  message: Omit<DbMessage, 'id' | 'created_at'>,
): Promise<DbMessage | null> {
  const { data, error } = await supabaseAnon.from('messages').insert(message).select().single();

  if (error || !data) {
    if (error) console.error('Failed to save message:', error);
    return null;
  }
  return data as unknown as DbMessage;
}

export async function trackApiUsage(usage: Omit<DbApiUsage, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabaseAnon.from('api_usage').insert(usage);

  if (error) console.error('Failed to track API usage:', error);
}

export async function logGeneration(
  generation: Omit<DbGeneration, 'id' | 'created_at'>,
): Promise<DbGeneration | null> {
  const { data, error } = await supabaseAnon
    .from('generations')
    .insert(generation)
    .select()
    .single();

  if (error || !data) {
    if (error) console.error('Failed to log generation:', error);
    return null;
  }
  return data as unknown as DbGeneration;
}

// Get generation by provider job ID (for webhooks)
export async function getGenerationByJobId(
  providerJobId: string,
  userId?: string,
): Promise<DbGeneration | null> {
  let query = supabaseAnon.from('generations').select('*').eq('provider_job_id', providerJobId);

  // Scope to user if provided (security: prevent cross-user access)
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    if (error) console.error('Failed to get generation by job ID:', error);
    return null;
  }
  return data as unknown as DbGeneration;
}

// Update generation result (for webhooks)
export async function updateGenerationResult(
  id: string,
  updates: {
    resultUrl?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    metadata?: Record<string, any>;
  },
): Promise<boolean> {
  const updateData: any = {};
  if (updates.resultUrl) updateData.result_url = updates.resultUrl;
  if (updates.status) updateData.status = updates.status;
  if (updates.metadata) updateData.metadata = updates.metadata;

  const { error } = await supabaseAnon.from('generations').update(updateData).eq('id', id);

  if (error) {
    console.error('Failed to update generation result:', error);
    return false;
  }
  return true;
}

/**
 * Track video generation job in database
 */
export async function createVideoJob(data: {
  user_id: string;
  provider: string;
  provider_job_id: string;
  prompt: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  if (!supabaseAnon) {
    console.error('Supabase server client not initialized');
    return null;
  }

  try {
    const { data: job, error } = await supabaseAnon
      .from('video_jobs')
      .insert({
        user_id: data.user_id,
        provider: data.provider,
        provider_job_id: data.provider_job_id,
        prompt: data.prompt,
        status: 'pending',
        metadata: data.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating video job:', error);
      return null;
    }

    return job.id;
  } catch (err) {
    console.error('Unexpected error creating video job:', err);
    return null;
  }
}

/**
 * Get video job by provider job ID
 */
export async function getVideoJobByProviderId(
  providerJobId: string,
  userId?: string,
): Promise<any | null> {
  if (!supabaseAnon) {
    console.error('Supabase server client not initialized');
    return null;
  }

  try {
    let query = supabaseAnon.from('video_jobs').select('*').eq('provider_job_id', providerJobId);

    // Scope to user if provided (security: prevent cross-user access)
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching video job:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Unexpected error fetching video job:', err);
    return null;
  }
}

/**
 * Update video job status and result
 */
export async function updateVideoJob(
  providerJobId: string,
  updates: {
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    result_url?: string;
    error?: string;
    progress?: number;
    metadata?: Record<string, any>;
  },
): Promise<boolean> {
  if (!supabaseAnon) {
    console.error('Supabase server client not initialized');
    return false;
  }

  try {
    const { error } = await supabaseAnon
      .from('video_jobs')
      .update(updates)
      .eq('provider_job_id', providerJobId);

    if (error) {
      console.error('Error updating video job:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating video job:', err);
    return false;
  }
}
