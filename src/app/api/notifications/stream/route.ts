import { NextRequest } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';
import { connection } from '@/lib/queue/batch-queue';

/**
 * SSE Endpoint for real-time user notifications
 * This endpoint allows the frontend to listen for system-wide or user-specific events.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuthAndRateLimit(
    req,
    '/api/notifications/stream',
    RATE_LIMITS.chat,
  );
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userId = authResult.userId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Subscribe to Redis for notifications
      const subClient = connection.duplicate();
      await subClient.subscribe('notifications', `notifications:${userId}`);

      const onMessage = (_channel: string, message: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
        } catch (e) {
          // Controller might be closed
        }
      };

      subClient.on('message', onMessage);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch (e) {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Shared cleanup function
      const cleanup = () => {
        clearInterval(keepAlive);
        subClient.off('message', onMessage);
        subClient.quit().catch(() => {});
      };

      // Handle client-side close
      req.signal.addEventListener('abort', cleanup);

      // Initial connection success
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`),
      );

      // Attach cleanup to the stream itself for server-side close
      (this as any).cleanup = cleanup;
    },
    cancel() {
      if ((this as any).cleanup) (this as any).cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
