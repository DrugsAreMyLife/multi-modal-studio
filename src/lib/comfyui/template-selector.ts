import type { TemplateMatchScore } from './generation-types';
import { GenerationConfidence } from './generation-types';
import { COMFYUI_TEMPLATES } from './templates';
import type { WorkflowTemplate } from './types';

const INTENT_KEYWORDS = {
  'txt2img-basic': ['generate', 'create', 'make', 'portrait', 'landscape', 'image of', 'draw'],
  img2img: ['transform', 'change style', 'modify', 'alter', 'based on', 'from image'],
  inpaint: ['remove', 'replace', 'fix', 'erase', 'fill', 'mask', 'inpaint'],
  upscale: ['upscale', '4k', '8k', 'higher resolution', 'enhance quality', 'upscaling'],
  'lora-generation': [
    'style',
    'anime',
    'with trained model',
    'lora',
    'custom style',
    'trained',
    'fine-tune',
  ],
};

/**
 * Analyzes a user prompt and returns ranked template suggestions with confidence scores
 * @param userPrompt - The user's natural language prompt
 * @returns Sorted array of template matches with scores
 */
export function selectBestTemplate(userPrompt: string): TemplateMatchScore[] {
  const prompt = userPrompt.toLowerCase();
  const scores: TemplateMatchScore[] = [];

  for (const template of COMFYUI_TEMPLATES) {
    const keywords = INTENT_KEYWORDS[template.id as keyof typeof INTENT_KEYWORDS] || [];
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of keywords) {
      if (prompt.includes(keyword)) {
        score += 0.2;
        matchedKeywords.push(keyword);
      }
    }

    // Normalize score to 0-1
    score = Math.min(score, 1.0);

    // Determine confidence
    const confidence = determineConfidence(score);

    scores.push({
      templateId: template.id,
      score,
      confidence,
      reasoning:
        matchedKeywords.length > 0
          ? `Matched keywords: ${matchedKeywords.join(', ')}`
          : 'No direct keyword matches',
    });
  }

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Retrieves a template by its ID
 * @param templateId - The template ID to retrieve
 * @returns The template or undefined if not found
 */
export function getTemplate(templateId: string): WorkflowTemplate | undefined {
  return COMFYUI_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Validates whether the best template match has sufficient confidence
 * @param scores - Array of template match scores
 * @returns Object indicating confidence and suggestion
 */
export function validateTemplateSelection(scores: TemplateMatchScore[]): {
  isConfident: boolean;
  suggestion?: string;
} {
  const best = scores[0];

  if (!best) {
    return {
      isConfident: false,
      suggestion: 'No templates matched. Please clarify your request.',
    };
  }

  if (best.score < 0.4) {
    return {
      isConfident: false,
      suggestion: `Low confidence in template selection. Did you mean to use ${best.templateId}?`,
    };
  }

  return { isConfident: true };
}

/**
 * Helper function to determine confidence level based on score
 * @param score - Normalized score (0-1)
 * @returns Confidence level enum value
 */
function determineConfidence(score: number): GenerationConfidence {
  if (score >= 0.8) {
    return GenerationConfidence.VERY_HIGH;
  } else if (score >= 0.6) {
    return GenerationConfidence.HIGH;
  } else if (score >= 0.4) {
    return GenerationConfidence.MEDIUM;
  } else {
    return GenerationConfidence.LOW;
  }
}
