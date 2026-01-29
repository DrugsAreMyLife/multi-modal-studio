/**
 * AdobeAdapter.ts
 * @orchestration-role "Creative Bridge"
 * Maps verbal creative intents to specific industrial operations.
 */

import { CreativeIntent, SemanticProcessor } from './SemanticProcessor';
import { PreprocessingRepo } from './PreprocessingRepo';
import { getJobSubmissionService } from '../services/job-submission-service';
import { getJobResultService } from '../services/job-result-service';

export class AdobeAdapter {
  static async executeCommand(command: string, assetId?: string, imageUrl?: string): Promise<any> {
    const intent = await SemanticProcessor.parseCreativeIntent(command);

    if (!intent) {
      throw new Error('Could not interpret creative intent from command.');
    }

    console.log(`[AdobeAdapter] Executing ${intent.domain} operation: ${intent.operation}`);

    const jobService = getJobSubmissionService();
    const startTs = Date.now();

    let jobId: string | undefined;
    let artifactUrl: string | undefined;
    let maskUrl: string | undefined;

    // Route to actual workers
    if (intent.operation === 'background_removal' && imageUrl) {
      const submission = await jobService.submitJob({
        workerId: 'sam2',
        payload: {
          image_url: imageUrl,
          mode: 'automatic',
          multimask_output: false,
        },
      });
      jobId = submission.jobId;
    } else if (intent.operation === 'vectorization' && imageUrl) {
      const submission = await jobService.submitJob({
        workerId: 'svg-turbo',
        payload: {
          image_url: imageUrl,
          color_mode: 'binary',
          threshold: 128,
        },
      });
      jobId = submission.jobId;
    }

    if (assetId) {
      const existingAsset = PreprocessingRepo.getAsset(assetId);
      PreprocessingRepo.refineAsset(
        assetId,
        {
          status: jobId ? 'processing' : 'refined',
          semanticData: {
            id: `sem_${Date.now()}`,
            source: 'creative',
            tags: [intent.domain, intent.operation],
            constraints: [],
            creativeIntent: intent,
            timestamp: Date.now(),
          },
        },
        existingAsset?.version,
      );
    }

    return {
      operation: intent.operation,
      timestamp: Date.now(),
      status: jobId ? 'queued' : 'success',
      jobId,
      artifactUrl:
        artifactUrl ||
        (assetId
          ? `/assets/refined/${assetId}_${intent.operation}.png`
          : '/assets/temp_refined.png'),
      maskUrl,
      processingTime: Date.now() - startTs,
    };
  }
}
