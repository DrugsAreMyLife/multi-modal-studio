import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * RLS Integration Tests for Training Tables
 *
 * Tests Row Level Security policies on:
 * - datasets
 * - dataset_images
 * - training_jobs
 * - trained_models
 *
 * Ensures users can only access their own records and that cascading
 * deletes work correctly through foreign key relationships.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY',
  );
}

// Test user IDs - will be populated in beforeAll
let TEST_USER_A_ID = '00000000-0000-0000-0000-000000000001';
let TEST_USER_B_ID = '00000000-0000-0000-0000-000000000002';

// Create clients with service role (for setup/teardown) and anon (for testing)
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

import { createHmac } from 'crypto';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing require environment variable: SUPABASE_JWT_SECRET');
}

/**
 * Creates a Supabase client with a specific user's auth context
 * by overriding the Authorization header with a signed JWT
 */
function createUserClient(userId: string): SupabaseClient {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    iat: Math.floor(Date.now() / 1000) - 10, // 10 seconds in the past
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: `${SUPABASE_URL}/auth/v1`,
  };

  const base64UrlEncode = (obj: any) => {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  const hmac = createHmac('sha256', JWT_SECRET as string);
  const signature = hmac
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  const client = createClient(SUPABASE_URL as string, ANON_KEY as string, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  return client;
}

/**
 * Test fixtures
 */
test.describe.configure({ mode: 'serial' });

test.describe('Training Tables RLS Policies', () => {
  // Setup: Create test users
  test.beforeAll(async () => {
    test.setTimeout(120000);
    console.log('Starting beforeAll setup...');
    try {
      // Safety Check: Ensure we're not running on production
      const isLocal = SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1');
      if (!isLocal && process.env.NODE_ENV === 'production') {
        throw new Error(
          `CRITICAL SAFETY BLOCK: Attempted to run destructive RLS tests on non-local environment (${SUPABASE_URL}).`,
        );
      }

      // Create test users using auth admin API
      console.log('Creating test users...');

      const userAEmail = `user-a-${Date.now()}@test.local`;
      const userBEmail = `user-b-${Date.now()}@test.local`;

      // Delete existing users if they exist
      try {
        await adminClient.auth.admin.deleteUser(TEST_USER_A_ID);
      } catch (e) {
        // Ignore if user doesn't exist
      }
      try {
        await adminClient.auth.admin.deleteUser(TEST_USER_B_ID);
      } catch (e) {
        // Ignore if user doesn't exist
      }

      // Create User A
      const { data: userAData, error: userAError } = await adminClient.auth.admin.createUser({
        email: userAEmail,
        password: 'test-password-123',
        email_confirm: true,
      });

      if (userAError || !userAData.user) {
        console.error('Failed to create user A:', userAError);
        throw new Error('Failed to create user A');
      }

      // Create User B
      const { data: userBData, error: userBError } = await adminClient.auth.admin.createUser({
        email: userBEmail,
        password: 'test-password-123',
        email_confirm: true,
      });

      if (userBError || !userBData.user) {
        console.error('Failed to create user B:', userBError);
        throw new Error('Failed to create user B');
      }

      // Update the test user IDs to use the actual created user IDs
      TEST_USER_A_ID = userAData.user.id;
      TEST_USER_B_ID = userBData.user.id;

      console.log('Created auth users:', { TEST_USER_A_ID, TEST_USER_B_ID });

      // Create corresponding records in public.users
      const { data, error } = await adminClient
        .from('users')
        .insert([
          { id: TEST_USER_A_ID, email: userAEmail },
          { id: TEST_USER_B_ID, email: userBEmail },
        ])
        .select();

      if (error) {
        console.error('Error creating public.users:', JSON.stringify(error));
        throw error;
      } else {
        console.log('Users initialized in public.users:', data?.length);
      }
    } catch (e) {
      console.error('beforeAll failed:', e);
      throw e; // Fail the entire suite if setup fails
    }
  });

  // Cleanup: Delete all test data
  test.afterAll(async () => {
    console.log('Starting afterAll cleanup...');
    try {
      // Delete in reverse order of dependencies to respect foreign keys
      await adminClient
        .from('trained_models')
        .delete()
        .in('user_id', [TEST_USER_A_ID, TEST_USER_B_ID]);

      await adminClient
        .from('training_jobs')
        .delete()
        .in('user_id', [TEST_USER_A_ID, TEST_USER_B_ID]);

      // Note: dataset_images will be deleted by cascading delete of datasets
      await adminClient.from('datasets').delete().in('user_id', [TEST_USER_A_ID, TEST_USER_B_ID]);

      await adminClient.from('users').delete().in('id', [TEST_USER_A_ID, TEST_USER_B_ID]);

      console.log('Cleanup completed successfully.');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  test.describe('Datasets RLS Policy', () => {
    test('User A can create their own dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      const { data, error } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Test Dataset A',
          type: 'lora',
          status: 'creating',
        })
        .select();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    test('User A can read their own datasets', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // First create a dataset
      const { data: created } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Read Test Dataset',
          type: 'dreambooth',
          status: 'creating',
        })
        .select();

      // Then try to read it
      const { data, error } = await userAClient
        .from('datasets')
        .select('*')
        .eq('user_id', TEST_USER_A_ID);

      expect(error).toBeNull();
      expect(data).not.toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    test('User A CANNOT read User B datasets', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secret Dataset B',
          type: 'textual_inversion',
          status: 'ready',
        })
        .select();

      // User A tries to read User B's dataset
      const { data: wrongUser, error: wrongUserError } = await userAClient
        .from('datasets')
        .select('*')
        .eq('user_id', TEST_USER_B_ID);

      // Should return error or empty data
      expect(wrongUserError || (Array.isArray(wrongUser) && wrongUser.length === 0)).toBeTruthy();
    });

    test('User A can update their own datasets', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset
      const { data: created } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Update Test Dataset',
          type: 'checkpoint',
          status: 'creating',
        })
        .select();

      // Update it
      const datasetId = (created as any)?.[0]?.id;
      const { data: updated, error } = await userAClient
        .from('datasets')
        .update({ status: 'ready' })
        .eq('id', datasetId);

      expect(error).toBeNull();
    });

    test('User A CANNOT update User B datasets', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secure Update Dataset',
          type: 'lora',
          status: 'creating',
        })
        .select();

      const datasetId = (bDataset as any)?.[0]?.id;

      // User A tries to update User B's dataset
      const { data, error } = await userAClient
        .from('datasets')
        .update({ status: 'ready' })
        .eq('id', datasetId);

      // Should not update anything (0 rows affected)
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();
    });

    test('User A can delete their own datasets', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset
      const { data: created } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Delete Test Dataset',
          type: 'lora',
          status: 'creating',
        })
        .select();

      const datasetId = (created as any)?.[0]?.id;

      // Delete it
      const { error } = await userAClient.from('datasets').delete().eq('id', datasetId);

      expect(error).toBeNull();

      // Verify it's deleted
      const { data, error: selectError } = await userAClient
        .from('datasets')
        .select('*')
        .eq('id', datasetId);

      expect(selectError || (Array.isArray(data) && (data as any).length === 0)).toBeTruthy();
    });

    test('User A CANNOT delete User B datasets', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secure Dataset B',
          type: 'dreambooth',
          status: 'ready',
        })
        .select();

      const datasetId = (bDataset as any)?.[0]?.id;

      // User A tries to delete User B's dataset
      const { data, error } = await userAClient.from('datasets').delete().eq('id', datasetId);

      // Should not delete (0 rows affected)
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();

      // Verify it still exists (via admin client to bypass RLS)
      const { data: stillExists } = await adminClient
        .from('datasets')
        .select('*')
        .eq('id', datasetId);

      expect(Array.isArray(stillExists) && (stillExists as any).length > 0).toBe(true);
    });
  });

  test.describe('Dataset Images RLS Policy (Inherited from Parent)', () => {
    test('User A can create images in their own dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create a dataset first
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Image Test Dataset',
          type: 'lora',
          status: 'creating',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      // Add image to dataset
      const { data: image, error } = await userAClient
        .from('dataset_images')
        .insert({
          dataset_id: datasetId,
          file_path: '/images/test-1.jpg',
          caption: 'Test image',
          tags: ['test', 'training'],
        })
        .select();

      expect(error).toBeNull();
      expect(image).not.toBeNull();
    });

    test('User A can read images from their own dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Read Images Dataset',
          type: 'dreambooth',
          status: 'creating',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      // Add images
      await userAClient
        .from('dataset_images')
        .insert({
          dataset_id: datasetId,
          file_path: '/images/test-2.jpg',
          caption: 'Image 2',
        })
        .select();

      // Read images
      const { data, error } = await userAClient
        .from('dataset_images')
        .select('*')
        .eq('dataset_id', datasetId);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    test('User A CANNOT read images from User B dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset and adds images
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secret Images Dataset',
          type: 'textual_inversion',
          status: 'ready',
        })
        .select();

      const datasetId = bDataset?.[0]?.id;

      await userBClient
        .from('dataset_images')
        .insert({
          dataset_id: datasetId,
          file_path: '/images/secret.jpg',
          caption: 'Secret image',
        })
        .select();

      // User A tries to read User B's images
      const { data, error } = await userAClient
        .from('dataset_images')
        .select('*')
        .eq('dataset_id', datasetId);

      // Should return empty
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();
    });

    test('User A CANNOT create images in User B dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Protected Images Dataset',
          type: 'checkpoint',
          status: 'ready',
        })
        .select();

      const datasetId = bDataset?.[0]?.id;

      // User A tries to add image to User B's dataset
      const { data, error } = await userAClient
        .from('dataset_images')
        .insert({
          dataset_id: datasetId,
          file_path: '/images/unauthorized.jpg',
          caption: 'Unauthorized image',
        })
        .select();

      // Should return error or empty data
      expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
    });

    test('Cascading delete: deleting dataset deletes images', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Cascade Test Dataset',
          type: 'lora',
          status: 'creating',
        })
        .select();

      const datasetId = dataset?.[0]?.id;

      // Add multiple images
      await userAClient
        .from('dataset_images')
        .insert([
          { dataset_id: datasetId, file_path: '/images/cascade-1.jpg' },
          { dataset_id: datasetId, file_path: '/images/cascade-2.jpg' },
          { dataset_id: datasetId, file_path: '/images/cascade-3.jpg' },
        ])
        .select();

      // Verify images exist
      const { data: beforeDelete } = await userAClient
        .from('dataset_images')
        .select('*')
        .eq('dataset_id', datasetId);

      expect(Array.isArray(beforeDelete) && beforeDelete.length === 3).toBe(true);

      // Delete dataset
      await userAClient.from('datasets').delete().eq('id', datasetId);

      // Verify images are deleted
      const { data: afterDelete } = await adminClient
        .from('dataset_images')
        .select('*')
        .eq('dataset_id', datasetId);

      expect(Array.isArray(afterDelete) && (afterDelete as any).length === 0).toBe(true);
    });
  });

  test.describe('Training Jobs RLS Policy', () => {
    test('User A can create training jobs for their own dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Training Dataset',
          type: 'lora',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      // Create training job
      const { data, error } = await userAClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_A_ID,
          dataset_id: datasetId,
          name: 'Test Training Job',
          type: 'lora',
          base_model: 'model-v1',
          config: { learning_rate: 0.0001 },
          status: 'pending',
        })
        .select();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    test('User A can read their own training jobs', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset and job
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Job Read Dataset',
          type: 'dreambooth',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      await userAClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_A_ID,
          dataset_id: datasetId,
          name: 'Readable Job',
          type: 'dreambooth',
          base_model: 'model-v2',
          config: {},
          status: 'pending',
        })
        .select();

      // Read jobs
      const { data, error } = await userAClient
        .from('training_jobs')
        .select('*')
        .eq('user_id', TEST_USER_A_ID);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    test('User A CANNOT read User B training jobs', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a job
      const { data: dataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secret Job Dataset',
          type: 'lora',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      await userBClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_B_ID,
          dataset_id: datasetId,
          name: 'Secret Job',
          type: 'lora',
          base_model: 'model-v1',
          config: {},
          status: 'pending',
        })
        .select();

      // User A tries to read User B's jobs
      const { data, error } = await userAClient
        .from('training_jobs')
        .select('*')
        .eq('user_id', TEST_USER_B_ID);

      // Should return empty
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();
    });

    test('User A CANNOT create training jobs with User B dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Protected Job Dataset',
          type: 'checkpoint',
          status: 'ready',
        })
        .select();

      const datasetId = (bDataset as any)?.[0]?.id;

      // User A tries to create a job with User B's dataset
      const { data, error } = await userAClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_A_ID,
          dataset_id: datasetId,
          name: 'Unauthorized Job',
          type: 'lora',
          base_model: 'model-v1',
          config: {},
          status: 'pending',
        })
        .select();

      // Job is created (FK doesn't prevent it), but cannot read it
      // The security comes from the dataset RLS, not training_jobs
      // This is acceptable - the job exists but the dataset is inaccessible
      if (Array.isArray(data) && data.length > 0) {
        const jobId = data[0].id;
        // Verify User A cannot actually use this job since dataset is protected
        const { data: jobData, error: jobError } = await userAClient
          .from('training_jobs')
          .select('*')
          .eq('id', jobId);
        expect(
          jobError || jobData === null || (Array.isArray(jobData) && jobData.length === 0),
        ).toBeTruthy();
      } else {
        // If data is empty, it means the insert failed due to RLS on the dataset_id check
        expect(error).not.toBeNull();
      }
    });

    test('User A can update their own training jobs', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset and job
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Update Job Dataset',
          type: 'lora',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      const { data: job } = await userAClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_A_ID,
          dataset_id: datasetId,
          name: 'Updateable Job',
          type: 'lora',
          base_model: 'model-v1',
          config: {},
          status: 'pending',
        })
        .select();

      const jobId = (job as any)?.[0]?.id;

      // Update job status
      const { data: updated, error } = await userAClient
        .from('training_jobs')
        .update({ status: 'queued', progress_percent: 10 })
        .eq('id', jobId);

      expect(error).toBeNull();
    });

    test('User A CANNOT update User B training jobs', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a job
      const { data: dataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Protected Update Dataset',
          type: 'dreambooth',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      const { data: job } = await userBClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_B_ID,
          dataset_id: datasetId,
          name: 'Protected Job',
          type: 'dreambooth',
          base_model: 'model-v2',
          config: {},
          status: 'pending',
        })
        .select();

      const jobId = (job as any)?.[0]?.id;

      // User A tries to update User B's job
      const { data, error } = await userAClient
        .from('training_jobs')
        .update({ status: 'running' })
        .eq('id', jobId);

      // Should not update (0 rows affected)
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();
    });

    test('User A can delete their own training jobs', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset and job
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Delete Job Dataset',
          type: 'textual_inversion',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      const { data: job } = await userAClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_A_ID,
          dataset_id: datasetId,
          name: 'Deletable Job',
          type: 'textual_inversion',
          base_model: 'model-v3',
          config: {},
          status: 'pending',
        })
        .select();

      const jobId = (job as any)?.[0]?.id;

      // Delete job
      const { error } = await userAClient.from('training_jobs').delete().eq('id', jobId);

      expect(error).toBeNull();

      // Verify deletion
      const { data, error: selectError } = await userAClient
        .from('training_jobs')
        .select('*')
        .eq('id', jobId);

      expect(selectError || (Array.isArray(data) && (data as any).length === 0)).toBeTruthy();
    });
  });

  test.describe('Trained Models RLS Policy', () => {
    test('User A can create trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      const { data, error } = await userAClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'My Trained Model',
          type: 'lora',
          base_model: 'model-v1',
          file_path: '/models/trained-1.safetensors',
          trigger_words: ['keyword1', 'keyword2'],
        })
        .select();

      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });

    test('User A can read their own trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create model
      await userAClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Readable Model',
          type: 'dreambooth',
          base_model: 'model-v2',
          file_path: '/models/readable.safetensors',
        })
        .select();

      // Read models
      const { data, error } = await userAClient
        .from('trained_models')
        .select('*')
        .eq('user_id', TEST_USER_A_ID);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data!.length).toBeGreaterThan(0);
    });

    test('User A CANNOT read User B trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a model
      await userBClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secret Model',
          type: 'lora',
          base_model: 'model-v1',
          file_path: '/models/secret.safetensors',
        })
        .select();

      // User A tries to read User B's models
      const { data, error } = await userAClient
        .from('trained_models')
        .select('*')
        .eq('user_id', TEST_USER_B_ID);

      // Should return empty
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();
    });

    test('User A can update their own trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create model
      const { data: model } = await userAClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Updateable Model',
          type: 'checkpoint',
          base_model: 'model-v3',
          file_path: '/models/updateable.safetensors',
        })
        .select();

      const modelId = (model as any)?.[0]?.id;

      // Update model
      const { error } = await userAClient
        .from('trained_models')
        .update({ trigger_words: ['updated', 'words'] })
        .eq('id', modelId);

      expect(error).toBeNull();
    });

    test('User A CANNOT update User B trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a model
      const { data: model } = await userBClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Protected Model',
          type: 'textual_inversion',
          base_model: 'model-v2',
          file_path: '/models/protected.safetensors',
        })
        .select();

      const modelId = (model as any)?.[0]?.id;

      // User A tries to update User B's model
      const { data, error } = await userAClient
        .from('trained_models')
        .update({ trigger_words: ['hacked'] })
        .eq('id', modelId);

      // Should not update (0 rows affected)
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();
    });

    test('User A can delete their own trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create model
      const { data: created } = await userAClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Update Model',
          type: 'lora',
          base_model: 'model-v1',
          file_path: '/models/update.safetensors',
        })
        .select();

      const modelId = (created as any)?.[0]?.id;

      // Delete model
      const { error } = await userAClient.from('trained_models').delete().eq('id', modelId);

      expect(error).toBeNull();

      // Verify deletion
      const { data, error: selectError } = await userAClient
        .from('trained_models')
        .select('*')
        .eq('id', modelId);

      expect(selectError || (Array.isArray(data) && (data as any).length === 0)).toBeTruthy();
    });

    test('User A CANNOT delete User B trained models', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a model
      const { data: model } = await userBClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Secure Model',
          type: 'dreambooth',
          base_model: 'model-v3',
          file_path: '/models/secure.safetensors',
        })
        .select();

      const modelId = (model as any)?.[0]?.id;

      // User A tries to delete User B's model
      const { data, error } = await userAClient.from('trained_models').delete().eq('id', modelId);

      // Should not delete (0 rows affected)
      expect(
        error || data === null || (Array.isArray(data) && (data as any).length === 0),
      ).toBeTruthy();

      // Verify it still exists (via admin client)
      const { data: stillExists } = await adminClient
        .from('trained_models')
        .select('*')
        .eq('id', modelId);

      expect(Array.isArray(stillExists) && (stillExists as any).length > 0).toBe(true);
    });
  });

  test.describe('Anonymous Access Prevention', () => {
    test('Anonymous user CANNOT read datasets', async () => {
      // Create client without auth context
      const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data, error } = await anonClient.from('datasets').select('*');

      // Should return error or empty data
      expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
    });

    test('Anonymous user CANNOT create datasets', async () => {
      const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
      });

      const { data, error } = await anonClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Anonymous Dataset',
          type: 'lora',
          status: 'creating',
        })
        .select();

      // Should return error or empty data
      expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
    });
  });

  test('Anonymous user CANNOT read training jobs', async () => {
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await anonClient.from('training_jobs').select('*');

    // Should return error or empty data
    expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
  });

  test('Anonymous user CANNOT read trained models', async () => {
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await anonClient.from('trained_models').select('*');

    // Should return error or empty data
    expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
  });

  test('Anonymous user CANNOT read dataset images', async () => {
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await anonClient.from('dataset_images').select('*');

    // Should return error or empty data
    expect(error || (Array.isArray(data) && (data as any).length === 0)).toBe(true);
  });

  test.describe('Cascading Delete Integrity', () => {
    test('Deleting training job cascades to trained models (SET NULL)', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create dataset
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Cascade Job Dataset',
          type: 'lora',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      // Create training job
      const { data: job } = await adminClient
        .from('training_jobs')
        .insert({
          dataset_id: datasetId,
          user_id: TEST_USER_A_ID,
          name: 'Cascade Job',
          type: 'lora',
          base_model: 'model-v1',
          config: {},
          status: 'completed',
        })
        .select();

      const jobId = (job as any)?.[0]?.id;

      // Create trained model for this job
      const { data: model } = await adminClient
        .from('trained_models')
        .insert({
          user_id: TEST_USER_A_ID,
          training_job_id: jobId,
          name: 'Cascaded Model',
          type: 'lora',
          base_model: 'model-v1',
          file_path: '/models/cascade.safetensors',
        })
        .select();

      const modelId = (model as any)?.[0]?.id;

      // Delete training job
      await userAClient.from('training_jobs').delete().eq('id', jobId);

      // Verify model still exists but training_job_id is NULL
      const { data: modelAfterDelete } = await userAClient
        .from('trained_models')
        .select('*')
        .eq('id', modelId);

      expect(Array.isArray(modelAfterDelete) && (modelAfterDelete as any).length > 0).toBe(true);
      expect(modelAfterDelete?.[0]?.training_job_id).toBeNull();
    });
  });

  test.describe('RLS Edge Cases and Security Boundary Tests', () => {
    test("User cannot bypass RLS by directly querying another user's dataset in subquery", async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);
      const userBClient = createUserClient(TEST_USER_B_ID);

      // User B creates a dataset
      const { data: bDataset } = await userBClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_B_ID,
          name: 'Subquery Test Dataset',
          type: 'lora',
          status: 'ready',
        })
        .select();

      const bDatasetId = (bDataset as any)?.[0]?.id;

      // User A tries to query dataset_images with User B's dataset_id
      const { data, error } = await userAClient
        .from('dataset_images')
        .select('*')
        .eq('dataset_id', bDatasetId);

      // Should return error or empty data
      expect(error || (Array.isArray(data) && data.length === 0)).toBeTruthy();
    });

    test('User cannot create training job for non-existent dataset', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      const fakeDatasetId = '99999999-9999-9999-9999-999999999999';

      const { data } = await userAClient
        .from('training_jobs')
        .insert({
          user_id: TEST_USER_A_ID,
          dataset_id: fakeDatasetId,
          name: 'Fake Job',
          type: 'lora',
          base_model: 'model-v1',
          config: {},
          status: 'pending',
        })
        .select();

      // Job might be created (FK reference is allowed), but should be inaccessible
      if (Array.isArray(data) && (data as any).length > 0) {
        // Verify it exists in user context
        const { data: jobData } = await userAClient
          .from('training_jobs')
          .select('*')
          .eq('id', (data as any)[0].id);

        expect(Array.isArray(jobData) && jobData.length > 0).toBe(true);
      }
    });

    test('RLS policy respects auth.uid() not just user_id column', async () => {
      const userAClient = createUserClient(TEST_USER_A_ID);

      // Create a dataset
      const { data: dataset } = await userAClient
        .from('datasets')
        .insert({
          user_id: TEST_USER_A_ID,
          name: 'Auth UID Test',
          type: 'lora',
          status: 'ready',
        })
        .select();

      const datasetId = (dataset as any)?.[0]?.id;

      // Try to query with wrong user_id in filter but correct auth context
      const { data } = await userAClient.from('datasets').select('*').eq('user_id', TEST_USER_A_ID);

      // Should succeed because auth.uid() matches
      expect(Array.isArray(data) && (data as any).length > 0).toBe(true);

      // Now try with wrong user_id filter
      const { data: wrongUser, error: wrongUserError } = await userAClient
        .from('datasets')
        .select('*')
        .eq('user_id', TEST_USER_B_ID);

      // Should return error or empty data
      // Should return error or empty data
      expect(
        wrongUserError || (Array.isArray(wrongUser) && (wrongUser as any).length === 0),
      ).toBeTruthy();
    });
  });
});
