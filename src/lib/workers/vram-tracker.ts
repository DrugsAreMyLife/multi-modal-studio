import { supabase } from '@/lib/db/server';

/**
 * Interface for VRAM reports
 */
export interface VramReport {
  node_id: string;
  name: string;
  gpu_vram_total_gb: number;
  gpu_vram_used_gb: number;
  status: 'online' | 'offline' | 'maintenance';
  metadata: Record<string, any>;
}

/**
 * Service to track and query available GPU resources
 */
export class VramTracker {
  /**
   * Updates or registers a node's resource availability
   */
  async updateNodeResource(report: VramReport) {
    const { error } = await supabase.from('node_resources').upsert({
      id: report.node_id,
      name: report.name,
      gpu_vram_total_gb: report.gpu_vram_total_gb,
      gpu_vram_used_gb: report.gpu_vram_used_gb,
      status: report.status,
      last_heartbeat: new Date().toISOString(),
      metadata: report.metadata,
    });

    if (error) {
      console.error('[VramTracker] Failed to update node resource:', error);
      throw error;
    }
  }

  /**
   * Finds the best node to load a model based on VRAM requirements
   */
  async findOptimalNode(modelId: string, requiredVramGb: number) {
    const { data, error } = await supabase
      .from('node_resources')
      .select('*')
      .eq('status', 'online')
      .gte('gpu_vram_total_gb', requiredVramGb)
      .order('gpu_vram_used_gb', { ascending: true });

    if (error) {
      console.error('[VramTracker] Failed to find optimal node:', error);
      return null;
    }

    // Filter for nodes that have enough *actual* free space
    const suitableNodes = data?.filter(
      (node) => node.gpu_vram_total_gb - node.gpu_vram_used_gb >= requiredVramGb,
    );

    return suitableNodes && suitableNodes.length > 0 ? suitableNodes[0] : null;
  }
}

export const vramTracker = new VramTracker();
