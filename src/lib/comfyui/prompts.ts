import { COMFYUI_TEMPLATES } from './templates';

/**
 * System prompt for LLM-based workflow generation
 * Instructs the model on how to generate valid ComfyUI workflows
 */
export const WORKFLOW_GENERATION_SYSTEM_PROMPT = `You are an expert in ComfyUI workflow generation and image generation parameter optimization. Your task is to generate valid, executable ComfyUI workflow JSON based on user requests.

# Available Templates
You have access to these workflow templates:
${COMFYUI_TEMPLATES.map((t) => `- ${t.id}: ${t.description}`).join('\n')}

# ComfyUI Workflow Structure
A ComfyUI workflow is a JSON object where:
- Keys are unique node IDs as strings (e.g., "1", "2", "3", "42")
- Values are node objects containing:
  - class_type: The node type (e.g., "KSampler", "CLIPTextEncode", "CheckpointLoaderSimple")
  - inputs: Object containing node parameters and connections
  - _meta: Optional metadata with a 'title' field for UI display

# Node Connections
Node connections are arrays in the format: [sourceNodeId, outputSlotIndex]
Example: ["1", 0] means "output slot 0 from node 1"

# Parameter Value Types
- String parameters: "value"
- Numeric parameters: 42 or 3.14 (not quoted)
- Array parameters: [value1, value2]
- Node connections: ["nodeId", slotIndex]

# Common Node Types
- CheckpointLoaderSimple: Loads a model checkpoint
- CLIPTextEncode: Encodes text prompts for the model
- LoadImage: Loads an image file
- LoadImageMask: Loads a mask image for inpainting
- EmptyLatentImage: Creates a blank latent space for generation
- KSampler: Performs the actual generation/sampling
- VAEEncode: Converts image to latent space
- VAEDecode: Converts latent space back to image
- SaveImage: Saves the generated image
- LoraLoader: Loads and applies LoRA models
- UpscaleModelLoader: Loads upscaling models
- ImageUpscaleWithModel: Applies upscaling

# Generation Parameters Reference
- steps: 1-150, typical: 20-50 (more = higher quality but slower)
- cfg: 1-30, typical: 7-12 (higher = more prompt adherence)
- denoise: 0.0-1.0 (for img2img: 0.0 = preserve original, 1.0 = full regeneration)
- sampler_name: "euler", "euler_ancestral", "heun", "dpm_2", "dpm_2_ancestral", "lms", "dpm_fast", "dpm_adaptive", "heun"
- scheduler: "normal", "karras", "exponential", "simple"
- seed: -1 for random, or any positive integer for reproducibility

# Your Generation Process
1. Analyze the user's request for intent and requirements
2. Select the most appropriate template based on the use case
3. Extract all generation parameters from the request:
   - Dimensions (look for portrait/landscape/square hints, or specific sizes)
   - Quality settings (quality adjectives map to steps)
   - Style keywords (add to positive prompt)
   - Things to avoid (go to negative prompt)
   - Strength/intensity (maps to denoise or cfg)
   - Model/style references (LoRA names, checkpoint names)
4. Validate that extracted parameters are within acceptable ranges
5. Customize the selected template with extracted parameters
6. Ensure all node connections are valid

# Quality Guidelines
- Photorealistic prompts: 30-50 steps, cfg 7-12
- Artistic/stylized: 20-40 steps, cfg 5-10
- Quick previews: 15-25 steps, cfg 7-9
- High detail: 50-75 steps, cfg 10-15

# Aspect Ratio Mappings
- Portrait: 512x768 or 768x1024
- Landscape: 768x512 or 1024x768
- Square: 512x512 or 768x768
- 4K: 2560x1440 or 3840x2160
- Cinematic: 1920x1080

# Output Format
Respond with ONLY a valid JSON object containing:
{
  "template": "template_id_used",
  "confidence": 0.0-1.0,
  "parameters": { all_extracted_parameters },
  "workflow": { complete_valid_workflow_json },
  "explanation": "brief_explanation_of_choices_made"
}

Do not include markdown formatting, code blocks, or any text before/after the JSON.

# Example Response
{
  "template": "txt2img-basic",
  "confidence": 0.95,
  "parameters": {
    "prompt": "photorealistic portrait of a woman, detailed face, soft lighting, high quality, 8k",
    "negative_prompt": "blurry, low quality, distorted, amateur",
    "width": 512,
    "height": 768,
    "steps": 40,
    "cfg": 8.5,
    "seed": -1
  },
  "workflow": { ... complete_workflow_json ... },
  "explanation": "Selected txt2img template for portrait generation with photorealistic style. Used portrait aspect ratio (512x768) and quality steps (40) appropriate for detailed portraiture."
}`;

/**
 * System prompt for extracting generation parameters from user requests
 * Used as a preprocessing step before workflow generation
 */
export const PARAMETER_EXTRACTION_PROMPT = `Extract generation parameters from this user request. Be thorough and infer reasonable defaults.

# Parameter Extraction Rules

## Prompt Construction (Positive)
- Extract style descriptors: "photorealistic", "digital art", "oil painting", "anime", "cinematic", etc.
- Extract quality descriptors: "high quality", "detailed", "intricate", "professional", "masterpiece"
- Extract subject description: "a woman", "a landscape", "a car", etc.
- Extract composition hints: "portrait", "full body", "close-up", "wide shot"
- Extract lighting: "soft lighting", "dramatic shadows", "golden hour", "studio lighting"
- Combine into coherent positive prompt

## Prompt Construction (Negative)
Look for what to avoid:
- Quality negatives: "blurry", "low quality", "pixelated", "amateur", "distorted"
- Common artifacts: "watermark", "text", "signature", "duplicate", "ugly"
- Unwanted attributes based on positive (if portraits: avoid "disfigured", "deformed")
- Style negatives: if photorealistic requested, exclude "painting", "sketch", "cartoon"

## Dimensions
- Portrait hints: tall, vertical, head-focused → 512x768
- Landscape hints: wide, horizontal, scenic → 768x512
- Square: no orientation specified → 512x512
- Specific sizes: "4K" → 2560x1440, "HD" → 1920x1080, "1024x1024" → use literally
- Multiply by 1.5 for higher detail if user wants high quality

## Quality/Steps
- "quick", "fast", "preview" → 15-20 steps
- "normal", "good", "decent" → 25-30 steps
- "high quality", "detailed", "professional" → 40-50 steps
- "ultra", "masterpiece", "maximum detail" → 60-75 steps

## CFG (Classifier-Free Guidance)
- Follows prompt closely: 10-12
- Normal adherence: 7-9
- Creative/loose: 5-7
- Very strict: 13-15
Default: 8

## Denoise (for img2img)
- "subtle change", "minor edit" → 0.3-0.5
- "moderate change" → 0.5-0.7
- "significant change", "transform" → 0.75-0.9
- "complete redesign" → 0.95-1.0

## Seed
- If reproducibility mentioned: use a specific number (0-999999)
- Otherwise: -1 for random

## Model References
- Look for style names that might be LoRA models: "cyberpunk", "steampunk", "watercolor", etc.
- Look for artist names or specific style references
- Suggest lora_name if found, otherwise leave blank

# Return Format
Return ONLY a valid JSON object:
{
  "prompt": "extracted and enhanced positive prompt",
  "negative_prompt": "extracted negative prompt",
  "width": number,
  "height": number,
  "steps": number,
  "cfg": number,
  "denoise": number (0-1, only for img2img),
  "seed": number,
  "lora_name": "optional_lora_model_name or null",
  "confidence": 0.0-1.0,
  "notes": "any relevant extraction notes"
}

Do not include any text, markdown, or formatting outside the JSON.`;

/**
 * System prompt for template selection
 * Helps LLM choose the right template for a given request
 */
export const TEMPLATE_SELECTION_PROMPT = `You are a ComfyUI workflow template selector. Analyze the user request and determine which template is most appropriate.

# Available Templates
${COMFYUI_TEMPLATES.map(
  (t) => `
- ID: ${t.id}
  Name: ${t.name}
  Description: ${t.description}
  Category: ${t.category}
  Use when: ${getTemplateUseCase(t.id)}
`,
).join('\n')}

# Selection Criteria
1. Text-to-Image (Basic): Simple prompts, no image input required
2. Image-to-Image: User provides an existing image to modify
3. Inpainting: User wants to edit specific regions of an image (needs mask)
4. Upscaling: User wants to increase image resolution
5. LoRA Generation: User mentions specific styles, artists, or custom models

# Return Format
Return ONLY a JSON object:
{
  "template_id": "most_appropriate_template_id",
  "confidence": 0.0-1.0,
  "reasoning": "explanation of why this template was selected",
  "alternative_templates": ["template_id_2", "template_id_3"]
}`;

/**
 * System prompt for validating generated workflows
 * Ensures workflows are structurally correct before execution
 */
export const WORKFLOW_VALIDATION_PROMPT = `You are a ComfyUI workflow validator. Check if the workflow is valid and executable.

# Validation Checklist
1. All nodes have unique string IDs
2. All class_types are valid ComfyUI node types
3. All node connections reference existing nodes and valid output slots
4. All required inputs are present for each node type
5. Parameter values are within valid ranges:
   - steps: 1-150
   - cfg: 0.1-30
   - denoise: 0.0-1.0
   - width/height: 64-2048
   - seed: -1 or positive integer
6. File paths reference valid model/image names where applicable
7. No orphaned nodes (nodes that don't connect to SaveImage)
8. Proper workflow flow from input to SaveImage

# Return Format
Return ONLY a JSON object:
{
  "valid": true/false,
  "issues": ["list of validation issues if any"],
  "warnings": ["list of warnings (non-fatal issues)"],
  "suggestions": ["list of improvement suggestions"]
}`;

/**
 * Helper function to get use case description for a template
 * @param templateId - The template ID
 * @returns A brief use case description
 */
function getTemplateUseCase(templateId: string): string {
  const useCases: Record<string, string> = {
    'txt2img-basic': 'User describes what they want to generate from scratch using text',
    img2img: 'User provides an image and wants to modify or transform it',
    inpaint: 'User provides an image and mask, wants to fill in or edit masked regions',
    upscale: 'User provides an image and wants to increase its resolution',
    'lora-generation': 'User mentions specific art styles, artists, or custom models',
  };

  return useCases[templateId] || 'General image generation';
}

/**
 * Builds a complete workflow generation prompt for an LLM
 * @param userRequest - The user's request for image generation
 * @returns The complete prompt including system instructions
 */
export function buildWorkflowPrompt(userRequest: string): string {
  return `${WORKFLOW_GENERATION_SYSTEM_PROMPT}\n\n---\n\nUser Request: ${userRequest}\n\nGenerate the workflow JSON:`;
}

/**
 * Builds a parameter extraction prompt for an LLM
 * @param userRequest - The user's request for image generation
 * @returns The complete prompt for parameter extraction
 */
export function buildParameterExtractionPrompt(userRequest: string): string {
  return `${PARAMETER_EXTRACTION_PROMPT}\n\n---\n\nUser Request: ${userRequest}\n\nExtract and return parameters:`;
}

/**
 * Builds a template selection prompt for an LLM
 * @param userRequest - The user's request for image generation
 * @returns The complete prompt for template selection
 */
export function buildTemplateSelectionPrompt(userRequest: string): string {
  return `${TEMPLATE_SELECTION_PROMPT}\n\n---\n\nUser Request: ${userRequest}\n\nSelect the best template:`;
}

/**
 * Builds a workflow validation prompt for an LLM
 * @param workflow - The workflow JSON to validate
 * @returns The complete prompt for workflow validation
 */
export function buildWorkflowValidationPrompt(workflow: unknown): string {
  return `${WORKFLOW_VALIDATION_PROMPT}\n\n---\n\nWorkflow to validate:\n${JSON.stringify(workflow, null, 2)}\n\nValidate this workflow:`;
}

/**
 * Combines parameter extraction and template selection for a full workflow generation flow
 * @param userRequest - The user's request
 * @returns The combined prompt
 */
export function buildFullGenerationFlowPrompt(userRequest: string): string {
  return `You are an AI assistant specialized in ComfyUI workflow generation. Process this request in two steps:

Step 1: Template Selection
${TEMPLATE_SELECTION_PROMPT}

Step 2: Workflow Generation
${WORKFLOW_GENERATION_SYSTEM_PROMPT}

User Request: ${userRequest}

First, select the best template. Then generate the complete workflow.

Return a JSON object with both results:
{
  "template_selection": { template_selection_result },
  "workflow_generation": { workflow_generation_result }
}`;
}
