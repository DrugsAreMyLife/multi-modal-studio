import axios from 'axios';

/**
 * Adapter for Adobe Firefly Vector API
 */
export async function generateWithFireflyVector(prompt: string, providedKey?: string) {
  const apiKey = providedKey || process.env.FIREFLY_API_KEY;
  if (!apiKey) throw new Error('Adobe Firefly API key not configured');

  const response = await axios.post(
    'https://firefly-vector.adobe.io/v1/generate',
    {
      prompt,
      output_format: 'svg',
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
    images: [{ url: response.data.svg_url, type: 'svg' }],
  };
}
