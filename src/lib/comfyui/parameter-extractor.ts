import type { ParameterExtractionResult } from './generation-types';

const DIMENSION_MAP: Record<string, { width: number; height: number }> = {
  portrait: { width: 512, height: 768 },
  landscape: { width: 768, height: 512 },
  square: { width: 512, height: 512 },
  '4k': { width: 3840, height: 2160 },
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
};

const QUALITY_PRESETS: Record<string, { steps: number; cfg: number }> = {
  'low quality': { steps: 15, cfg: 5 },
  'medium quality': { steps: 25, cfg: 7 },
  'high quality': { steps: 35, cfg: 8 },
  'ultra quality': { steps: 50, cfg: 9 },
};

export function extractParameters(userPrompt: string): ParameterExtractionResult {
  const prompt = userPrompt.toLowerCase();
  const parameters: Record<string, unknown> = {};
  const inferredDefaults: Record<string, unknown> = {};
  const missingRequired: string[] = [];

  // Extract dimensions
  let dimensionsFound = false;
  for (const [key, dims] of Object.entries(DIMENSION_MAP)) {
    if (prompt.includes(key)) {
      parameters.width = dims.width;
      parameters.height = dims.height;
      dimensionsFound = true;
      break;
    }
  }

  if (!dimensionsFound) {
    inferredDefaults.width = 512;
    inferredDefaults.height = 512;
  }

  // Extract quality
  let qualityFound = false;
  for (const [key, quality] of Object.entries(QUALITY_PRESETS)) {
    if (prompt.includes(key)) {
      parameters.steps = quality.steps;
      parameters.cfg = quality.cfg;
      qualityFound = true;
      break;
    }
  }

  if (!qualityFound) {
    inferredDefaults.steps = 25;
    inferredDefaults.cfg = 7;
  }

  // Extract prompt components
  if (!parameters.prompt) {
    parameters.prompt = userPrompt;
  }

  // Extract negative prompt keywords
  const negativeKeywords = ['blurry', 'low quality', 'distorted'];
  const foundNegatives = negativeKeywords.filter((kw) => prompt.includes(kw));
  if (foundNegatives.length > 0) {
    parameters.negative_prompt = foundNegatives.join(', ');
  } else {
    inferredDefaults.negative_prompt = '';
  }

  // Calculate confidence
  const explicitParams = Object.keys(parameters).length;
  const totalParams = explicitParams + Object.keys(inferredDefaults).length;
  const confidence = explicitParams / totalParams;

  return {
    parameters: { ...inferredDefaults, ...parameters },
    confidence,
    missingRequired,
    inferredDefaults,
  };
}

export function mergeParameters(
  extracted: Record<string, unknown>,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  return { ...defaults, ...extracted };
}
