/**
 * Utility functions for handling Next.js responses and streams
 */

/**
 * Wraps a ReadableStream with a timeout
 * If no data is received within the timeout period, the stream is aborted
 */
export function streamWithTimeout(
  stream: ReadableStream,
  timeoutMs: number = 30000,
): ReadableStream {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
    console.warn(`[StreamUtils] Stream timeout of ${timeoutMs}ms exceeded`);
  }, timeoutMs);

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          if (timeoutController.signal.aborted) {
            controller.error(new Error(`Stream timed out after ${timeoutMs}ms`));
            break;
          }

          controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        clearTimeout(timeoutId);
        reader.releaseLock();
      }
    },
    cancel() {
      clearTimeout(timeoutId);
    },
  });
}
