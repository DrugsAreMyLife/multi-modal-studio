import { NextResponse } from 'next/server';

/**
 * GET /api/models/audio
 * Returns latest audio generation and processing models
 */
export async function GET() {
  try {
    const models = [
      {
        id: 'sam-audio',
        name: 'Meta SAM Audio',
        provider: 'cloud',
        type: 'separation',
        released: '2025-12-16',
        tags: ['Audio Separation', 'Multimodal', 'SOTA', 'Instrument', 'Speech', 'Sound'],
        description:
          'First unified multimodal model for audio separation with text, visual, and temporal prompts',
      },
      {
        id: 'elevenlabs-v3',
        name: 'ElevenLabs Multilingual V3',
        provider: 'cloud',
        type: 'tts',
        released: '2025-11-10',
        tags: ['TTS', 'Multilingual', 'Voice Cloning'],
      },
      {
        id: 'openai-tts-1-hd',
        name: 'OpenAI TTS-1-HD',
        provider: 'cloud',
        type: 'tts',
        released: '2024-03-15',
        tags: ['TTS', 'High-Quality'],
      },
    ];

    return NextResponse.json({
      success: true,
      models,
      count: models.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching audio models:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch audio models',
        models: [],
      },
      { status: 500 },
    );
  }
}
