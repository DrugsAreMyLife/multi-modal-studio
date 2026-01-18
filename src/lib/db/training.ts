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
