import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAndRateLimit, RATE_LIMITS } from '@/lib/middleware/auth';

/**
 * GET /api/models/audio
 * Returns latest audio generation and processing models
 */
export async function GET(req: NextRequest) {
  // Auth and rate limiting check (using chat limits for metadata)
  const authResult = await requireAuthAndRateLimit(req, '/api/models/audio', RATE_LIMITS.chat);
  if (!authResult.authenticated) {
    return authResult.response;
  }

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
      // Qwen3-TTS Models (Released January 2026)
      {
        id: 'qwen3-tts-voice-clone',
        name: 'Qwen3-TTS Voice Clone',
        provider: 'local',
        type: 'tts',
        released: '2026-01-22',
        tags: [
          'Voice Cloning',
          '3-Second Clone',
          'Multilingual',
          'Fine-tunable',
          'SOTA',
          'Apache 2.0',
        ],
        description:
          'Clone any voice from just 3 seconds of audio. Outperforms ElevenLabs and MiniMax in quality benchmarks. 97ms first-packet latency.',
        variants: ['1.7B (8GB VRAM)', '0.6B (4GB VRAM)'],
        languages: [
          'Chinese',
          'English',
          'Japanese',
          'Korean',
          'German',
          'French',
          'Russian',
          'Portuguese',
          'Spanish',
          'Italian',
        ],
        whenToUse:
          "Use when you need to replicate a specific person's voice from a short sample. Ideal for personalization, accessibility, content localization, and voice training.",
        examples: [
          {
            input: '3-second podcast host audio + transcript',
            output: 'New podcast segments in that exact voice',
          },
          {
            input: 'Voice memo + "Hello, how are you?"',
            output: 'Personalized greeting in your voice',
          },
        ],
      },
      {
        id: 'qwen3-tts-custom-voice',
        name: 'Qwen3-TTS Custom Voice',
        provider: 'local',
        type: 'tts',
        released: '2026-01-22',
        tags: ['Premium Voices', 'Style Control', 'Multilingual', 'Instruction-based', 'SOTA'],
        description:
          '9 professionally crafted voice timbres with emotion and style control via natural language instructions.',
        variants: ['1.7B (8GB VRAM)', '0.6B (4GB VRAM)'],
        languages: [
          'Chinese',
          'English',
          'Japanese',
          'Korean',
          'German',
          'French',
          'Russian',
          'Portuguese',
          'Spanish',
          'Italian',
        ],
        speakers: [
          {
            id: 'Vivian',
            description: 'Bright, slightly edgy young female',
            nativeLanguage: 'Chinese',
            bestFor: 'Marketing, Ads',
          },
          {
            id: 'Serena',
            description: 'Warm, gentle young female',
            nativeLanguage: 'Chinese',
            bestFor: 'Audiobooks, Meditation',
          },
          {
            id: 'Uncle_Fu',
            description: 'Seasoned male with low, mellow timbre',
            nativeLanguage: 'Chinese',
            bestFor: 'Documentaries, Authority',
          },
          {
            id: 'Dylan',
            description: 'Youthful Beijing male, clear natural timbre',
            nativeLanguage: 'Chinese (Beijing)',
            bestFor: 'Casual content, Vlogs',
          },
          {
            id: 'Eric',
            description: 'Lively Chengdu male, slightly husky brightness',
            nativeLanguage: 'Chinese (Sichuan)',
            bestFor: 'Regional content',
          },
          {
            id: 'Ryan',
            description: 'Dynamic male with strong rhythmic drive',
            nativeLanguage: 'English',
            bestFor: 'Dynamic content, Sports',
          },
          {
            id: 'Aiden',
            description: 'Sunny American male, clear midrange',
            nativeLanguage: 'English',
            bestFor: 'Friendly explainers',
          },
          {
            id: 'Ono_Anna',
            description: 'Playful Japanese female, light nimble timbre',
            nativeLanguage: 'Japanese',
            bestFor: 'Anime, Games',
          },
          {
            id: 'Sohee',
            description: 'Warm Korean female with rich emotion',
            nativeLanguage: 'Korean',
            bestFor: 'Emotional content, Drama',
          },
        ],
        whenToUse:
          'Use when you need consistent, professional voices without providing samples. Perfect for production content with style control.',
        instructionExamples: [
          '"Very angry tone" - Changes emotion',
          '"Whisper softly" - Changes volume/style',
          '"Speak like a news anchor" - Changes cadence',
          '"用特别愤怒的语态说" - Angry tone in Chinese',
        ],
      },
      {
        id: 'qwen3-tts-voice-design',
        name: 'Qwen3-TTS Voice Design',
        provider: 'local',
        type: 'tts',
        released: '2026-01-22',
        tags: ['Voice Creation', 'Text-to-Voice', 'Custom Characters', 'Unlimited Voices', 'SOTA'],
        description:
          'Create entirely new voices from natural language descriptions. Design any voice you can imagine - age, gender, accent, emotion, speaking style.',
        variants: ['1.7B only (8GB VRAM)'],
        languages: [
          'Chinese',
          'English',
          'Japanese',
          'Korean',
          'German',
          'French',
          'Russian',
          'Portuguese',
          'Spanish',
          'Italian',
        ],
        whenToUse:
          "Use when you need a completely custom voice that doesn't exist. Perfect for character creation, unique branding, and creative projects.",
        designExamples: [
          '"Male, 17 years old, tenor range, gaining confidence - deeper breath support now, though vowels still tighten when nervous"',
          '"Deep female voice with a British accent, authoritative but warm, like a nature documentary narrator"',
          '"Energetic infomercial host with rapid-fire delivery and exaggerated pitch rises"',
          '"体现撒娇稚嫩的萝莉女声，音调偏高且起伏明显" - Cute, childish female voice in Chinese',
        ],
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
