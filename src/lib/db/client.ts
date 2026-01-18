'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create real Supabase client (works when env vars are set)
let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
} else {
  // Fallback stub for development without Supabase
  console.warn('Supabase not configured - using stub client');
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => ({
        select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
      }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
    removeChannel: () => Promise.resolve('ok'),
  } as any;
}

export { supabase };

// Server-side client with service role
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !supabaseUrl) {
    console.warn('Supabase service role not configured');
    return supabase; // Return regular client as fallback
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// Types for database tables
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
  result_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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

// Helper functions
export async function getUserConversations(userId: string): Promise<DbConversation[]> {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase.from('messages').insert(message).select().single();

  if (error || !data) {
    if (error) console.error('Failed to save message:', error);
    return null;
  }
  return data as unknown as DbMessage;
}

export async function trackApiUsage(usage: Omit<DbApiUsage, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('api_usage').insert(usage);

  if (error) console.error('Failed to track API usage:', error);
}

export async function logGeneration(
  generation: Omit<DbGeneration, 'id' | 'created_at'>,
): Promise<DbGeneration | null> {
  const { data, error } = await supabase.from('generations').insert(generation).select().single();

  if (error || !data) {
    if (error) console.error('Failed to log generation:', error);
    return null;
  }
  return data as unknown as DbGeneration;
}

export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: DbMessage) => void,
) {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as DbMessage),
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
