/**
 * NVIDIA PersonaPlex Provider Adapter
 *
 * PersonaPlex is a 7B parameter full-duplex conversational voice AI
 * that runs locally with support for:
 * - Voice cloning from reference audio
 * - Persona-based conversation style
 * - Natural backchannels ("uh-huh", "oh", etc.)
 * - Interruption handling and turn-taking
 * - Emotional expression control
 * - Real-time streaming output
 *
 * Runs on local GPU via Python worker (requires ~16GB VRAM)
 */

export interface PersonaPlexConfig {
  text: string;
  voice_prompt?: string; // Base64 audio or file path for voice cloning
  persona_description?: string;
  enable_backchannels?: boolean;
  enable_interruptions?: boolean;
  emotional_expression?: number; // 0-1
  sample_rate?: number; // 16000, 24000, 48000
  streaming_mode?: boolean;
}

export interface PersonaPlexResponse {
  success: boolean;
  jobId?: string;
  audioUrl?: string;
  audioBase64?: string;
  duration?: number;
  error?: string;
}

const PERSONAPLEX_PORT = 8015;
const PERSONAPLEX_HOST = process.env.PERSONAPLEX_HOST || 'localhost';

/**
 * Check if PersonaPlex worker is running
 */
export async function checkPersonaPlexHealth(): Promise<{ ready: boolean; error?: string }> {
  try {
    const response = await fetch(`http://${PERSONAPLEX_HOST}:${PERSONAPLEX_PORT}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { ready: false, error: 'PersonaPlex worker not responding' };
    }

    const data = await response.json();
    return {
      ready: data.status === 'ready',
      error: data.status !== 'ready' ? `PersonaPlex status: ${data.status}` : undefined,
    };
  } catch (error) {
    return { ready: false, error: `PersonaPlex connection failed: ${error}` };
  }
}

/**
 * Generate speech using PersonaPlex
 */
export async function generateWithPersonaPlex(
  config: PersonaPlexConfig,
): Promise<PersonaPlexResponse> {
  // Validate config
  if (!config.text || config.text.trim().length === 0) {
    return { success: false, error: 'Text input is required' };
  }

  // Check worker health first
  const health = await checkPersonaPlexHealth();
  if (!health.ready) {
    return { success: false, error: health.error || 'PersonaPlex not ready' };
  }

  try {
    const response = await fetch(`http://${PERSONAPLEX_HOST}:${PERSONAPLEX_PORT}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: config.text,
        voice_prompt: config.voice_prompt,
        persona_description: config.persona_description || 'A friendly conversational assistant',
        config: {
          enable_backchannels: config.enable_backchannels ?? true,
          enable_interruptions: config.enable_interruptions ?? true,
          emotional_expression: config.emotional_expression ?? 0.5,
          sample_rate: config.sample_rate ?? 24000,
          streaming: config.streaming_mode ?? true,
        },
      }),
      signal: AbortSignal.timeout(120000), // 2 minute timeout for generation
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `PersonaPlex generation failed: ${errorText}` };
    }

    const data = await response.json();

    return {
      success: true,
      jobId: data.job_id,
      audioUrl: data.audio_url,
      audioBase64: data.audio_base64,
      duration: data.duration,
    };
  } catch (error) {
    return { success: false, error: `PersonaPlex error: ${error}` };
  }
}

/**
 * Stream audio from PersonaPlex in real-time
 */
export async function streamPersonaPlexAudio(
  config: PersonaPlexConfig,
): Promise<ReadableStream<Uint8Array> | null> {
  // Check worker health first
  const health = await checkPersonaPlexHealth();
  if (!health.ready) {
    console.error('[PersonaPlex] Worker not ready:', health.error);
    return null;
  }

  try {
    const response = await fetch(`http://${PERSONAPLEX_HOST}:${PERSONAPLEX_PORT}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/wav',
      },
      body: JSON.stringify({
        text: config.text,
        voice_prompt: config.voice_prompt,
        persona_description: config.persona_description || 'A friendly conversational assistant',
        config: {
          enable_backchannels: config.enable_backchannels ?? true,
          enable_interruptions: config.enable_interruptions ?? true,
          emotional_expression: config.emotional_expression ?? 0.5,
          sample_rate: config.sample_rate ?? 24000,
        },
      }),
    });

    if (!response.ok || !response.body) {
      console.error('[PersonaPlex] Stream failed:', response.status);
      return null;
    }

    return response.body;
  } catch (error) {
    console.error('[PersonaPlex] Stream error:', error);
    return null;
  }
}

/**
 * Clone a voice from reference audio
 */
export async function cloneVoiceWithPersonaPlex(
  voicePrompt: string, // Base64 audio
  name: string,
): Promise<{ success: boolean; voiceId?: string; error?: string }> {
  const health = await checkPersonaPlexHealth();
  if (!health.ready) {
    return { success: false, error: health.error };
  }

  try {
    const response = await fetch(`http://${PERSONAPLEX_HOST}:${PERSONAPLEX_PORT}/clone-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: voicePrompt,
        name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return {
      success: true,
      voiceId: data.voice_id,
    };
  } catch (error) {
    return { success: false, error: `Voice clone failed: ${error}` };
  }
}

/**
 * Start a full-duplex conversation session
 */
export async function startConversationSession(
  config: Omit<PersonaPlexConfig, 'text'>,
): Promise<{ success: boolean; sessionId?: string; wsUrl?: string; error?: string }> {
  const health = await checkPersonaPlexHealth();
  if (!health.ready) {
    return { success: false, error: health.error };
  }

  try {
    const response = await fetch(`http://${PERSONAPLEX_HOST}:${PERSONAPLEX_PORT}/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voice_prompt: config.voice_prompt,
        persona_description: config.persona_description,
        config: {
          enable_backchannels: config.enable_backchannels ?? true,
          enable_interruptions: config.enable_interruptions ?? true,
          emotional_expression: config.emotional_expression ?? 0.5,
          sample_rate: config.sample_rate ?? 24000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText };
    }

    const data = await response.json();
    return {
      success: true,
      sessionId: data.session_id,
      wsUrl: `ws://${PERSONAPLEX_HOST}:${PERSONAPLEX_PORT}/session/${data.session_id}`,
    };
  } catch (error) {
    return { success: false, error: `Session start failed: ${error}` };
  }
}
