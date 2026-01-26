/**
 * Model Validation Utilities
 *
 * Provides centralized validation for model IDs and parameters
 * using definitions from generation-models.ts
 */

import {
  GenerationModel,
  GenerationType,
  ParameterDefinition,
  getGenerationModelById,
  getModelsByType,
} from '@/lib/models/generation-models';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParameterValidationResult extends ValidationResult {
  validatedParams: Record<string, any>;
}

// Legacy ID mappings for backward compatibility
const LEGACY_ID_MAPPINGS: Record<string, string> = {
  // Video models
  'runway-gen-4': 'runway-gen4',
  'runway-gen-3-alpha': 'runway-gen3-alpha',
  'luma-ray-3': 'luma-ray3',
  'luma-ray-2': 'luma-ray2',
  'kling-2.5-turbo': 'kling-2.5',
  'kling-2.1-master': 'kling-2.1',
  'pika-2.1-turbo': 'pika-2.1',
  'haiper-2.5': 'haiper-2.0', // Version mapping
  'hailuo-t2v-01-director': 'hailuo-t2v-01',

  // Image models
  'midjourney-v7': 'midjourney-7',
  'midjourney-v6.1': 'midjourney-6.1',
  'ideogram-3.0': 'ideogram-3',
  'ideogram-v2': 'ideogram-2.0',
  'qwen-image-2512': 'qwen-image',
  'hunyuan-image-3.0': 'hunyuan-image',

  // Audio models - no legacy mappings needed yet
};

/**
 * Resolve a model ID to its canonical form
 * Handles legacy IDs and aliases
 */
export function resolveModelId(modelId: string): string {
  // Check legacy mappings first
  if (LEGACY_ID_MAPPINGS[modelId]) {
    return LEGACY_ID_MAPPINGS[modelId];
  }

  // Check if the model exists directly
  const model = getGenerationModelById(modelId);
  if (model) {
    return modelId;
  }

  // Check aliases in all models
  const allModels = getModelsByType('video')
    .concat(getModelsByType('image'))
    .concat(getModelsByType('audio'))
    .concat(getModelsByType('icon'));

  for (const m of allModels) {
    if ((m as any).aliases?.includes(modelId)) {
      return m.id;
    }
  }

  // Return as-is if not found (will fail validation)
  return modelId;
}

/**
 * Validate a model ID exists and is of the expected type
 */
export function validateModelId(modelId: string, expectedType?: GenerationType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Resolve to canonical ID
  const resolvedId = resolveModelId(modelId);
  if (resolvedId !== modelId) {
    warnings.push(`Using legacy model ID '${modelId}', resolved to '${resolvedId}'`);
  }

  const model = getGenerationModelById(resolvedId);

  if (!model) {
    errors.push(`Unknown model ID: ${modelId}`);
    return { valid: false, errors, warnings };
  }

  if (expectedType && model.type !== expectedType) {
    errors.push(`Model '${modelId}' is type '${model.type}', expected '${expectedType}'`);
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors, warnings };
}

/**
 * Get the provider for a model ID
 */
export function getProviderForModel(modelId: string): string | null {
  const resolvedId = resolveModelId(modelId);
  const model = getGenerationModelById(resolvedId);
  return model?.provider ?? null;
}

/**
 * Get the provider type (cloud/local) for a model ID
 */
export function getProviderTypeForModel(modelId: string): 'cloud' | 'local' | null {
  const resolvedId = resolveModelId(modelId);
  const model = getGenerationModelById(resolvedId);
  return model?.providerType ?? null;
}

/**
 * Validate parameters against a model's parameter definitions
 */
export function validateModelParameters(
  modelId: string,
  params: Record<string, any>,
): ParameterValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validatedParams: Record<string, any> = {};

  const resolvedId = resolveModelId(modelId);
  const model = getGenerationModelById(resolvedId);

  if (!model) {
    return {
      valid: false,
      errors: [`Unknown model ID: ${modelId}`],
      warnings,
      validatedParams: params,
    };
  }

  const paramDefs = model.parameters;

  // Check required parameters
  for (const [key, def] of Object.entries(paramDefs)) {
    if (def.required && (params[key] === undefined || params[key] === null || params[key] === '')) {
      errors.push(`Required parameter '${key}' (${def.label}) is missing`);
    }
  }

  // Validate and transform each provided parameter
  for (const [key, value] of Object.entries(params)) {
    const def = paramDefs[key];

    if (!def) {
      // Unknown parameter - warn but include it
      warnings.push(`Unknown parameter '${key}' for model '${model.name}'`);
      validatedParams[key] = value;
      continue;
    }

    const validationResult = validateParameter(key, value, def);
    if (validationResult.error) {
      errors.push(validationResult.error);
    }
    if (validationResult.warning) {
      warnings.push(validationResult.warning);
    }
    validatedParams[key] = validationResult.value;
  }

  // Add defaults for missing optional parameters
  for (const [key, def] of Object.entries(paramDefs)) {
    if (validatedParams[key] === undefined && def.default !== undefined) {
      validatedParams[key] = def.default;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedParams,
  };
}

/**
 * Validate a single parameter value against its definition
 */
function validateParameter(
  key: string,
  value: any,
  def: ParameterDefinition,
): { value: any; error?: string; warning?: string } {
  switch (def.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { value: String(value), warning: `Parameter '${key}' converted to string` };
      }
      return { value };

    case 'number':
    case 'slider':
      const num = typeof value === 'number' ? value : Number(value);
      if (isNaN(num)) {
        return { value: def.default, error: `Parameter '${key}' must be a number` };
      }
      if (def.min !== undefined && num < def.min) {
        return { value: def.min, warning: `Parameter '${key}' clamped to minimum ${def.min}` };
      }
      if (def.max !== undefined && num > def.max) {
        return { value: def.max, warning: `Parameter '${key}' clamped to maximum ${def.max}` };
      }
      return { value: num };

    case 'boolean':
      if (typeof value === 'boolean') {
        return { value };
      }
      if (value === 'true' || value === '1') {
        return { value: true };
      }
      if (value === 'false' || value === '0') {
        return { value: false };
      }
      return { value: Boolean(value), warning: `Parameter '${key}' converted to boolean` };

    case 'select':
      if (!def.options) {
        return { value };
      }
      const validValues = def.options.map((o) => o.value);
      if (!validValues.includes(String(value))) {
        return {
          value: def.default ?? validValues[0],
          error: `Invalid value '${value}' for '${key}'. Valid options: ${validValues.join(', ')}`,
        };
      }
      return { value: String(value) };

    case 'image':
      // Accept base64 data URLs or URLs
      if (value && typeof value === 'string') {
        if (value.startsWith('data:image/') || value.startsWith('http')) {
          return { value };
        }
      }
      if (value === undefined || value === null) {
        return { value: undefined };
      }
      return {
        value: undefined,
        error: `Parameter '${key}' must be an image URL or base64 data URL`,
      };

    case 'images':
      if (!Array.isArray(value)) {
        if (value === undefined || value === null) {
          return { value: [] };
        }
        return { value: [], error: `Parameter '${key}' must be an array of images` };
      }
      if (def.maxItems && value.length > def.maxItems) {
        return {
          value: value.slice(0, def.maxItems),
          warning: `Parameter '${key}' truncated to ${def.maxItems} items`,
        };
      }
      return { value };

    default:
      return { value };
  }
}

/**
 * Get the complete model definition with resolved ID
 */
export function getResolvedModel(modelId: string): GenerationModel | undefined {
  const resolvedId = resolveModelId(modelId);
  return getGenerationModelById(resolvedId);
}

/**
 * Check if a model supports a specific capability
 */
export function modelSupportsCapability(
  modelId: string,
  capability: keyof GenerationModel['capabilities'],
): boolean {
  const model = getResolvedModel(modelId);
  return model?.capabilities?.[capability] ?? false;
}

/**
 * Get all models for a specific provider
 */
export function getModelsForProvider(provider: string): GenerationModel[] {
  const allModels = getModelsByType('video')
    .concat(getModelsByType('image'))
    .concat(getModelsByType('audio'))
    .concat(getModelsByType('icon'));

  return allModels.filter((m) => m.provider === provider);
}
