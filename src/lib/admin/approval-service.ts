import { supabase } from '@/lib/db/server';
import { notificationQueue } from '@/lib/queue/batch-queue';

export interface ApprovalRequest {
  userId: string;
  modelId: string;
  nodeId: string;
  reason?: string;
}

/**
 * Service to manage high-resource usage approvals (e.g., MBP)
 */
export class ApprovalService {
  /**
   * Requests approval to usage a specific node/model combination
   */
  async requestUsage(request: ApprovalRequest) {
    // 1. Check if a pending request already exists
    const { data: existing } = await supabase
      .from('admin_approval_requests')
      .select('*')
      .eq('user_id', request.userId)
      .eq('model_id', request.modelId)
      .eq('node_id', request.nodeId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return { success: true, status: 'pending', id: existing.id };
    }

    // 2. Create new request
    const { data, error } = await supabase
      .from('admin_approval_requests')
      .insert({
        user_id: request.userId,
        model_id: request.modelId,
        node_id: request.nodeId,
        request_reason: request.reason || 'Requested by user',
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Notify Admin (Async)
    await notificationQueue.add('broadcast-admin-approval', {
      requestId: data.id,
      userId: request.userId,
      modelId: request.modelId,
      title: 'New MBP Resource Request',
      message: `User ${request.userId} is requesting to use ${request.modelId} on ${request.nodeId}.`,
    });

    return { success: true, status: 'pending', id: data.id };
  }

  /**
   * Admin approves a request
   */
  async approveRequest(requestId: string, adminUserId: string) {
    const { error } = await supabase
      .from('admin_approval_requests')
      .update({
        status: 'approved',
        resolved_at: new Date().toISOString(),
        resolved_by: adminUserId,
      })
      .eq('id', requestId);

    if (error) throw error;

    // Notify User
    const { data: req } = await supabase
      .from('admin_approval_requests')
      .select('user_id')
      .eq('id', requestId)
      .single();

    if (req) {
      await notificationQueue.add('user-notification', {
        userId: req.user_id,
        title: 'MBP Access Approved',
        message: 'Your request to use the high-performance node has been approved.',
        type: 'success',
      });
    }

    return { success: true };
  }

  /**
   * Admin denies a request
   */
  async denyRequest(requestId: string, adminUserId: string, reason: string) {
    const { error } = await supabase
      .from('admin_approval_requests')
      .update({
        status: 'denied',
        denial_reason: reason,
        resolved_at: new Date().toISOString(),
        resolved_by: adminUserId,
      })
      .eq('id', requestId);

    if (error) throw error;

    return { success: true };
  }
}

export const approvalService = new ApprovalService();
