import axios from 'axios';

interface GenmoOptions {
  negative_prompt?: string;
  num_frames?: number;
  steps?: number;
}

interface GenmoResponse {
  success: boolean;
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Adapter for Genmo Mochi-1 API
 */
export async function generateWithGenmo(
  prompt: string,
  options?: GenmoOptions | Record<string, any> | string,
): Promise<GenmoResponse> {
  // Handle legacy signature where second param was API key
  const apiKey = typeof options === 'string' ? options : process.env.GENMO_API_KEY;
  const opts: GenmoOptions = typeof options === 'object' ? options : {};

  if (!apiKey) {
    return { success: false, error: 'Genmo API key not configured' };
  }

  try {
    const response = await axios.post(
      'https://api.genmo.ai/v1/generate',
      {
        model: 'mochi-1',
        prompt,
        negative_prompt: opts.negative_prompt,
        num_frames: opts.num_frames || 120,
        steps: opts.steps || 50,
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
      error: `Genmo generation failed: ${error}`,
    };
  }
}
