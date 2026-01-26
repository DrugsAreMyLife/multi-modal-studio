import axios from 'axios';

/**
 * Adapter for Recraft v3 Icon Generation
 */
export async function generateWithRecraft(prompt: string, providedKey?: string) {
  const apiKey = providedKey || process.env.RECRAFT_API_KEY;
  if (!apiKey) throw new Error('Recraft API key not configured');

  const response = await axios.post(
    'https://api.recraft.ai/v1/generations',
    {
      prompt,
      style: 'icon',
      model: 'recraft-v3',
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
    images: response.data.images.map((img: any) => ({ url: img.url })),
  };
}
