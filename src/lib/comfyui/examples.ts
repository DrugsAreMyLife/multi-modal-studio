/**
 * ComfyUI Templates - Usage Examples
 * Demonstrates how to use the pre-built workflow templates
 */

import {
  txt2imgBasicTemplate,
  img2imgTemplate,
  inpaintTemplate,
  upscaleTemplate,
  loraGenerationTemplate,
  customizeTemplate,
  getTemplateById,
  getTemplatesByCategory,
} from './templates';

/**
 * Example 1: Simple text-to-image generation
 */
export function example_simpleTextToImage() {
  const result = customizeTemplate(txt2imgBasicTemplate, {
    prompt: 'A serene mountain landscape at sunset, oil painting style',
    negative_prompt: 'blurry, low quality, distorted',
    width: 768,
    height: 768,
    steps: 30,
    cfg: 7.5,
    seed: 42,
  });

  if (result.success) {
    console.log('Generated workflow ready for execution');
    return result.workflow;
  } else {
    console.error('Error customizing template:', result.error);
    return null;
  }
}

/**
 * Example 2: Image-to-image transformation
 */
export function example_imageToImage() {
  const result = customizeTemplate(img2imgTemplate, {
    image_path: '/path/to/base_image.png',
    prompt: 'transform into cyberpunk neon style',
    negative_prompt: 'oversaturated, too bright',
    denoise_strength: 0.6,
    steps: 25,
    cfg: 8,
    seed: -1, // Random seed
  });

  if (result.success) {
    return result.workflow;
  }
  return null;
}

/**
 * Example 3: Inpainting with mask
 */
export function example_inpainting() {
  const result = customizeTemplate(inpaintTemplate, {
    image_path: '/path/to/image.png',
    mask_path: '/path/to/mask.png',
    prompt: 'a beautiful portrait of a woman',
    negative_prompt: 'ugly, distorted face',
    steps: 28,
    cfg: 7.5,
    seed: 123,
  });

  if (result.success) {
    return result.workflow;
  }
  return null;
}

/**
 * Example 4: Upscaling an image
 */
export function example_upscaling() {
  const result = customizeTemplate(upscaleTemplate, {
    image_path: '/path/to/low_res_image.png',
    upscale_model: 'RealESRGAN_x4plus.pth',
    scale_factor: 4,
  });

  if (result.success) {
    return result.workflow;
  }
  return null;
}

/**
 * Example 5: Text-to-image with LoRA
 */
export function example_loraGeneration() {
  const result = customizeTemplate(loraGenerationTemplate, {
    checkpoint: 'sd_xl_base_1.0.safetensors',
    lora_name: 'my_custom_style.safetensors',
    lora_strength: 0.7,
    prompt: 'a portrait in my custom style, professional photography',
    negative_prompt: 'cartoon, sketch',
    width: 512,
    height: 512,
    steps: 25,
    cfg: 7.5,
    seed: -1,
  });

  if (result.success) {
    return result.workflow;
  }
  return null;
}

/**
 * Example 6: Using utility functions to discover templates
 */
export function example_discoverTemplates() {
  // Find a specific template by ID
  const basicTemplate = getTemplateById('txt2img-basic');
  if (basicTemplate) {
    console.log(`Found template: ${basicTemplate.name}`);
    console.log(`Description: ${basicTemplate.description}`);
    console.log(`Parameters: ${basicTemplate.parameters.map((p) => p.name).join(', ')}`);
  }

  // Get all general templates
  const generalTemplates = getTemplatesByCategory('general');
  console.log(`Found ${generalTemplates.length} general templates`);

  // Get all advanced templates
  const advancedTemplates = getTemplatesByCategory('advanced');
  console.log(`Found ${advancedTemplates.length} advanced templates`);
}

/**
 * Example 7: Error handling with missing parameters
 */
export function example_errorHandling() {
  // This will fail because 'prompt' is required
  const result = customizeTemplate(txt2imgBasicTemplate, {
    // Missing prompt
    width: 512,
  });

  if (!result.success) {
    console.error('Template customization failed:', result.error);
    console.error('Missing parameters:', result.missingParameters);
    return null;
  }

  return result.workflow;
}

/**
 * Example 8: Batch generation with different seeds
 */
export function example_batchGeneration() {
  const prompts = ['A beautiful sunset', 'A peaceful forest', 'A bustling city at night'];

  const workflows = prompts.map((prompt, index) => {
    const result = customizeTemplate(txt2imgBasicTemplate, {
      prompt,
      negative_prompt: 'blurry, low quality',
      width: 512,
      height: 512,
      steps: 20,
      cfg: 7.5,
      seed: index * 1000, // Different seed for each
    });

    return result.success ? result.workflow : null;
  });

  return workflows.filter((w) => w !== null);
}

/**
 * Example 9: Custom seed handling
 */
export function example_randomSeeds() {
  // Generate with random seeds
  const configs = Array.from({ length: 3 }, (_, i) => ({
    prompt: 'A serene landscape',
    negative_prompt: 'blurry',
    seed: Math.floor(Math.random() * 1000000),
  }));

  const workflows = configs.map((config) => {
    const result = customizeTemplate(txt2imgBasicTemplate, config);
    return result.success ? result.workflow : null;
  });

  return workflows.filter((w) => w !== null);
}

/**
 * Example 10: Template inspection
 */
export function example_inspectTemplate() {
  const template = getTemplateById('lora-generation');
  if (!template) return null;

  console.log('Template Details:');
  console.log(`ID: ${template.id}`);
  console.log(`Name: ${template.name}`);
  console.log(`Description: ${template.description}`);
  console.log(`Category: ${template.category}`);
  console.log('\nParameters:');

  template.parameters.forEach((param) => {
    console.log(`  - ${param.name}:`);
    console.log(`    Type: ${param.type}`);
    console.log(`    Required: ${param.required}`);
    if (param.default !== undefined) {
      console.log(`    Default: ${param.default}`);
    }
    if (param.min !== undefined && param.max !== undefined) {
      console.log(`    Range: ${param.min} - ${param.max}`);
    }
  });

  console.log(`\nNumber of nodes in workflow: ${Object.keys(template.workflow).length}`);
  console.log(
    `Node types: ${Object.values(template.workflow)
      .map((n) => n.class_type)
      .join(', ')}`,
  );
}
