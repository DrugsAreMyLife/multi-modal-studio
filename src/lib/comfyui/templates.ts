/**
 * ComfyUI Workflow Templates
 * Pre-built templates for common image generation use cases
 */

import type {
  ComfyUIWorkflow,
  WorkflowTemplate,
  TemplateParameter,
  TemplateCustomizationResult,
} from './types';

/**
 * Basic Text-to-Image Template
 * Uses Stable Diffusion for simple prompt-based generation
 */
export const txt2imgBasicTemplate: WorkflowTemplate = {
  id: 'txt2img-basic',
  name: 'Text-to-Image (Basic)',
  description: 'Simple text-to-image generation with Stable Diffusion',
  category: 'general',
  parameters: [
    {
      name: 'prompt',
      description: 'Main generation prompt',
      type: 'string',
      required: true,
    },
    {
      name: 'negative_prompt',
      description: 'Negative prompt to exclude from generation',
      type: 'string',
      required: false,
      default: '',
    },
    {
      name: 'width',
      description: 'Image width in pixels',
      type: 'number',
      required: false,
      default: 512,
      min: 64,
      max: 2048,
    },
    {
      name: 'height',
      description: 'Image height in pixels',
      type: 'number',
      required: false,
      default: 512,
      min: 64,
      max: 2048,
    },
    {
      name: 'steps',
      description: 'Number of sampling steps',
      type: 'number',
      required: false,
      default: 20,
      min: 1,
      max: 100,
    },
    {
      name: 'cfg',
      description: 'Classifier-free guidance scale',
      type: 'number',
      required: false,
      default: 7.5,
      min: 0.1,
      max: 30,
    },
    {
      name: 'seed',
      description: 'Random seed for reproducibility',
      type: 'number',
      required: false,
      default: -1,
    },
  ],
  workflow: {
    '1': {
      inputs: {
        ckpt_name: 'sd_xl_base_1.0.safetensors',
      },
      class_type: 'CheckpointLoaderSimple',
      _meta: {
        title: 'Load Checkpoint',
      },
    },
    '2': {
      inputs: {
        text: '{{prompt}}',
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Positive)',
      },
    },
    '3': {
      inputs: {
        text: '{{negative_prompt}}',
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Negative)',
      },
    },
    '4': {
      inputs: {
        width: '{{width}}',
        height: '{{height}}',
        batch_size: 1,
      },
      class_type: 'EmptyLatentImage',
      _meta: {
        title: 'Empty Latent Image',
      },
    },
    '5': {
      inputs: {
        seed: '{{seed}}',
        steps: '{{steps}}',
        cfg: '{{cfg}}',
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler',
      },
    },
    '6': {
      inputs: {
        samples: ['5', 0],
        vae: ['1', 2],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '7': {
      inputs: {
        filename_prefix: 'txt2img',
        images: ['6', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
  },
};

/**
 * Image-to-Image Template
 * Transforms an existing image based on a prompt
 */
export const img2imgTemplate: WorkflowTemplate = {
  id: 'img2img',
  name: 'Image-to-Image',
  description: 'Image-to-image transformation',
  category: 'advanced',
  parameters: [
    {
      name: 'image_path',
      description: 'Path to input image',
      type: 'string',
      required: true,
    },
    {
      name: 'prompt',
      description: 'Generation prompt',
      type: 'string',
      required: true,
    },
    {
      name: 'negative_prompt',
      description: 'Negative prompt',
      type: 'string',
      required: false,
      default: '',
    },
    {
      name: 'denoise_strength',
      description: 'Denoising strength (0.0 = keep original, 1.0 = full regeneration)',
      type: 'number',
      required: false,
      default: 0.75,
      min: 0,
      max: 1,
    },
    {
      name: 'steps',
      description: 'Number of sampling steps',
      type: 'number',
      required: false,
      default: 20,
      min: 1,
      max: 100,
    },
    {
      name: 'cfg',
      description: 'Classifier-free guidance scale',
      type: 'number',
      required: false,
      default: 7.5,
      min: 0.1,
      max: 30,
    },
    {
      name: 'seed',
      description: 'Random seed for reproducibility',
      type: 'number',
      required: false,
      default: -1,
    },
  ],
  workflow: {
    '1': {
      inputs: {
        image: '{{image_path}}',
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image',
      },
    },
    '2': {
      inputs: {
        ckpt_name: 'sd_xl_base_1.0.safetensors',
      },
      class_type: 'CheckpointLoaderSimple',
      _meta: {
        title: 'Load Checkpoint',
      },
    },
    '3': {
      inputs: {
        text: '{{prompt}}',
        clip: ['2', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Positive)',
      },
    },
    '4': {
      inputs: {
        text: '{{negative_prompt}}',
        clip: ['2', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Negative)',
      },
    },
    '5': {
      inputs: {
        pixels: ['1', 0],
        vae: ['2', 2],
      },
      class_type: 'VAEEncode',
      _meta: {
        title: 'VAE Encode',
      },
    },
    '6': {
      inputs: {
        seed: '{{seed}}',
        steps: '{{steps}}',
        cfg: '{{cfg}}',
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: '{{denoise_strength}}',
        model: ['2', 0],
        positive: ['3', 0],
        negative: ['4', 0],
        latent_image: ['5', 0],
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler',
      },
    },
    '7': {
      inputs: {
        samples: ['6', 0],
        vae: ['2', 2],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '8': {
      inputs: {
        filename_prefix: 'img2img',
        images: ['7', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
  },
};

/**
 * Inpainting Template
 * Inpaints a region of an image based on a mask and prompt
 */
export const inpaintTemplate: WorkflowTemplate = {
  id: 'inpaint',
  name: 'Inpainting',
  description: 'Inpainting with mask support',
  category: 'advanced',
  parameters: [
    {
      name: 'image_path',
      description: 'Path to input image',
      type: 'string',
      required: true,
    },
    {
      name: 'mask_path',
      description: 'Path to mask image (white areas are inpainted)',
      type: 'string',
      required: true,
    },
    {
      name: 'prompt',
      description: 'Inpainting prompt',
      type: 'string',
      required: true,
    },
    {
      name: 'negative_prompt',
      description: 'Negative prompt',
      type: 'string',
      required: false,
      default: '',
    },
    {
      name: 'steps',
      description: 'Number of sampling steps',
      type: 'number',
      required: false,
      default: 20,
      min: 1,
      max: 100,
    },
    {
      name: 'cfg',
      description: 'Classifier-free guidance scale',
      type: 'number',
      required: false,
      default: 7.5,
      min: 0.1,
      max: 30,
    },
    {
      name: 'seed',
      description: 'Random seed for reproducibility',
      type: 'number',
      required: false,
      default: -1,
    },
  ],
  workflow: {
    '1': {
      inputs: {
        image: '{{image_path}}',
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image',
      },
    },
    '2': {
      inputs: {
        image: '{{mask_path}}',
      },
      class_type: 'LoadImageMask',
      _meta: {
        title: 'Load Image (Mask)',
      },
    },
    '3': {
      inputs: {
        ckpt_name: 'sd_xl_base_1.0.safetensors',
      },
      class_type: 'CheckpointLoaderSimple',
      _meta: {
        title: 'Load Checkpoint',
      },
    },
    '4': {
      inputs: {
        text: '{{prompt}}',
        clip: ['3', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Positive)',
      },
    },
    '5': {
      inputs: {
        text: '{{negative_prompt}}',
        clip: ['3', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Negative)',
      },
    },
    '6': {
      inputs: {
        pixels: ['1', 0],
        vae: ['3', 2],
      },
      class_type: 'VAEEncode',
      _meta: {
        title: 'VAE Encode',
      },
    },
    '7': {
      inputs: {
        seed: '{{seed}}',
        steps: '{{steps}}',
        cfg: '{{cfg}}',
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
        model: ['3', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['6', 0],
        mask: ['2', 0],
        use_inpaint_model: true,
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler (Inpaint)',
      },
    },
    '8': {
      inputs: {
        samples: ['7', 0],
        vae: ['3', 2],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '9': {
      inputs: {
        filename_prefix: 'inpaint',
        images: ['8', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
  },
};

/**
 * Upscaling Template
 * Upscales images using ESRGAN models
 */
export const upscaleTemplate: WorkflowTemplate = {
  id: 'upscale',
  name: 'Upscaling (ESRGAN)',
  description: '4x upscaling with ESRGAN',
  category: 'image',
  parameters: [
    {
      name: 'image_path',
      description: 'Path to image to upscale',
      type: 'string',
      required: true,
    },
    {
      name: 'upscale_model',
      description: 'Upscaling model name',
      type: 'string',
      required: false,
      default: 'RealESRGAN_x4plus.pth',
    },
    {
      name: 'scale_factor',
      description: 'Upscaling factor',
      type: 'number',
      required: false,
      default: 4,
      min: 2,
      max: 8,
    },
  ],
  workflow: {
    '1': {
      inputs: {
        image: '{{image_path}}',
      },
      class_type: 'LoadImage',
      _meta: {
        title: 'Load Image',
      },
    },
    '2': {
      inputs: {
        upscale_model: '{{upscale_model}}',
      },
      class_type: 'UpscaleModelLoader',
      _meta: {
        title: 'Load Upscale Model',
      },
    },
    '3': {
      inputs: {
        upscale_model: ['2', 0],
        image: ['1', 0],
      },
      class_type: 'ImageUpscaleWithModel',
      _meta: {
        title: 'Upscale Image with Model',
      },
    },
    '4': {
      inputs: {
        filename_prefix: 'upscaled',
        images: ['3', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
  },
};

/**
 * LoRA Generation Template
 * Text-to-image generation using LoRA models for style control
 */
export const loraGenerationTemplate: WorkflowTemplate = {
  id: 'lora-generation',
  name: 'Text-to-Image (LoRA)',
  description: 'Text-to-image with LoRA model',
  category: 'custom',
  parameters: [
    {
      name: 'checkpoint',
      description: 'Base model checkpoint',
      type: 'string',
      required: false,
      default: 'sd_xl_base_1.0.safetensors',
    },
    {
      name: 'lora_name',
      description: 'LoRA model filename',
      type: 'string',
      required: true,
    },
    {
      name: 'lora_strength',
      description: 'LoRA influence strength',
      type: 'number',
      required: false,
      default: 1.0,
      min: 0,
      max: 2,
    },
    {
      name: 'prompt',
      description: 'Generation prompt',
      type: 'string',
      required: true,
    },
    {
      name: 'negative_prompt',
      description: 'Negative prompt',
      type: 'string',
      required: false,
      default: '',
    },
    {
      name: 'width',
      description: 'Image width in pixels',
      type: 'number',
      required: false,
      default: 512,
      min: 64,
      max: 2048,
    },
    {
      name: 'height',
      description: 'Image height in pixels',
      type: 'number',
      required: false,
      default: 512,
      min: 64,
      max: 2048,
    },
    {
      name: 'steps',
      description: 'Number of sampling steps',
      type: 'number',
      required: false,
      default: 20,
      min: 1,
      max: 100,
    },
    {
      name: 'cfg',
      description: 'Classifier-free guidance scale',
      type: 'number',
      required: false,
      default: 7.5,
      min: 0.1,
      max: 30,
    },
    {
      name: 'seed',
      description: 'Random seed for reproducibility',
      type: 'number',
      required: false,
      default: -1,
    },
  ],
  workflow: {
    '1': {
      inputs: {
        ckpt_name: '{{checkpoint}}',
      },
      class_type: 'CheckpointLoaderSimple',
      _meta: {
        title: 'Load Checkpoint',
      },
    },
    '2': {
      inputs: {
        lora_name: '{{lora_name}}',
        strength_model: '{{lora_strength}}',
        strength_clip: '{{lora_strength}}',
        model: ['1', 0],
        clip: ['1', 1],
      },
      class_type: 'LoraLoader',
      _meta: {
        title: 'Load LoRA',
      },
    },
    '3': {
      inputs: {
        text: '{{prompt}}',
        clip: ['2', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Positive)',
      },
    },
    '4': {
      inputs: {
        text: '{{negative_prompt}}',
        clip: ['2', 1],
      },
      class_type: 'CLIPTextEncode',
      _meta: {
        title: 'CLIP Encode (Negative)',
      },
    },
    '5': {
      inputs: {
        width: '{{width}}',
        height: '{{height}}',
        batch_size: 1,
      },
      class_type: 'EmptyLatentImage',
      _meta: {
        title: 'Empty Latent Image',
      },
    },
    '6': {
      inputs: {
        seed: '{{seed}}',
        steps: '{{steps}}',
        cfg: '{{cfg}}',
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1.0,
        model: ['2', 0],
        positive: ['3', 0],
        negative: ['4', 0],
        latent_image: ['5', 0],
      },
      class_type: 'KSampler',
      _meta: {
        title: 'KSampler',
      },
    },
    '7': {
      inputs: {
        samples: ['6', 0],
        vae: ['2', 2],
      },
      class_type: 'VAEDecode',
      _meta: {
        title: 'VAE Decode',
      },
    },
    '8': {
      inputs: {
        filename_prefix: 'lora_generation',
        images: ['7', 0],
      },
      class_type: 'SaveImage',
      _meta: {
        title: 'Save Image',
      },
    },
  },
};

/**
 * Customizes a template by replacing parameter placeholders with actual values
 *
 * @param template - The template to customize
 * @param parameters - Key-value pairs of parameter values
 * @returns Result object with customized workflow or error details
 *
 * @example
 * const result = customizeTemplate(txt2imgBasicTemplate, {
 *   prompt: 'a beautiful sunset',
 *   negative_prompt: 'blurry',
 *   width: 768,
 *   height: 768,
 *   steps: 30,
 *   cfg: 8,
 *   seed: 42
 * });
 *
 * if (result.success) {
 *   // Use result.workflow
 * } else {
 *   // Handle error
 *   console.error('Missing parameters:', result.missingParameters);
 * }
 */
export function customizeTemplate(
  template: WorkflowTemplate,
  parameters: Record<string, unknown>,
): TemplateCustomizationResult {
  // Validate required parameters
  const missingParameters: string[] = [];

  for (const param of template.parameters) {
    if (param.required && !(param.name in parameters)) {
      missingParameters.push(param.name);
    }
  }

  if (missingParameters.length > 0) {
    return {
      success: false,
      error: `Missing required parameters: ${missingParameters.join(', ')}`,
      missingParameters,
    };
  }

  // Create a deep copy of the workflow
  const workflow = JSON.parse(JSON.stringify(template.workflow)) as ComfyUIWorkflow;

  // Replace placeholders in the workflow
  const workflowString = JSON.stringify(workflow);
  let customizedString = workflowString;

  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `{{${key}}}`;
    // Replace all occurrences of the placeholder
    customizedString = customizedString.split(placeholder).join(String(value));
  }

  try {
    const customizedWorkflow = JSON.parse(customizedString) as ComfyUIWorkflow;

    // Validate that all placeholders were replaced
    const remainingPlaceholders = customizedString.match(/\{\{[^}]+\}\}/g);
    if (remainingPlaceholders && remainingPlaceholders.length > 0) {
      return {
        success: false,
        error: `Unresolved placeholders in workflow: ${remainingPlaceholders.join(', ')}`,
      };
    }

    return {
      success: true,
      workflow: customizedWorkflow,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to customize template: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * All available templates exported as an array for easy iteration
 */
export const COMFYUI_TEMPLATES: WorkflowTemplate[] = [
  txt2imgBasicTemplate,
  img2imgTemplate,
  inpaintTemplate,
  upscaleTemplate,
  loraGenerationTemplate,
];

/**
 * Get a template by ID
 * @param templateId - The template ID to retrieve
 * @returns The template or undefined if not found
 */
export function getTemplateById(templateId: string): WorkflowTemplate | undefined {
  return COMFYUI_TEMPLATES.find((template) => template.id === templateId);
}

/**
 * Get all templates in a specific category
 * @param category - The category to filter by
 * @returns Array of templates in the specified category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return COMFYUI_TEMPLATES.filter((template) => template.category === category);
}
