import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { getTrainingJob, updateTrainingJob } from '@/lib/db/training';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { realpath, rm } from 'fs/promises';

const execFileAsync = promisify(execFile);

/**
 * POST /api/training/jobs/{id}/cancel
 * Cancel a running training job
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Authenticate user
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    // Await params (Next.js 16+)
    const { id } = await params;
    const jobId = id;
    const userId = authResult.userId;

    // Validate jobId format (UUID or Alphanumeric) to prevent injection
    const jobIdRegex = /^[a-zA-Z0-9_\-]+$/;
    if (!jobIdRegex.test(jobId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const cleanupOutputs = searchParams.get('cleanup_outputs') === 'true';

    // Get job details from database
    const job = await getTrainingJob(jobId, userId);

    // Check if job exists
    if (!job) {
      console.warn(`[Training] Job ${jobId} not found for user ${userId}`);
      return NextResponse.json(
        {
          error: 'Job not found',
          message: `Training job with ID ${jobId} not found.`,
        },
        { status: 404 },
      );
    }

    // Check job status - verify it's cancellable
    const cancellableStatuses = ['pending', 'queued', 'running'];
    if (!cancellableStatuses.includes(job.status)) {
      let message: string;

      if (job.status === 'cancelled') {
        message = 'Job already cancelled';
      } else if (job.status === 'completed') {
        message = 'Cannot cancel completed job';
      } else if (job.status === 'failed') {
        message = 'Cannot cancel failed job';
      } else {
        message = `Cannot cancel job with status: ${job.status}`;
      }

      console.warn(`[Training] Cannot cancel job ${jobId}: ${message}`);
      return NextResponse.json(
        {
          error: 'Invalid job state',
          message,
        },
        { status: 400 },
      );
    }

    // Try to stop Docker container if job is running or queued with container
    const containerName = `training-${jobId}`;
    const containerIdFromJob = job.config?.container_id;

    if (job.status === 'running' || containerIdFromJob) {
      try {
        // Attempt graceful shutdown first (SIGTERM with 10 second timeout)
        console.log(`[Training] Attempting graceful stop for container ${containerName}...`);
        try {
          // Use execFile instead of exec template strings for security
          await execFileAsync('docker', ['stop', '-t', '10', containerName]);
          console.log(`[Training] Container ${containerName} stopped successfully`);
        } catch (stopError: unknown) {
          const errorMsg = stopError instanceof Error ? stopError.message : String(stopError);
          console.warn(`[Training] Docker stop warning for ${containerName}: ${errorMsg}`);

          // Try force kill if graceful stop failed
          try {
            console.log(`[Training] Attempting force kill for container ${containerName}...`);
            await execFileAsync('docker', ['kill', containerName]);
            console.log(`[Training] Container ${containerName} killed successfully`);
          } catch (killError: unknown) {
            const killMsg = killError instanceof Error ? killError.message : String(killError);
            console.warn(`[Training] Docker kill warning for ${containerName}: ${killMsg}`);
          }
        }

        // Remove container
        try {
          console.log(`[Training] Removing container ${containerName}...`);
          await execFileAsync('docker', ['rm', '-f', containerName]);
          console.log(`[Training] Container ${containerName} removed successfully`);
        } catch (rmError: unknown) {
          const rmMsg = rmError instanceof Error ? rmError.message : String(rmError);
          console.warn(`[Training] Docker rm warning for ${containerName}: ${rmMsg}`);
        }
      } catch (dockerError: unknown) {
        // Log Docker errors but don't fail the cancellation
        const errorMsg = dockerError instanceof Error ? dockerError.message : String(dockerError);
        console.error(`[Training] Docker error while cancelling job ${jobId}: ${errorMsg}`);
        // Continue with database update anyway
      }
    }

    // Update job status in database
    const updateResult = await updateTrainingJob(jobId, userId, {
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      error_message: 'Cancelled by user',
    });

    if (!updateResult) {
      console.error(`[Training] Failed to update job status for ${jobId}`);
      return NextResponse.json(
        {
          error: 'Database update failed',
          message: 'Failed to update job status in database',
        },
        { status: 500 },
      );
    }

    // Optional: Clean up output files
    if (cleanupOutputs) {
      try {
        console.log(`[Training] Cleaning up outputs for job ${jobId}...`);
        const outputPath =
          (job.config?.output_path as string | undefined) ||
          path.join(process.cwd(), 'public', 'training', 'outputs', jobId);

        // SECURITY: Verify output_path is within sanctioned directory
        // It must be in {project_root}/public/training/outputs/{job_id}
        const sanctionedBase = path.join(process.cwd(), 'public', 'training', 'outputs');
        const absoluteOutputPath = path.isAbsolute(outputPath)
          ? outputPath
          : path.resolve(process.cwd(), outputPath);

        const baseReal = await realpath(sanctionedBase);
        const outputReal = await realpath(absoluteOutputPath);

        const baseWithSep = baseReal.endsWith(path.sep) ? baseReal : `${baseReal}${path.sep}`;
        const isWithinBase = outputReal.startsWith(baseWithSep);

        if (!isWithinBase) {
          console.error(
            `[Training] Security Alert: Job ${jobId} attempted to delete unsanctioned path: ${outputPath}`,
          );
        } else {
          console.log(`[Training] Cleaning up outputs for job ${jobId} at ${outputReal}...`);
          await rm(outputReal, { recursive: true, force: true });
          console.log(`[Training] Outputs cleaned up successfully`);
        }
      } catch (cleanupError: unknown) {
        // Log cleanup errors but don't fail the response
        const errorMsg =
          cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        console.warn(`[Training] Cleanup warning for job ${jobId}: ${errorMsg}`);
      }
    }

    // Log cancellation event for audit trail
    console.log(
      `[Training] Job cancelled: ${jobId} by user ${userId} (status was: ${job.status}, cleanup_outputs: ${cleanupOutputs})`,
    );

    return NextResponse.json(
      {
        success: true,
        job_id: jobId,
        status: 'cancelled',
        message: 'Training job cancelled successfully',
        previous_status: job.status,
        cleanup_outputs: cleanupOutputs,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Training] Cancel endpoint error: ${errorMsg}`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while cancelling the job',
      },
      { status: 500 },
    );
  }
}
