import axios from 'axios';

/**
 * Adapter for Pika 2.1 API
 */
export async function generateWithPika(prompt: string, options: any = {}, providedKey?: string) {
  const apiKey = providedKey || process.env.PIKA_API_KEY;
  if (!apiKey) throw new Error('Pika API key not configured');

  const response = await axios.post(
    'https://api.pika.art/v1/generate',
    {
      model: options.model || 'pika-2.1-turbo',
      prompt,
      aspect_ratio: options.aspectRatio || '16:9',
      motion: options.motion || 0.5,
      negative_prompt: options.negativePrompt,
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
