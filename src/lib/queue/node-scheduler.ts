import { vramTracker } from '../workers/vram-tracker';
import { supabase } from '@/lib/db/server';

/**
 * Cross-Node Scheduler
 * Routes generation jobs to the most suitable GPU node
 */
export class NodeScheduler {
  /**
   * Finds and prepares the best node for a specific model
   */
  async scheduleJob(modelId: string, userId: string) {
    // 1. Get model requirements from registry
    const { data: model } = await supabase
      .from('model_registry')
      .select('vram_required_gb, category')
      .eq('id', modelId)
      .single();

    if (!model) throw new Error(`Model ${modelId} not found in registry`);

    // 2. If it's a cloud model, routing is simple
    if (model.category === 'cloud') {
      return { type: 'cloud', nodeId: 'api-gateway' };
    }

    // 3. For local models, check VRAM availability across nodes
    const requiredVram = model.vram_required_gb || 8;
    const optimalNode = await vramTracker.findOptimalNode(modelId, requiredVram);

    if (!optimalNode) {
      // Fallback or queue for later
      return { type: 'queued', status: 'waiting_for_node' };
    }

    // 4. Check for admin approval if node is restricted (like MBP)
    if (optimalNode.id === 'mbp') {
      const { data: approval } = await supabase
        .from('admin_approval_requests')
        .select('status')
        .eq('user_id', userId)
        .eq('node_id', 'mbp')
        .eq('model_id', modelId)
        .eq('status', 'approved')
        .single();

      if (!approval) {
        return { type: 'blocked', reason: 'pending_admin_approval', nodeId: 'mbp' };
      }
    }

    return { type: 'local', nodeId: optimalNode.id, url: optimalNode.metadata?.url };
  }
}

export const nodeScheduler = new NodeScheduler();
