import axios from 'axios';

interface FireflyVideoOptions {
  duration?: number;
  resolution?: string;
  frameRate?: number;
}

interface FireflyVideoResponse {
  success: boolean;
  jobId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Adapter for Adobe Firefly Video API
 */
export async function generateWithFireflyVideo(
  prompt: string,
  options?: FireflyVideoOptions | string,
): Promise<FireflyVideoResponse> {
  // Handle legacy signature where second param was API key
  const apiKey = typeof options === 'string' ? options : process.env.FIREFLY_API_KEY;
  const opts = typeof options === 'object' ? options : {};

  if (!apiKey) {
    return { success: false, error: 'Adobe Firefly API key not configured' };
  }

  try {
    const response = await axios.post(
      'https://firefly-video.adobe.io/v1/generate',
      {
        prompt,
        model: 'firefly-video-v1',
        duration: opts.duration || 4,
        resolution: opts.resolution || '1080p',
        frame_rate: opts.frameRate || 24,
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
      error: `Adobe Firefly Video generation failed: ${error}`,
    };
  }
}
