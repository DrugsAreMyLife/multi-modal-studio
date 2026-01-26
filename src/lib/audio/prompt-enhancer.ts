import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { generateText } from 'ai';

export interface PromptEnhancement {
  original: string;
  enhanced: string;
  explanation: string;
}

export async function enhanceAudioPrompt(
  prompt: string,
  feedback?: string,
  type: 'music' | 'sfx' | 'sample' = 'music',
): Promise<PromptEnhancement> {
  const model = createUniversalModel('anthropic', 'claude-3-5-sonnet-latest');

  const systemPrompt = `You are an expert Audio Prompt Engineer. Your goal is to transform simple descriptions into highly detailed, technical prompts for high-fidelity audio generation models like HeartMuLa, Stable Audio, and AudioLDM2.
  
  Focus on:
  - Acoustic characteristics (reverb, delay, spatiality)
  - Instrument specifics (timbre, attack, decay)
  - Technical parameters (BPM, key, spectral balance)
  - Emotional texture
  
  If feedback is provided, iterate on the original prompt to reflect the requested changes precisely.
  
  Return a JSON object with:
  {
    "enhanced": "The full detailed prompt",
    "explanation": "Briefly why these changes were made"
  }`;

  const userMessage = feedback
    ? `Original Prompt: "${prompt}"\nUser wants to change: "${feedback}"\nEnhance this description for ${type} generation.`
    : `Enhance this ${type} prompt: "${prompt}"`;

  const { text } = await generateText({
    model,
    system: systemPrompt,
    prompt: userMessage,
  });

  try {
    const data = JSON.parse(text);
    return {
      original: prompt,
      enhanced: data.enhanced,
      explanation: data.explanation,
    };
  } catch (e) {
    return {
      original: prompt,
      enhanced: text,
      explanation: 'Direct model output',
    };
  }
}
