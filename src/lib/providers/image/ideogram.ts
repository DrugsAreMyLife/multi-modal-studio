import axios from 'axios';

/**
 * Adapter for Ideogram 3.0 API
 */
export async function generateWithIdeogram(prompt: string, providedKey?: string) {
  const apiKey = providedKey || process.env.IDEOGRAM_API_KEY;
  if (!apiKey) throw new Error('Ideogram API key not configured');

  const response = await axios.post(
    'https://api.ideogram.ai/generate',
    {
      prompt,
      model: 'ideogram-3.0',
      aspect_ratio: '1:1',
      style: 'auto',
    },
    {
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    },
  );

  return {
    success: true,
    images: response.data.data.map((img: any) => ({ url: img.url })),
  };
}
