/**
 * Qwen3-TTS Client Library
 *
 * Provides types, utilities, and client functions for interacting with
 * the Qwen3-TTS local inference worker.
 *
 * Models supported:
 * - Voice Clone: 1.7B, 0.6B (clone any voice from 3-second sample)
 * - Custom Voice: 1.7B, 0.6B (9 premium voices with style control)
 * - Voice Design: 1.7B only (create voices from text descriptions)
 *
 * @see https://github.com/QwenLM/Qwen3-TTS
 */

// ============================================================================
// Types
// ============================================================================

export type QwenTTSModelSize = '1.7b' | '0.6b';

export type QwenTTSSpeaker =
  | 'Vivian' // Female, bright/edgy, Chinese
  | 'Serena' // Female, warm/gentle, Chinese
  | 'Uncle_Fu' // Male, deep/mellow, Chinese
  | 'Dylan' // Male, clear/natural, Beijing Chinese
  | 'Eric' // Male, lively/husky, Sichuan Chinese
  | 'Ryan' // Male, dynamic/rhythmic, English
  | 'Aiden' // Male, sunny/clear, American English
  | 'Ono_Anna' // Female, playful/nimble, Japanese
  | 'Sohee'; // Female, warm/emotional, Korean

export type QwenTTSLanguage =
  | 'Chinese'
  | 'English'
  | 'Japanese'
  | 'Korean'
  | 'German'
  | 'French'
  | 'Russian'
  | 'Portuguese'
  | 'Spanish'
  | 'Italian';

export interface VoiceCloneRequest {
  /** Text to synthesize */
  text: string;
  /** Reference audio (URL, base64, or file path) */
  refAudio: string;
  /** Transcript of the reference audio (required for best quality) */
  refText: string;
  /** Target language for synthesis */
  language: QwenTTSLanguage;
  /** Model size (1.7b = higher quality, 0.6b = faster/less VRAM) */
  model?: QwenTTSModelSize;
  /** If true, only use speaker embedding (faster but lower quality) */
  xVectorOnlyMode?: boolean;
}

export interface CustomVoiceRequest {
  /** Text to synthesize */
  text: string;
  /** One of 9 premium voice timbres */
  speaker: QwenTTSSpeaker;
  /** Target language for synthesis */
  language: QwenTTSLanguage;
  /** Style/emotion instruction (e.g., "very angry tone", "whisper softly") */
  instruct?: string;
  /** Model size (1.7b = higher quality, 0.6b = faster/less VRAM) */
  model?: QwenTTSModelSize;
}

export interface VoiceDesignRequest {
  /** Text to synthesize */
  text: string;
  /** Natural language description of desired voice */
  instruct: string;
  /** Target language for synthesis */
  language: QwenTTSLanguage;
}

export interface QwenTTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  sampleRate?: number;
  duration?: number;
  error?: string;
}

export interface QwenTTSWorkerStatus {
  healthy: boolean;
  modelLoaded: string | null;
  gpuAvailable: boolean;
  vramUsage?: string;
  version?: string;
}

// ============================================================================
// Speaker Metadata
// ============================================================================

export const QWEN_TTS_SPEAKERS: Record<
  QwenTTSSpeaker,
  {
    description: string;
    nativeLanguage: QwenTTSLanguage;
    bestFor: string;
    gender: 'male' | 'female';
  }
> = {
  Vivian: {
    description: 'Bright, slightly edgy young female voice',
    nativeLanguage: 'Chinese',
    bestFor: 'Marketing, Ads, Announcements',
    gender: 'female',
  },
  Serena: {
    description: 'Warm, gentle young female voice',
    nativeLanguage: 'Chinese',
    bestFor: 'Audiobooks, Meditation, ASMR',
    gender: 'female',
  },
  Uncle_Fu: {
    description: 'Seasoned male voice with a low, mellow timbre',
    nativeLanguage: 'Chinese',
    bestFor: 'Documentaries, Authority, Narration',
    gender: 'male',
  },
  Dylan: {
    description: 'Youthful Beijing male voice with a clear, natural timbre',
    nativeLanguage: 'Chinese',
    bestFor: 'Casual content, Vlogs, Tutorials',
    gender: 'male',
  },
  Eric: {
    description: 'Lively Chengdu male voice with a slightly husky brightness',
    nativeLanguage: 'Chinese',
    bestFor: 'Regional content, Entertainment',
    gender: 'male',
  },
  Ryan: {
    description: 'Dynamic male voice with strong rhythmic drive',
    nativeLanguage: 'English',
    bestFor: 'Dynamic content, Sports, Gaming',
    gender: 'male',
  },
  Aiden: {
    description: 'Sunny American male voice with a clear midrange',
    nativeLanguage: 'English',
    bestFor: 'Friendly explainers, E-learning',
    gender: 'male',
  },
  Ono_Anna: {
    description: 'Playful Japanese female voice with a light, nimble timbre',
    nativeLanguage: 'Japanese',
    bestFor: 'Anime, Games, Character voices',
    gender: 'female',
  },
  Sohee: {
    description: 'Warm Korean female voice with rich emotion',
    nativeLanguage: 'Korean',
    bestFor: 'Emotional content, Drama, K-content',
    gender: 'female',
  },
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the worker URL from environment
 */
export function getQwenTTSWorkerUrl(): string {
  const url = process.env.QWEN_TTS_WORKER_URL || 'http://localhost:8003';
  return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Check if the Qwen3-TTS worker is healthy
 */
export async function checkWorkerHealth(): Promise<QwenTTSWorkerStatus> {
  try {
    const response = await fetch(`${getQwenTTSWorkerUrl()}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { healthy: false, modelLoaded: null, gpuAvailable: false };
    }

    const data = await response.json();
    return {
      healthy: true,
      modelLoaded: data.model_loaded || null,
      gpuAvailable: data.gpu_available || false,
      vramUsage: data.vram_usage,
      version: data.version,
    };
  } catch {
    return { healthy: false, modelLoaded: null, gpuAvailable: false };
  }
}

/**
 * Validate reference audio for voice cloning
 * - Must be at least 3 seconds for best quality
 * - Supports URL, base64, or file path
 */
export function validateRefAudio(refAudio: string): { valid: boolean; error?: string } {
  if (!refAudio || refAudio.trim().length === 0) {
    return { valid: false, error: 'Reference audio is required' };
  }

  // Check if it's a URL
  if (refAudio.startsWith('http://') || refAudio.startsWith('https://')) {
    return { valid: true };
  }

  // Check if it's base64
  if (refAudio.startsWith('data:audio/') || /^[A-Za-z0-9+/=]+$/.test(refAudio)) {
    return { valid: true };
  }

  // Check if it looks like a file path
  if (refAudio.includes('/') || refAudio.includes('\\')) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid reference audio format. Use URL, base64, or file path.' };
}

/**
 * Get recommended speaker for a given language
 */
export function getRecommendedSpeaker(language: QwenTTSLanguage): QwenTTSSpeaker {
  const languageToSpeaker: Record<QwenTTSLanguage, QwenTTSSpeaker> = {
    Chinese: 'Vivian',
    English: 'Aiden',
    Japanese: 'Ono_Anna',
    Korean: 'Sohee',
    German: 'Ryan',
    French: 'Ryan',
    Russian: 'Ryan',
    Portuguese: 'Ryan',
    Spanish: 'Ryan',
    Italian: 'Ryan',
  };
  return languageToSpeaker[language];
}

/**
 * Estimate VRAM requirement based on model size
 */
export function estimateVRAM(model: QwenTTSModelSize): string {
  return model === '1.7b' ? '~8GB' : '~4GB';
}

/**
 * Build instruction prompt for custom voice
 */
export function buildCustomVoiceInstruction(
  emotion?: string,
  style?: string,
  speed?: 'slow' | 'normal' | 'fast',
): string {
  const parts: string[] = [];

  if (emotion) {
    parts.push(`Speak with ${emotion} emotion`);
  }

  if (style) {
    parts.push(`in a ${style} style`);
  }

  if (speed && speed !== 'normal') {
    parts.push(speed === 'slow' ? 'at a slower pace' : 'at a faster pace');
  }

  return parts.join(' ').trim() || '';
}

/**
 * Example voice design prompts for inspiration
 */
export const VOICE_DESIGN_EXAMPLES = [
  {
    category: 'Age & Gender',
    examples: [
      'Young female voice, early 20s, bright and energetic',
      'Elderly male voice, 70s, wise and measured',
      'Teenage boy, voice cracking slightly, enthusiastic',
    ],
  },
  {
    category: 'Accent & Region',
    examples: [
      'British female voice, posh accent, like a BBC presenter',
      'Southern American male, warm drawl, friendly storyteller',
      'Australian female, casual and upbeat',
    ],
  },
  {
    category: 'Emotion & Tone',
    examples: [
      'Speak in an incredulous tone, with a hint of panic',
      'Very angry, barely containing rage',
      'Gentle and soothing, like a meditation guide',
    ],
  },
  {
    category: 'Character Types',
    examples: [
      'Villain voice, deep and menacing, savoring every word',
      'Anime protagonist, determined and hopeful',
      'News anchor, professional and neutral',
    ],
  },
];
