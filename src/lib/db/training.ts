// Server-side database functions for training and datasets
import { supabase } from './server';

export interface DbDataset {
  id: string;
  user_id: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'text';
  image_count: number;
  status: 'active' | 'processing' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * List all datasets for a user, ordered by creation date (newest first)
 */
export async function listDatasets(userId: string): Promise<DbDataset[]> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) console.error('Failed to list datasets:', error);
    return [];
  }

  return data as unknown as DbDataset[];
}

/**
 * Get a single dataset by ID (with user ownership check)
 */
export async function getDataset(datasetId: string, userId: string): Promise<DbDataset | null> {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', datasetId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    if (error) console.error('Failed to get dataset:', error);
    return null;
  }

  return data as unknown as DbDataset;
}

/**
 * Create a new dataset
 */
export async function createDataset(
  dataset: Omit<DbDataset, 'id' | 'created_at' | 'updated_at'>,
): Promise<DbDataset | null> {
  const { data, error } = await supabase.from('datasets').insert(dataset).select().single();

  if (error || !data) {
    if (error) console.error('Failed to create dataset:', error);
    return null;
  }

  return data as unknown as DbDataset;
}

/**
 * Update dataset metadata
 */
export async function updateDataset(
  datasetId: string,
  userId: string,
  updates: Partial<Omit<DbDataset, 'id' | 'user_id' | 'created_at'>>,
): Promise<DbDataset | null> {
  const { data, error } = await supabase
    .from('datasets')
    .update(updates)
    .eq('id', datasetId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    if (error) console.error('Failed to update dataset:', error);
    return null;
  }

  return data as unknown as DbDataset;
}

/**
 * Delete a dataset
 */
export async function deleteDataset(datasetId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('datasets')
    .delete()
    .eq('id', datasetId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete dataset:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Training Jobs Functions
// ============================================================================

export interface DbTrainingJob {
  id: string;
  user_id: string;
  dataset_id: string;
  name: string;
  type: 'lora' | 'dreambooth';
  base_model: string;
  config: Record<string, unknown>;
  trigger_words: string[];
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  container_id?: string;
  error_message?: string;
  progress_percent?: number;
  current_step?: number;
  total_steps?: number;
  loss_history?: Array<{ step: number; loss: number }>;
  sample_images?: Array<{ step: number; url: string }>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Create a new training job
 */
export async function createTrainingJob(
  job: Omit<DbTrainingJob, 'id' | 'created_at' | 'updated_at'>,
): Promise<DbTrainingJob | null> {
  const { data, error } = await supabase
    .from('training_jobs')
    .insert({
      ...job,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    if (error) console.error('Failed to create training job:', error);
    return null;
  }

  return data as unknown as DbTrainingJob;
}

/**
 * Get a training job by ID with user ownership check
 */
export async function getTrainingJob(jobId: string, userId: string): Promise<DbTrainingJob | null> {
  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    if (error) console.error('Failed to get training job:', error);
    return null;
  }

  return data as unknown as DbTrainingJob;
}

/**
 * List all training jobs for a user
 */
export async function listTrainingJobs(userId: string): Promise<DbTrainingJob[]> {
  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    if (error) console.error('Failed to list training jobs:', error);
    return [];
  }

  return data as unknown as DbTrainingJob[];
}

/**
 * Get active (running/pending) jobs for a user
 */
export async function getActiveJobsForUser(userId: string): Promise<DbTrainingJob[]> {
  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['running', 'pending']);

  if (error || !data) {
    if (error) console.error('Failed to get active jobs:', error);
    return [];
  }

  return data as unknown as DbTrainingJob[];
}

/**
 * Update training job status and metadata
 */
export async function updateTrainingJob(
  jobId: string,
  userId: string,
  updates: Partial<Omit<DbTrainingJob, 'id' | 'user_id' | 'created_at'>>,
): Promise<DbTrainingJob | null> {
  const { data, error } = await supabase
    .from('training_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    if (error) console.error('Failed to update training job:', error);
    return null;
  }

  return data as unknown as DbTrainingJob;
}

/**
 * Delete a training job
 */
export async function deleteTrainingJob(jobId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('training_jobs')
    .delete()
    .eq('id', jobId)
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to delete training job:', error);
    return false;
  }

  return true;
}

// ============================================================================
// Type Exports and Aliases
// ============================================================================

export type Dataset = DbDataset;
export type TrainingJob = DbTrainingJob;

export type JobStatus = Pick<
  DbTrainingJob,
  'id' | 'status' | 'error_message' | 'started_at' | 'completed_at'
> & {
  progress?: number;
};

export interface TrainedModel {
  id: string;
  user_id: string;
  job_id: string;
  name: string;
  type: 'lora' | 'dreambooth';
  base_model: string;
  model_path: string;
  trigger_words: string[];
  status: 'ready' | 'archived' | 'failed';
  created_at: string;
  updated_at: string;
}
