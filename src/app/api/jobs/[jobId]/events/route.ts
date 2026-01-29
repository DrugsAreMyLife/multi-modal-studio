import { NextRequest } from 'next/server';
import { getJobResultService } from '@/lib/services/job-result-service';
import { getJobSubmissionService } from '@/lib/services/job-submission-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  if (!jobId) {
    return new Response('Job ID is required', { status: 400 });
  }

  // Check if job exists
  const jobService = getJobSubmissionService();
  const status = await jobService.getJobStatus(jobId);

  if (!status) {
    return new Response('Job not found', { status: 404 });
  }

  // If job is already completed, return final status
  if (status.status === 'completed' || status.status === 'failed') {
    const encoder = new TextEncoder();
    const body = encoder.encode(`event: ${status.status}\ndata: ${JSON.stringify(status)}\n\n`);
    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // Create SSE stream for ongoing job
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const resultService = getJobResultService();

      let closed = false;

      const sendEvent = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Send initial connection event
      sendEvent('connected', { jobId, status: 'streaming' });

      // Stream progress updates
      try {
        for await (const progress of resultService.streamProgress(jobId)) {
          sendEvent('progress', progress);

          // Check if we should stop
          if (progress.progress >= 100) {
            break;
          }
        }

        // Get final result
        const finalStatus = await jobService.getJobStatus(jobId);
        sendEvent(finalStatus?.status === 'completed' ? 'completed' : 'failed', finalStatus);
      } catch (error) {
        sendEvent('error', {
          message: error instanceof Error ? error.message : 'Stream error',
          jobId,
        });
      } finally {
        closed = true;
        controller.close();
      }
    },

    cancel() {
      // Client disconnected - cleanup handled by finally block
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
