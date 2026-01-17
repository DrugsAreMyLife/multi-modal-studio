import { NextResponse } from 'next/server';

/**
 * GET /api/models/image
 * Returns latest image generation models
 */
export async function GET() {
  try {
    // In production, this would fetch from:
    // - External model registries (Hugging Face, Replicate, etc.)
    // - Database with model metadata
    // - Cached registry data

    const models = [
      {
        id: 'qwen-image-2512',
        name: 'Qwen-Image-2512',
        provider: 'cloud',
        released: '2026-01-04',
        capabilities: {
          supports_inpainting: true,
          supports_outpainting: true,
          supports_cfg: true,
          supports_steps: true,
          supports_negative_prompt: true,
          supports_streaming: true,
        },
      },
      {
        id: 'hunyuan-image-3.0',
        name: 'Hunyuan Image 3.0 (80B)',
        provider: 'cloud',
        released: '2025-12-15',
        capabilities: {
          supports_inpainting: true,
          supports_outpainting: true,
          supports_cfg: true,
          supports_steps: true,
          supports_negative_prompt: true,
          supports_streaming: true,
        },
      },
      {
        id: 'gpt-image-1.5',
        name: 'GPT Image 1.5 (OpenAI)',
        provider: 'cloud',
        released: '2025-12-16',
        capabilities: {
          supports_inpainting: true,
          supports_outpainting: true,
          supports_cfg: false,
          supports_steps: false,
          supports_negative_prompt: true,
          supports_streaming: false,
        },
      },
      {
        id: 'flux-2-max',
        name: 'FLUX 2 Max',
        provider: 'cloud',
        released: '2025-11-20',
        capabilities: {
          supports_inpainting: true,
          supports_outpainting: true,
          supports_cfg: true,
          supports_steps: true,
          supports_negative_prompt: true,
          supports_streaming: true,
        },
      },
      {
        id: 'midjourney-v7',
        name: 'Midjourney v7',
        provider: 'cloud',
        released: '2025-10-15',
        capabilities: {
          supports_inpainting: true,
          supports_outpainting: true,
          supports_cfg: false,
          supports_steps: false,
          supports_negative_prompt: true,
          supports_streaming: true,
        },
      },
      {
        id: 'sam-2',
        name: 'SAM 2 (Segment Anything)',
        provider: 'cloud',
        released: '2025-09-10',
        capabilities: {
          supports_inpainting: true,
          supports_outpainting: true,
          supports_cfg: false,
          supports_steps: false,
          supports_negative_prompt: false,
          supports_streaming: false,
        },
      },
      {
        id: 'ideogram-3.0',
        name: 'Ideogram 3.0 (Text Master)',
        provider: 'cloud',
        released: '2025-08-25',
        capabilities: {
          supports_inpainting: false,
          supports_outpainting: false,
          supports_cfg: false,
          supports_steps: false,
          supports_negative_prompt: true,
          supports_streaming: false,
        },
      },
    ];

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching image models:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch image models',
        models: [],
      },
      { status: 500 },
    );
  }
}
