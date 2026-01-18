/**
 * Tests for ComfyUI templates
 */

import {
  customizeTemplate,
  txt2imgBasicTemplate,
  img2imgTemplate,
  inpaintTemplate,
  upscaleTemplate,
  loraGenerationTemplate,
  COMFYUI_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
} from './templates';

describe('ComfyUI Templates', () => {
  describe('txt2imgBasicTemplate', () => {
    it('should have correct metadata', () => {
      expect(txt2imgBasicTemplate.id).toBe('txt2img-basic');
      expect(txt2imgBasicTemplate.name).toBe('Text-to-Image (Basic)');
      expect(txt2imgBasicTemplate.category).toBe('general');
      expect(txt2imgBasicTemplate.parameters.length).toBe(7);
    });

    it('should have all required nodes', () => {
      const workflow = txt2imgBasicTemplate.workflow;
      expect(workflow['1']).toBeDefined();
      expect(workflow['1'].class_type).toBe('CheckpointLoaderSimple');
      expect(workflow['2']).toBeDefined();
      expect(workflow['2'].class_type).toBe('CLIPTextEncode');
      expect(workflow['7']).toBeDefined();
      expect(workflow['7'].class_type).toBe('SaveImage');
    });

    it('should have correct parameter defaults', () => {
      const widthParam = txt2imgBasicTemplate.parameters.find((p) => p.name === 'width');
      expect(widthParam?.default).toBe(512);
      expect(widthParam?.min).toBe(64);
      expect(widthParam?.max).toBe(2048);
    });
  });

  describe('img2imgTemplate', () => {
    it('should have correct metadata', () => {
      expect(img2imgTemplate.id).toBe('img2img');
      expect(img2imgTemplate.category).toBe('advanced');
      expect(img2imgTemplate.parameters.length).toBe(7);
    });

    it('should include LoadImage node', () => {
      const workflow = img2imgTemplate.workflow;
      expect(workflow['1'].class_type).toBe('LoadImage');
    });

    it('should include VAEEncode node', () => {
      const workflow = img2imgTemplate.workflow;
      expect(workflow['5'].class_type).toBe('VAEEncode');
    });

    it('should have denoise_strength parameter', () => {
      const denoiseParam = img2imgTemplate.parameters.find((p) => p.name === 'denoise_strength');
      expect(denoiseParam).toBeDefined();
      expect(denoiseParam?.default).toBe(0.75);
      expect(denoiseParam?.min).toBe(0);
      expect(denoiseParam?.max).toBe(1);
    });
  });

  describe('inpaintTemplate', () => {
    it('should have correct metadata', () => {
      expect(inpaintTemplate.id).toBe('inpaint');
      expect(inpaintTemplate.category).toBe('advanced');
    });

    it('should include LoadImageMask node', () => {
      const workflow = inpaintTemplate.workflow;
      expect(workflow['2'].class_type).toBe('LoadImageMask');
    });

    it('should have mask_path parameter', () => {
      const maskParam = inpaintTemplate.parameters.find((p) => p.name === 'mask_path');
      expect(maskParam).toBeDefined();
      expect(maskParam?.required).toBe(true);
    });
  });

  describe('upscaleTemplate', () => {
    it('should have correct metadata', () => {
      expect(upscaleTemplate.id).toBe('upscale');
      expect(upscaleTemplate.category).toBe('image');
      expect(upscaleTemplate.parameters.length).toBe(3);
    });

    it('should have minimal nodes', () => {
      const workflow = upscaleTemplate.workflow;
      expect(Object.keys(workflow).length).toBe(4);
      expect(workflow['2'].class_type).toBe('UpscaleModelLoader');
      expect(workflow['3'].class_type).toBe('ImageUpscaleWithModel');
    });

    it('should have scale_factor parameter', () => {
      const scaleParam = upscaleTemplate.parameters.find((p) => p.name === 'scale_factor');
      expect(scaleParam).toBeDefined();
      expect(scaleParam?.default).toBe(4);
      expect(scaleParam?.min).toBe(2);
      expect(scaleParam?.max).toBe(8);
    });
  });

  describe('loraGenerationTemplate', () => {
    it('should have correct metadata', () => {
      expect(loraGenerationTemplate.id).toBe('lora-generation');
      expect(loraGenerationTemplate.category).toBe('custom');
    });

    it('should include LoraLoader node', () => {
      const workflow = loraGenerationTemplate.workflow;
      expect(workflow['2'].class_type).toBe('LoraLoader');
    });

    it('should have lora_name as required parameter', () => {
      const loraParam = loraGenerationTemplate.parameters.find((p) => p.name === 'lora_name');
      expect(loraParam).toBeDefined();
      expect(loraParam?.required).toBe(true);
    });

    it('should have lora_strength parameter', () => {
      const strengthParam = loraGenerationTemplate.parameters.find(
        (p) => p.name === 'lora_strength',
      );
      expect(strengthParam).toBeDefined();
      expect(strengthParam?.default).toBe(1.0);
      expect(strengthParam?.min).toBe(0);
      expect(strengthParam?.max).toBe(2);
    });
  });

  describe('customizeTemplate', () => {
    it('should replace placeholders in txt2img template', () => {
      const result = customizeTemplate(txt2imgBasicTemplate, {
        prompt: 'a beautiful sunset',
        negative_prompt: 'blurry',
        width: 768,
        height: 768,
        steps: 30,
        cfg: 8,
        seed: 42,
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const clsNode = result.workflow['2'] as any;
        expect(clsNode.inputs.text).toBe('a beautiful sunset');

        const ksampler = result.workflow['5'] as any;
        expect(ksampler.inputs.seed).toBe(42);
        expect(ksampler.inputs.steps).toBe(30);
        expect(ksampler.inputs.cfg).toBe(8);
      }
    });

    it('should detect missing required parameters', () => {
      const result = customizeTemplate(txt2imgBasicTemplate, {
        // Missing prompt (required)
      });

      expect(result.success).toBe(false);
      expect(result.missingParameters).toContain('prompt');
      expect(result.error).toContain('Missing required parameters');
    });

    it('should use default values for optional parameters', () => {
      const result = customizeTemplate(txt2imgBasicTemplate, {
        prompt: 'test',
        // Other parameters use defaults
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const emptyLatent = result.workflow['4'] as any;
        expect(emptyLatent.inputs.width).toBe('512');
        expect(emptyLatent.inputs.height).toBe('512');
      }
    });

    it('should handle img2img template customization', () => {
      const result = customizeTemplate(img2imgTemplate, {
        image_path: '/path/to/image.png',
        prompt: 'transform this image',
        denoise_strength: 0.5,
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const loadImage = result.workflow['1'] as any;
        expect(loadImage.inputs.image).toBe('/path/to/image.png');

        const ksampler = result.workflow['6'] as any;
        expect(ksampler.inputs.denoise).toBe(0.5);
      }
    });

    it('should handle upscale template customization', () => {
      const result = customizeTemplate(upscaleTemplate, {
        image_path: '/path/to/image.png',
        upscale_model: 'RealESRGAN_x4plus.pth',
        scale_factor: 4,
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const upscaleLoader = result.workflow['2'] as any;
        expect(upscaleLoader.inputs.upscale_model).toBe('RealESRGAN_x4plus.pth');
      }
    });

    it('should handle lora template customization', () => {
      const result = customizeTemplate(loraGenerationTemplate, {
        lora_name: 'my_lora.safetensors',
        prompt: 'a portrait in my style',
        lora_strength: 0.8,
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const loraLoader = result.workflow['2'] as any;
        expect(loraLoader.inputs.lora_name).toBe('my_lora.safetensors');
        expect(loraLoader.inputs.strength_model).toBe(0.8);
      }
    });

    it('should preserve node connections', () => {
      const result = customizeTemplate(txt2imgBasicTemplate, {
        prompt: 'test',
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const clipEncode = result.workflow['2'] as any;
        expect(clipEncode.inputs.clip).toEqual(['1', 1]);

        const ksampler = result.workflow['5'] as any;
        expect(ksampler.inputs.model).toEqual(['1', 0]);
        expect(ksampler.inputs.positive).toEqual(['2', 0]);
        expect(ksampler.inputs.negative).toEqual(['3', 0]);
        expect(ksampler.inputs.latent_image).toEqual(['4', 0]);
      }
    });

    it('should handle numeric parameter conversion', () => {
      const result = customizeTemplate(txt2imgBasicTemplate, {
        prompt: 'test',
        width: 1024,
        height: 768,
        steps: 50,
        cfg: 12.5,
        seed: 12345,
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();

      if (result.workflow) {
        const emptyLatent = result.workflow['4'] as any;
        expect(emptyLatent.inputs.width).toBe(1024);
        expect(emptyLatent.inputs.height).toBe(768);

        const ksampler = result.workflow['5'] as any;
        expect(ksampler.inputs.steps).toBe(50);
        expect(ksampler.inputs.cfg).toBe(12.5);
      }
    });
  });

  describe('Template array and utilities', () => {
    it('should have all templates in COMFYUI_TEMPLATES array', () => {
      expect(COMFYUI_TEMPLATES.length).toBe(5);
      expect(COMFYUI_TEMPLATES).toContain(txt2imgBasicTemplate);
      expect(COMFYUI_TEMPLATES).toContain(img2imgTemplate);
      expect(COMFYUI_TEMPLATES).toContain(inpaintTemplate);
      expect(COMFYUI_TEMPLATES).toContain(upscaleTemplate);
      expect(COMFYUI_TEMPLATES).toContain(loraGenerationTemplate);
    });

    it('getTemplateById should find templates by ID', () => {
      expect(getTemplateById('txt2img-basic')).toBe(txt2imgBasicTemplate);
      expect(getTemplateById('img2img')).toBe(img2imgTemplate);
      expect(getTemplateById('inpaint')).toBe(inpaintTemplate);
      expect(getTemplateById('upscale')).toBe(upscaleTemplate);
      expect(getTemplateById('lora-generation')).toBe(loraGenerationTemplate);
    });

    it('getTemplateById should return undefined for non-existent template', () => {
      expect(getTemplateById('non-existent')).toBeUndefined();
    });

    it('getTemplatesByCategory should filter templates by category', () => {
      const generalTemplates = getTemplatesByCategory('general');
      expect(generalTemplates.length).toBe(1);
      expect(generalTemplates[0]).toBe(txt2imgBasicTemplate);

      const customTemplates = getTemplatesByCategory('custom');
      expect(customTemplates.length).toBe(1);
      expect(customTemplates[0]).toBe(loraGenerationTemplate);
    });

    it('getTemplatesByCategory should return empty array for non-existent category', () => {
      const templates = getTemplatesByCategory('other' as any);
      expect(templates.length).toBe(0);
    });
  });

  describe('Template node structure validation', () => {
    it('all templates should have string node IDs', () => {
      for (const template of COMFYUI_TEMPLATES) {
        for (const nodeId of Object.keys(template.workflow)) {
          expect(typeof nodeId).toBe('string');
          expect(/^\d+$/.test(nodeId)).toBe(true);
        }
      }
    });

    it('all templates should have class_type in nodes', () => {
      for (const template of COMFYUI_TEMPLATES) {
        for (const node of Object.values(template.workflow)) {
          expect(node.class_type).toBeDefined();
          expect(typeof node.class_type).toBe('string');
          expect(node.class_type.length).toBeGreaterThan(0);
        }
      }
    });

    it('all templates should have inputs object in nodes', () => {
      for (const template of COMFYUI_TEMPLATES) {
        for (const node of Object.values(template.workflow)) {
          expect(node.inputs).toBeDefined();
          expect(typeof node.inputs).toBe('object');
        }
      }
    });
  });

  describe('Parameter validation', () => {
    it('all parameters should have required fields', () => {
      for (const template of COMFYUI_TEMPLATES) {
        for (const param of template.parameters) {
          expect(param.name).toBeDefined();
          expect(param.description).toBeDefined();
          expect(param.type).toBeDefined();
          expect(param.required !== undefined).toBe(true);
        }
      }
    });

    it('numeric parameters should have min/max or defaults', () => {
      for (const template of COMFYUI_TEMPLATES) {
        for (const param of template.parameters) {
          if (param.type === 'number') {
            expect(
              param.default !== undefined || (param.min !== undefined && param.max !== undefined),
            ).toBe(true);
          }
        }
      }
    });

    it('enum parameters should have options', () => {
      for (const template of COMFYUI_TEMPLATES) {
        for (const param of template.parameters) {
          if (param.type === 'enum') {
            expect(param.options).toBeDefined();
            expect(Array.isArray(param.options)).toBe(true);
          }
        }
      }
    });
  });
});
