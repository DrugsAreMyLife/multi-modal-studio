export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

export class RateLimitError extends Error {
  retryAfter: number;
  statusCode: number;

  constructor(message: string, retryAfter: number, statusCode: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.statusCode = statusCode;
  }
}

export function isRetryableError(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
  return Math.min(exponentialDelay, config.maxDelayMs);
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!isRetryableError(response.status)) {
        return response;
      }

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
        const delayMs = retryAfter > 0 ? retryAfter * 1000 : calculateDelay(attempt, config);

        if (attempt < config.maxRetries) {
          console.warn(
            `Rate limited. Retrying in ${delayMs}ms... (attempt ${attempt + 1}/${config.maxRetries})`,
          );
          await delay(delayMs);
          continue;
        }

        throw new RateLimitError('Rate limit exceeded. Please try again later.', retryAfter, 429);
      }

      if (attempt < config.maxRetries) {
        const delayMs = calculateDelay(attempt, config);
        console.warn(`Server error ${response.status}. Retrying in ${delayMs}ms...`);
        await delay(delayMs);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (error instanceof RateLimitError) {
        throw error;
      }
      if (attempt < config.maxRetries) {
        const delayMs = calculateDelay(attempt, config);
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
