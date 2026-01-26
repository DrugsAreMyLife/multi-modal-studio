import { batchQueue } from './batch-queue';
import { supabase } from '@/lib/db/server';

/**
 * Intelligent Batch Processor
 * Groups individual requests into larger batches for GPU efficiency
 */
export class BatchProcessor {
  /**
   * Main processing loop for a specific model batch
   */
  async processBatch(modelId: string) {
    // 1. Fetch pending requests for this model
    const requests = await batchQueue.getJobs(['waiting'], 0, 10);
    const modelRequests = requests.filter((j) => j.data.model_id === modelId);

    if (modelRequests.length === 0) return;

    console.log(`[*] Forming batch for ${modelId} with ${modelRequests.length} requests`);

    // 2. Combine prompts into a single payload if model supports it
    const batchPayload = modelRequests.map((r) => r.data.payload);

    // 3. Mark as batched in DB
    const jobIds = modelRequests.map((r) => r.id);
    await supabase
      .from('batch_queue')
      .update({ status: 'batched', batch_id: jobIds[0] }) // Using first ID as groupId
      .in('id', jobIds);

    return {
      groupId: jobIds[0],
      requests: batchPayload,
    };
  }
}

export const batchProcessor = new BatchProcessor();
