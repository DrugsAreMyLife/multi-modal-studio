import { getJobSubmissionService } from './job-submission-service';
import { getJobResultService } from './job-result-service';
import { PreprocessingRepo } from '../orchestration/PreprocessingRepo';
import type { SegmentationResult } from '../types/job-result';

export interface BackgroundRemovalResult {
  maskUrl: string;
  refinedImageUrl: string;
  jobId: string;
  processingTime: number;
}

export interface BackgroundRemovalOptions {
  imageUrl: string;
  mode?: 'automatic' | 'subject';
  assetId?: string;
  timeout?: number;
}

export class BackgroundRemovalService {
  private jobService = getJobSubmissionService();
  private resultService = getJobResultService();

  async removeBackground(options: BackgroundRemovalOptions): Promise<BackgroundRemovalResult> {
    const { imageUrl, mode = 'automatic', assetId, timeout = 120000 } = options;

    // Submit segmentation job to SAM2
    const submission = await this.jobService.submitJob({
      workerId: 'sam2',
      payload: {
        image_url: imageUrl,
        mode: mode === 'subject' ? 'automatic' : mode,
        multimask_output: false,
        return_largest: true, // Custom flag for subject detection
      },
      priority: 'normal',
      waitForReady: true,
    });

    // Wait for result
    const result = await this.resultService.waitForResult<SegmentationResult>(
      submission.jobId,
      timeout,
    );

    if (result.status === 'failed') {
      throw new Error(result.error?.message || 'Background removal failed');
    }

    const maskUrl = result.data?.masks?.[0] || '';
    const refinedImageUrl = this.generateRefinedUrl(imageUrl, submission.jobId);

    // Store result in PreprocessingRepo if assetId provided
    if (assetId) {
      const existingAsset = PreprocessingRepo.getAsset(assetId);
      PreprocessingRepo.refineAsset(
        assetId,
        {
          status: 'refined',
          semanticData: {
            id: `sem_bg_${Date.now()}`,
            source: 'background-removal',
            tags: ['background-removed', 'sam2'],
            constraints: [],
            maskUrl,
            refinedImageUrl,
            timestamp: Date.now(),
          },
        },
        existingAsset?.version,
      );
    }

    return {
      maskUrl,
      refinedImageUrl,
      jobId: submission.jobId,
      processingTime: result.duration,
    };
  }

  private generateRefinedUrl(originalUrl: string, jobId: string): string {
    // Generate URL for the refined image (background removed)
    const outputDir = `outputs/${jobId}`;
    return `${outputDir}/refined.png`;
  }

  async getRemovalStatus(jobId: string) {
    return this.jobService.getJobStatus(jobId);
  }
}

// Singleton
let instance: BackgroundRemovalService | null = null;

export function getBackgroundRemovalService(): BackgroundRemovalService {
  if (!instance) {
    instance = new BackgroundRemovalService();
  }
  return instance;
}
