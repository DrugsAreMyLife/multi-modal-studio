/**
 * ComfyUI Autonomous Workflow Generator
 *
 * Uses LLM to intelligently convert natural language prompts into ComfyUI workflows.
 * Handles template selection, parameter extraction, and workflow customization.
 */

import { generateText } from 'ai';
import { createUniversalModel } from '@/lib/models/universal-model-factory';
import { COMFYUI_TEMPLATES, customizeTemplate, getTemplateById } from './templates';
import type { ComfyUIWorkflow, WorkflowTemplate } from './types';

/**
 * Prompt analysis result
 */
interface PromptAnalysis {
  intent: 'txt2img' | 'img2img' | 'upscale' | 'inpaint' | 'lora' | 'custom';
  parameters: Record<string, unknown>;
  confidence: number;
  reasoning: string;
}

/**
 * Workflow generation result
 */
export interface WorkflowGenerationResult {
  workflow: ComfyUIWorkflow;
  confidence: number;
  explanation: string;
  template_used?: string;
}

/**
 * System prompt for the LLM workflow generator
 */
const SYSTEM_PROMPT = `You are an expert ComfyUI workflow generator. Your job is to convert natural language descriptions into valid ComfyUI workflow JSON.

## ComfyUI Workflow Structure

A ComfyUI workflow is a JSON object where:
- Keys are node IDs (strings like "1", "2", "3")
- Values are node definitions with structure:
  {
    "class_type": "NodeType",
    "inputs": { ... }
  }

## Node Connection Format

To reference another node's output: ["nodeId", slotIndex]
Example: ["1", 0] means output slot 0 of node 1

## Available Workflow Templates

1. **txt2img-basic**: Text-to-Image
   - Best for: "Create an image of...", "Generate a picture of..."
   - Key parameters: prompt, negative_prompt, width, height, steps, cfg, seed
   - Node flow: CheckpointLoader → CLIPTextEncode (positive/negative) → EmptyLatentImage → KSampler → VAEDecode → SaveImage

2. **img2img**: Image-to-Image
   - Best for: "Transform this image...", "Make this look like...", "Apply style to..."
   - Key parameters: image_path, prompt, denoise_strength, steps, cfg, seed
   - Node flow: LoadImage → VAEEncode → KSampler → VAEDecode → SaveImage

3. **inpaint**: Inpainting
   - Best for: "Remove...", "Replace this part...", "Fill in...", "Inpaint the mask"
   - Key parameters: image_path, mask_path, prompt, steps, cfg, seed
   - Node flow: LoadImage + LoadImageMask → VAEEncode → KSampler (with mask) → VAEDecode → SaveImage

4. **upscale**: Upscaling
   - Best for: "Upscale this...", "Make this 4K...", "Enhance resolution..."
   - Key parameters: image_path, upscale_model, scale_factor
   - Node flow: LoadImage → UpscaleModelLoader → ImageUpscaleWithModel → SaveImage

5. **lora-generation**: Text-to-Image with LoRA
   - Best for: "Generate with my style...", "Create using trained model...", "Apply anime/photo style..."
   - Key parameters: prompt, lora_name, lora_strength, width, height, steps, cfg, seed
   - Node flow: CheckpointLoader → LoraLoader → CLIPTextEncode (positive/negative) → KSampler → VAEDecode → SaveImage

## Parameter Extraction Guidelines

- **prompt**: Extract the main generation request. Be specific and descriptive.
- **negative_prompt**: Extract what to avoid. Look for "no...", "without...", "avoid..."
- **width/height**: Look for dimension hints (e.g., "square", "landscape", "portrait", "512", "768")
- **steps**: Quality parameter (20-30 typical, 50+ for high quality). Look for "detailed", "high quality"
- **cfg**: Guidance strength (7.5 typical, higher = more prompt adherence). Look for "strict", "loose"
- **seed**: Reproducibility (-1 for random, or specific numbers)
- **denoise_strength** (img2img): How much to change (0.0-1.0). Look for "subtle", "dramatic", "completely transform"
- **lora_name**: Exact filename of LoRA model (must exist in ComfyUI models/loras)
- **lora_strength**: How strongly to apply LoRA style (0.5-2.0 typical)

## Few-Shot Examples

### Example 1: Simple Text-to-Image
User: "Create a beautiful landscape image with mountains and a sunset"
- Intent: txt2img
- Template: txt2img-basic
- Parameters:
  - prompt: "beautiful landscape with mountains and sunset, vibrant colors, dramatic lighting"
  - negative_prompt: "blurry, low quality, ugly"
  - width: 768
  - height: 512 (landscape)
  - steps: 25
  - cfg: 7.5
  - seed: -1
- Confidence: 0.95

### Example 2: Style Transfer
User: "Make this photo look like an oil painting"
- Intent: img2img
- Template: img2img
- Parameters:
  - image_path: "input.png"
  - prompt: "oil painting style, artistic, detailed brushstrokes, masterpiece"
  - negative_prompt: "photograph, realistic, 3d"
  - denoise_strength: 0.7
  - steps: 25
  - cfg: 8.0
  - seed: -1
- Confidence: 0.9

### Example 3: Upscaling
User: "Upscale this image to 4K"
- Intent: upscale
- Template: upscale
- Parameters:
  - image_path: "photo.jpg"
  - upscale_model: "RealESRGAN_x4plus.pth"
  - scale_factor: 4
- Confidence: 0.95

### Example 4: Inpainting
User: "Remove the background from this image"
- Intent: inpaint
- Template: inpaint
- Parameters:
  - image_path: "photo.jpg"
  - mask_path: "mask.png"
  - prompt: "white background, clean, minimal"
  - negative_prompt: "objects, blur"
  - steps: 20
  - cfg: 7.5
  - seed: -1
- Confidence: 0.85

### Example 5: LoRA Generation
User: "Generate an anime character using my trained anime style model"
- Intent: lora
- Template: lora-generation
- Parameters:
  - prompt: "anime character, beautiful, detailed eyes, vibrant colors"
  - lora_name: "anime_style.safetensors"
  - lora_strength: 1.2
  - width: 512
  - height: 768 (portrait)
  - steps: 30
  - cfg: 8.5
  - seed: -1
- Confidence: 0.9

## Response Format

Return a JSON object with this exact structure:
{
  "intent": "txt2img" | "img2img" | "upscale" | "inpaint" | "lora" | "custom",
  "template_id": "txt2img-basic" | "img2img" | "upscale" | "inpaint" | "lora-generation",
  "parameters": { ... },
  "confidence": 0.0-1.0,
  "reasoning": "explanation of intent detection and parameter choices"
}

## Confidence Scoring

- 0.9-1.0: Clear intent with all required parameters extractable
- 0.7-0.9: Good intent match, some parameters may use defaults
- 0.4-0.7: Unclear intent, best guess, may need clarification
- 0.0-0.4: Very unclear, defaulting to txt2img with warning

## Important Rules

1. Always return valid JSON
2. Never invent non-existent LoRA or checkpoint names
3. For unclear prompts, default to txt2img with lower confidence
4. Validate that all required parameters are present or can be defaulted
5. Ensure numerical parameters are within valid ranges
6. Keep prompts concise but descriptive (50-150 characters ideal)`;

/**
 * Few-shot examples in the system prompt context
 */
const EXAMPLES_FOR_CONTEXT = `## Reference Examples

Example 1 - Simple generation:
Input: "Draw a cat sitting on a chair"
Output: {
  "intent": "txt2img",
  "template_id": "txt2img-basic",
  "parameters": {
    "prompt": "cute cat sitting on chair, detailed, photorealistic",
    "negative_prompt": "blurry, ugly, low quality",
    "width": 512,
    "height": 512,
    "steps": 25,
    "cfg": 7.5,
    "seed": -1
  },
  "confidence": 0.95,
  "reasoning": "Clear text-to-image request with simple subject. Default to balanced dimensions and standard parameters."
}

Example 2 - Style transformation:
Input: "Make my selfie look like a Renaissance painting"
Output: {
  "intent": "img2img",
  "template_id": "img2img",
  "parameters": {
    "image_path": "selfie.jpg",
    "prompt": "Renaissance painting style, oil paint, classical art, masterpiece, detailed",
    "negative_prompt": "modern, photograph, realistic, 3d render",
    "denoise_strength": 0.8,
    "steps": 30,
    "cfg": 8.5,
    "seed": -1
  },
  "confidence": 0.9,
  "reasoning": "Image transformation request with strong style change. Higher denoise strength and cfg for dramatic style transfer."
}

Example 3 - Upscaling:
Input: "I need this small photo at 4K resolution"
Output: {
  "intent": "upscale",
  "template_id": "upscale",
  "parameters": {
    "image_path": "photo.jpg",
    "upscale_model": "RealESRGAN_x4plus.pth",
    "scale_factor": 4
  },
  "confidence": 0.98,
  "reasoning": "Direct upscaling request. Standard 4x upscale with ESRGAN model."
}`;

/**
 * Analyzes a user prompt to determine workflow intent and extract parameters
 */
async function analyzePrompt(userPrompt: string): Promise<PromptAnalysis> {
  if (!userPrompt || userPrompt.trim().length === 0) {
    return {
      intent: 'txt2img',
      parameters: {
        prompt: 'a beautiful image',
        negative_prompt: 'blurry, low quality',
        width: 512,
        height: 512,
        steps: 20,
        cfg: 7.5,
        seed: -1,
      },
      confidence: 0.2,
      reasoning: 'Empty prompt. Defaulting to basic txt2img with minimal parameters.',
    };
  }

  try {
    const { text } = await generateText({
      model: createUniversalModel('openai', 'gpt-4o-mini'),
      system: SYSTEM_PROMPT + '\n\n' + EXAMPLES_FOR_CONTEXT,
      prompt: `Analyze this user request and determine the workflow template and parameters needed:

User Request: "${userPrompt}"

Respond with ONLY valid JSON, no markdown, no explanation before or after.`,
      temperature: 0.5,
    });

    const analysis = JSON.parse(text) as PromptAnalysis;
    return {
      ...analysis,
      reasoning: analysis.reasoning || 'Parameter extraction complete',
    };
  } catch (error) {
    console.error('[WorkflowGenerator] Prompt analysis failed:', error);

    // Fallback to simple intent detection
    const lowerPrompt = userPrompt.toLowerCase();
    let intent: 'txt2img' | 'img2img' | 'upscale' | 'inpaint' | 'lora' | 'custom' = 'txt2img';
    let confidence = 0.4;

    if (
      lowerPrompt.includes('upscale') ||
      lowerPrompt.includes('enlarge') ||
      lowerPrompt.includes('4k')
    ) {
      intent = 'upscale';
      confidence = 0.6;
    } else if (
      lowerPrompt.includes('remove') ||
      lowerPrompt.includes('inpaint') ||
      lowerPrompt.includes('mask') ||
      lowerPrompt.includes('replace')
    ) {
      intent = 'inpaint';
      confidence = 0.5;
    } else if (
      lowerPrompt.includes('style') ||
      lowerPrompt.includes('transform') ||
      lowerPrompt.includes('like') ||
      lowerPrompt.includes('apply')
    ) {
      intent = 'img2img';
      confidence = 0.6;
    } else if (
      lowerPrompt.includes('lora') ||
      lowerPrompt.includes('trained') ||
      lowerPrompt.includes('my model')
    ) {
      intent = 'lora';
      confidence = 0.7;
    }

    return {
      intent,
      parameters: {
        prompt: userPrompt,
        negative_prompt: 'blurry, low quality',
        width: 512,
        height: 512,
        steps: 20,
        cfg: 7.5,
        seed: -1,
      },
      confidence,
      reasoning: `Fallback analysis due to LLM error. Best guess: ${intent}`,
    };
  }
}

/**
 * Selects appropriate template based on intent and confidence
 */
function selectTemplate(analysis: PromptAnalysis): WorkflowTemplate | null {
  // Map intent to template ID
  const intentToTemplateId: Record<string, string> = {
    txt2img: 'txt2img-basic',
    img2img: 'img2img',
    inpaint: 'inpaint',
    upscale: 'upscale',
    lora: 'lora-generation',
    custom: 'txt2img-basic', // Fallback for custom
  };

  const templateId = intentToTemplateId[analysis.intent];
  const template = getTemplateById(templateId);

  if (!template) {
    console.warn(`[WorkflowGenerator] Template not found: ${templateId}`);
    return getTemplateById('txt2img-basic') || null;
  }

  return template;
}

/**
 * Validates and normalizes LLM output to ensure it's a valid workflow
 */
function validateLLMOutput(output: unknown): ComfyUIWorkflow | null {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return null;
  }

  const workflow = output as Record<string, unknown>;

  // Check if it looks like a ComfyUI workflow
  for (const [nodeId, node] of Object.entries(workflow)) {
    if (typeof node !== 'object' || !node || Array.isArray(node)) {
      return null;
    }

    const nodeObj = node as Record<string, unknown>;
    if (!nodeObj.class_type || typeof nodeObj.class_type !== 'string') {
      return null;
    }

    if (!nodeObj.inputs || typeof nodeObj.inputs !== 'object') {
      return null;
    }
  }

  return workflow as ComfyUIWorkflow;
}

/**
 * Generates a ComfyUI workflow from a natural language prompt
 *
 * This is the main function that orchestrates the workflow generation process:
 * 1. Analyzes the user prompt to determine intent and extract parameters
 * 2. Selects the appropriate template based on the analysis
 * 3. Customizes the template with extracted parameters
 * 4. Validates the resulting workflow
 * 5. Returns the workflow with confidence score and explanation
 *
 * @param userPrompt - Natural language description of desired workflow
 * @param mode - 'autonomous' for automatic generation, 'assisted' for clarification (currently unused)
 * @returns Generated workflow with confidence score and explanation
 *
 * @example
 * const result = await generateWorkflowFromPrompt(
 *   "Create a beautiful landscape image",
 *   "autonomous"
 * );
 *
 * if (result.confidence > 0.7) {
 *   // Use the workflow with confidence
 *   executeWorkflow(result.workflow);
 * } else {
 *   // Ask user for clarification
 *   console.log(result.explanation);
 * }
 */
export async function generateWorkflowFromPrompt(
  userPrompt: string,
  mode: 'autonomous' | 'assisted' = 'autonomous',
): Promise<WorkflowGenerationResult> {
  try {
    // Step 1: Analyze prompt
    const analysis = await analyzePrompt(userPrompt);

    // Step 2: Select template
    const template = selectTemplate(analysis);
    if (!template) {
      return {
        workflow: {},
        confidence: 0,
        explanation: 'Failed to select appropriate template. No templates available.',
        template_used: undefined,
      };
    }

    // Step 3: Customize template with extracted parameters
    const customizationResult = customizeTemplate(template, analysis.parameters);

    if (!customizationResult.success || !customizationResult.workflow) {
      // If customization fails, try with defaults
      const defaultParams: Record<string, unknown> = {
        prompt: userPrompt,
        negative_prompt: 'blurry, low quality, ugly',
        width: 512,
        height: 512,
        steps: 20,
        cfg: 7.5,
        seed: -1,
        denoise_strength: 0.75,
        image_path: 'input.png',
        mask_path: 'mask.png',
        upscale_model: 'RealESRGAN_x4plus.pth',
        scale_factor: 4,
        checkpoint: 'sd_xl_base_1.0.safetensors',
        lora_name: 'model.safetensors',
        lora_strength: 1.0,
      };

      const retryResult = customizeTemplate(template, {
        ...defaultParams,
        ...analysis.parameters,
      });

      if (!retryResult.success || !retryResult.workflow) {
        return {
          workflow: {},
          confidence: Math.max(0, analysis.confidence - 0.3),
          explanation: `Template customization failed: ${customizationResult.error}. Using fallback parameters.`,
          template_used: template.id,
        };
      }

      customizationResult.workflow = retryResult.workflow;
    }

    // Step 4: Validate workflow
    const workflow = validateLLMOutput(customizationResult.workflow);
    if (!workflow) {
      return {
        workflow: customizationResult.workflow || {},
        confidence: Math.max(0, analysis.confidence - 0.2),
        explanation: 'Generated workflow may not be valid. Verify before execution.',
        template_used: template.id,
      };
    }

    // Step 5: Generate explanation
    const explanation = `Generated ${template.name} workflow from your request. ${analysis.reasoning} Confidence: ${(analysis.confidence * 100).toFixed(0)}%`;

    return {
      workflow,
      confidence: analysis.confidence,
      explanation,
      template_used: template.id,
    };
  } catch (error) {
    console.error('[WorkflowGenerator] Workflow generation failed:', error);

    // Ultimate fallback: return empty workflow
    return {
      workflow: {},
      confidence: 0,
      explanation: `Workflow generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      template_used: undefined,
    };
  }
}

/**
 * Generates multiple workflow variations for the same prompt
 * Useful for exploring different interpretations of ambiguous requests
 *
 * @param userPrompt - Natural language description
 * @param count - Number of variations to generate (1-5, default 3)
 * @returns Array of workflow generation results
 */
export async function generateWorkflowVariations(
  userPrompt: string,
  count: number = 3,
): Promise<WorkflowGenerationResult[]> {
  const variations: WorkflowGenerationResult[] = [];

  // Generate multiple workflows with temperature variation
  for (let i = 0; i < Math.min(Math.max(count, 1), 5); i++) {
    try {
      const result = await generateWorkflowFromPrompt(userPrompt, 'autonomous');
      variations.push(result);

      // Add slight delay between variations to avoid rate limiting
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`[WorkflowGenerator] Failed to generate variation ${i + 1}:`, error);
    }
  }

  return variations.length > 0
    ? variations
    : [await generateWorkflowFromPrompt(userPrompt, 'autonomous')];
}

/**
 * Lists all available workflow templates for user reference
 */
export function listAvailableTemplates() {
  return COMFYUI_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    parameters: template.parameters.map((p) => ({
      name: p.name,
      type: p.type,
      required: p.required,
      default: p.default,
    })),
  }));
}

/**
 * Gets detailed information about a specific template
 */
export function getTemplateInfo(templateId: string) {
  const template = getTemplateById(templateId);
  if (!template) {
    return null;
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    parameters: template.parameters,
    nodeCount: Object.keys(template.workflow).length,
    tags: template.tags || [],
  };
}
