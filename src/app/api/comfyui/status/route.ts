import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { comfyUIClient } from '@/lib/comfyui/client';

export async function GET(req: NextRequest) {
  // Auth check (no rate limiting for status polling)
  const authResult = await requireAuth(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const promptId = req.nextUrl.searchParams.get('prompt_id');

  if (!promptId) {
    return NextResponse.json({ error: 'prompt_id parameter is required' }, { status: 400 });
  }

  try {
    // Check if workflow is in queue
    const queue = await comfyUIClient.getQueue();
    const isInQueue =
      queue.queue_running.some((item: any) => item[1] === promptId) ||
      queue.queue_pending.some((item: any) => item[1] === promptId);

    if (isInQueue) {
      return NextResponse.json({
        prompt_id: promptId,
        status: 'queued' as const,
        progress: 0,
      });
    }

    // Get execution history
    const history = await comfyUIClient.getHistory(promptId);

    if (!history) {
      return NextResponse.json(
        {
          prompt_id: promptId,
          status: 'not_found' as const,
          error: 'Workflow not found in history',
        },
        { status: 404 },
      );
    }

    // Check status
    const statusStr = history.status.status_str;
    const isCompleted = history.status.completed;

    if (statusStr === 'error') {
      return NextResponse.json({
        prompt_id: promptId,
        status: 'failed' as const,
        error: history.status.messages?.[0]?.[1] || 'Unknown error',
      });
    }

    if (!isCompleted) {
      return NextResponse.json({
        prompt_id: promptId,
        status: 'running' as const,
        progress: 50, // Approximate since we don't have real-time progress
      });
    }

    // Extract output images
    const outputs = history.outputs || {};
    const images: Array<{ filename: string; subfolder: string; type: string; url: string }> = [];

    for (const nodeId of Object.keys(outputs)) {
      const nodeOutput = outputs[nodeId];
      if (nodeOutput.images) {
        for (const image of nodeOutput.images) {
          const params = new URLSearchParams({
            filename: image.filename,
            subfolder: image.subfolder || '',
            type: image.type || 'output',
          });
          images.push({
            filename: image.filename,
            subfolder: image.subfolder || '',
            type: image.type || 'output',
            url: `/api/comfyui/image?${params.toString()}`,
          });
        }
      }
    }

    return NextResponse.json({
      prompt_id: promptId,
      status: 'completed' as const,
      progress: 100,
      images,
    });
  } catch (error) {
    console.error('[ComfyUI Status] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get workflow status',
      },
      { status: 500 },
    );
  }
}
