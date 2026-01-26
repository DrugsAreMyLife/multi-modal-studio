import axios from 'axios';

interface ViduOptions {
  duration?: number;
  resolution?: string;
  movementAmplitude?: number;
}

interface ViduResponse {
  success: boolean;
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Adapter for Vidu 2.0 API
 */
export async function generateWithVidu(
  prompt: string,
  options?: ViduOptions | string,
): Promise<ViduResponse> {
  // Handle legacy signature where second param was API key
  const apiKey = typeof options === 'string' ? options : process.env.VIDU_API_KEY;
  const opts = typeof options === 'object' ? options : {};

  if (!apiKey) {
    return { success: false, error: 'Vidu API key not configured' };
  }

  try {
    const response = await axios.post(
      'https://api.vidu.art/v1/generate',
      {
        model: 'vidu-2.0',
        prompt,
        duration: opts.duration || 4,
        resolution: opts.resolution || '1080p',
        movement_amplitude: opts.movementAmplitude || 0.5,
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
      error: `Vidu generation failed: ${error}`,
    };
  }
}
