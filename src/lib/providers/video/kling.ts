import axios from 'axios';

/**
 * Adapter for Kling 2.5 API
 */
export async function generateWithKling(prompt: string, options: any = {}, providedKey?: string) {
  const apiKey = providedKey || process.env.KLING_API_KEY;
  if (!apiKey) throw new Error('Kling API key not configured');

  const response = await axios.post(
    'https://api.klingai.com/v1/videos/generations',
    {
      model: options.model || 'kling-2.6-pro',
      prompt,
      duration: Number(options.duration) || 5,
      cfg_scale: options.cfg_scale || 0.5,
      resolution: options.resolution || '1920x1080',
      enable_audio: options.enable_audio ?? false,
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
}
