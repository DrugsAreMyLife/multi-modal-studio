import axios from 'axios';

/**
 * Adapter for OpenAI Sora 2 API
 */
export async function generateWithSora(prompt: string, options: any = {}, providedKey?: string) {
  const apiKey = providedKey || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await axios.post(
    'https://api.openai.com/v1/video/generations',
    {
      model: 'sora-2',
      prompt,
      duration: Number(options.duration) || 15,
      resolution: options.resolution || '1280x720',
      audio_sync: options.audio_sync ?? true,
      video_style: options.video_style || 'cinematic',
      storyboard: options.storyboard_mode ?? false,
      character_cameos: options.character_cameos || [],
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
