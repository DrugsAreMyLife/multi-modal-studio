/**
 * Setup utilities for integration tests
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Environment configuration for tests
 */
export const testConfig = {
  supabaseUrl:
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321',
  serviceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
  anonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
};

/**
 * Test user IDs for simulating multiple users
 */
export const testUsers = {
  userA: '00000000-0000-0000-0000-000000000001',
  userB: '00000000-0000-0000-0000-000000000002',
  userC: '00000000-0000-0000-0000-000000000003',
};

/**
 * Creates the admin client with service role key
 * Used for test setup, verification, and cleanup
 */
export function createAdminClient(): SupabaseClient {
  return createClient(testConfig.supabaseUrl, testConfig.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Creates an anonymous client for testing public access
 */
export function createAnonClient(): SupabaseClient {
  return createClient(testConfig.supabaseUrl, testConfig.anonKey, {
    auth: { persistSession: false },
  });
}

/**
 * Creates a Supabase client with a specific user's auth context
 * Uses a mock JWT token with the user's ID in the `sub` claim
 *
 * Note: This is for testing purposes only. In production, use real session tokens
 * from NextAuth or another authentication provider.
 *
 * @param userId - The UUID of the user to authenticate as
 * @returns SupabaseClient with auth context for the specified user
 */
export function createUserClient(userId: string): SupabaseClient {
  // Create a mock JWT token with the user's ID
  // In production, this would be a real session token
  const mockPayload = {
    sub: userId,
    aud: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    role: 'authenticated',
  };

  const mockToken = Buffer.from(JSON.stringify(mockPayload)).toString('base64');

  // Create client with mock Authorization header
  const client = createClient(testConfig.supabaseUrl, testConfig.anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockToken}.mock`,
      },
    },
  });

  return client;
}

/**
 * Ensures test users exist in the database
 * Creates them if they don't already exist
 *
 * @param adminClient - Supabase admin client
 */
export async function ensureTestUsers(adminClient: SupabaseClient): Promise<void> {
  const users = [
    { id: testUsers.userA, email: `user-a-${Date.now()}@test.local` },
    { id: testUsers.userB, email: `user-b-${Date.now()}@test.local` },
    { id: testUsers.userC, email: `user-c-${Date.now()}@test.local` },
  ];

  for (const user of users) {
    try {
      await adminClient.from('users').insert({
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // User may already exist - that's fine
      if (!String(error).includes('duplicate') && !String(error).includes('exists')) {
        console.warn(`Failed to create test user ${user.id}:`, error);
      }
    }
  }
}

/**
 * Cleans up all test data from training tables
 * Called after each test or test suite
 *
 * @param adminClient - Supabase admin client
 * @param userIds - Array of user IDs to delete data for
 */
export async function cleanupTestData(
  adminClient: SupabaseClient,
  userIds: string[] = Object.values(testUsers),
): Promise<void> {
  try {
    // Delete in reverse order of dependencies (respecting foreign keys)
    await adminClient.from('trained_models').delete().in('user_id', userIds);
    await adminClient.from('training_jobs').delete().in('user_id', userIds);

    // Delete dataset_images through cascade
    const { data: datasets } = await adminClient
      .from('datasets')
      .select('id')
      .in('user_id', userIds);

    if (datasets && datasets.length > 0) {
      const datasetIds = datasets.map((d: any) => d.id);
      await adminClient.from('dataset_images').delete().in('dataset_id', datasetIds);
      await adminClient.from('datasets').delete().in('id', datasetIds);
    }

    // Clean up users
    await adminClient.from('users').delete().in('id', userIds);
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

/**
 * Helper to verify that a query returned no results
 * Useful for asserting that RLS policies blocked access
 */
export function expectEmpty(data: any[] | null | undefined): boolean {
  return !Array.isArray(data) || data.length === 0;
}

/**
 * Helper to verify that a query returned results
 */
export function expectNotEmpty(data: any[] | null | undefined): boolean {
  return Array.isArray(data) && data.length > 0;
}

/**
 * Types for test data structures
 */
export interface TestDataset {
  id?: string;
  user_id: string;
  name: string;
  type: 'lora' | 'dreambooth' | 'textual_inversion' | 'checkpoint' | 'general';
  status?: string;
  image_count?: number;
  config?: Record<string, any>;
}

export interface TestTrainingJob {
  id?: string;
  user_id: string;
  dataset_id?: string;
  name?: string;
  type: 'lora' | 'dreambooth' | 'textual_inversion' | 'checkpoint';
  base_model: string;
  status?: string;
  config: Record<string, any>;
}

export interface TestTrainedModel {
  id?: string;
  user_id: string;
  training_job_id?: string;
  name: string;
  type: 'lora' | 'dreambooth' | 'textual_inversion' | 'checkpoint';
  base_model: string;
  file_path: string;
  trigger_words?: string[];
}

/**
 * Helper to create test data with defaults
 */
export const testDataFactories = {
  dataset: (overrides?: Partial<TestDataset>): TestDataset => ({
    user_id: testUsers.userA,
    name: 'Test Dataset',
    type: 'lora',
    status: 'creating',
    ...overrides,
  }),

  trainingJob: (overrides?: Partial<TestTrainingJob>): TestTrainingJob => ({
    user_id: testUsers.userA,
    type: 'lora',
    base_model: 'model-v1',
    config: { learning_rate: 0.0001 },
    ...overrides,
  }),

  trainedModel: (overrides?: Partial<TestTrainedModel>): TestTrainedModel => ({
    user_id: testUsers.userA,
    name: 'Test Model',
    type: 'lora',
    base_model: 'model-v1',
    file_path: '/models/test.safetensors',
    ...overrides,
  }),
};
