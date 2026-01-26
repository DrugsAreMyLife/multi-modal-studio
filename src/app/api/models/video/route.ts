import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

/**
 * GET /api/models/video
 * Returns latest video generation models
 */
export async function GET(req: NextRequest) {
  // Auth and rate limiting check (using chat limits for metadata)
  const authResult = await requireAuthAndRateLimit(req, '/api/models/video', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const models = [
      {
        id: 'sora-2',
        name: 'Sora 2 (OpenAI)',
        provider: 'cloud',
        tier: 'ultra',
        released: '2026-01-10',
        capabilities: {
          max_duration: 60,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'runway-gen-4.5',
        name: 'Runway Gen-4.5',
        provider: 'cloud',
        tier: 'ultra',
        released: '2026-01-05',
        capabilities: {
          max_duration: 10,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'veo-3.1',
        name: 'Google Veo 3.1',
        provider: 'cloud',
        tier: 'ultra',
        released: '2025-12-20',
        capabilities: {
          max_duration: 120,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'luma-ray3-hdr',
        name: 'Luma Ray 3 HDR',
        provider: 'cloud',
        tier: 'ultra',
        released: '2026-01-15',
        capabilities: {
          max_duration: 9,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'kling-2.5-turbo',
        name: 'Kling 2.5 Turbo',
        provider: 'cloud',
        tier: 'ultra',
        released: '2025-12-10',
        capabilities: {
          max_duration: 10,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'pika-2.1-turbo',
        name: 'Pika 2.1 Turbo',
        provider: 'cloud',
        tier: 'pro',
        released: '2025-11-25',
        capabilities: {
          max_duration: 10,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'hunyuan-video',
        name: 'Hunyuan Video (13B)',
        provider: 'cloud',
        tier: 'ultra',
        released: '2025-12-05',
        capabilities: {
          max_duration: 10,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'vidu-2.0',
        name: 'Vidu 2.0',
        provider: 'cloud',
        tier: 'pro',
        released: '2025-11-15',
        capabilities: {
          max_duration: 8,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'genmo-mochi-1',
        name: 'Genmo Mochi 1 (10B)',
        provider: 'cloud',
        tier: 'standard',
        released: '2024-10-20',
        capabilities: {
          max_duration: 8,
          supports_extensions: false,
          supports_camera: false,
        },
      },
      {
        id: 'haiper-2.0',
        name: 'Haiper 2.0',
        provider: 'cloud',
        tier: 'pro',
        released: '2025-10-30',
        capabilities: {
          max_duration: 8,
          supports_extensions: true,
          supports_camera: true,
        },
      },
      {
        id: 'adobe-firefly-video',
        name: 'Adobe Firefly Video',
        provider: 'cloud',
        tier: 'pro',
        released: '2025-09-15',
        capabilities: {
          max_duration: 10,
          supports_extensions: true,
          supports_camera: true,
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
    console.error('Error fetching video models:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch video models',
        models: [],
      },
      { status: 500 },
    );
  }
}
