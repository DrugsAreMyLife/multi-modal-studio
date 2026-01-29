/**
 * LipSyncAdapter
 * Orchestrates the pairing of video assets with audio assets for talking head animation.
 */

export interface LipSyncRequest {
  videoUrl: string;
  audioUrl: string;
  model?: 'hedra' | 'liveportrait' | 'sad-talker';
  options?: {
    cropToFace?: boolean;
    enhanceFace?: boolean;
    expressionIntensity?: number;
  };
}

export interface LipSyncResponse {
  success: boolean;
  jobId?: string;
  resultUrl?: string;
  error?: string;
}

export class LipSyncAdapter {
  /**
   * Triggers a lip-sync generation job
   */
  async sync(request: LipSyncRequest): Promise<LipSyncResponse> {
    try {
      const response = await fetch('/api/remix/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Lip-sync API failed');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[LipSyncAdapter] Error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error during lip-sync',
      };
    }
  }

  /**
   * Polls for the status of a sync job
   */
  async getStatus(jobId: string): Promise<LipSyncResponse & { status: string }> {
    try {
      const response = await fetch(`/api/remix/sync/status?jobId=${jobId}`);
      if (!response.ok) throw new Error('Status check failed');
      return await response.json();
    } catch (err) {
      return { success: false, status: 'failed', error: String(err) };
    }
  }
}

export const lipSyncAdapter = new LipSyncAdapter();
