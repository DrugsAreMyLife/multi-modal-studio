import axios from 'axios';

export interface FluxMaxOptions {
  prompt: string;
  width?: number;
  height?: number;
  num_outputs?: number;
}

/**
 * Adapter for Black Forest Labs FLUX 2 Max via Replicate
 */
export async function generateWithFluxMax(
  options: FluxMaxOptions,
  providedToken?: string,
  webhookUrl?: string,
) {
  const token = providedToken || process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('Replicate API token not configured');

  const response = await axios.post(
    'https://api.replicate.com/v1/predictions',
    {
      version: 'black-forest-labs/flux-2-max', // Placeholder for actual version ID
      input: {
        prompt: options.prompt,
        width: options.width || 1024,
        height: options.height || 1024,
        num_outputs: options.num_outputs || 1,
      },
      webhook: webhookUrl,
      webhook_events_filter: ['start', 'completed'],
    },
    {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return {
    success: true,
    jobId: response.data.id,
    status: 'pending' as const,
  };
}
