import axios from 'axios';

interface HaiperOptions {
  duration?: number;
  aspectRatio?: string;
}

interface HaiperResponse {
  success: boolean;
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Adapter for Haiper 2.0 API
 */
export async function generateWithHaiper(
  prompt: string,
  options?: HaiperOptions | string,
): Promise<HaiperResponse> {
  // Handle legacy signature where second param was API key
  const apiKey = typeof options === 'string' ? options : process.env.HAIPER_API_KEY;
  const opts = typeof options === 'object' ? options : {};

  if (!apiKey) {
    return { success: false, error: 'Haiper API key not configured' };
  }

  try {
    const response = await axios.post(
      'https://api.haiper.ai/v1/generate',
      {
        model: 'haiper-2.0',
        prompt,
        duration: opts.duration || 4,
        aspect_ratio: opts.aspectRatio || '16:9',
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      success: true,
      jobId: response.data.id,
      status: 'pending' as const,
    };
  } catch (error) {
    return {
      success: false,
      error: `Haiper generation failed: ${error}`,
    };
  }
}
