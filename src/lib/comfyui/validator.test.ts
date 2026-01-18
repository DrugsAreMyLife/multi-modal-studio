import {
  validateWorkflow,
  sanitizeWorkflow,
  detectCycles,
  validateAndSanitizeWorkflow,
  type ComfyUIWorkflow,
} from './validator';

describe('ComfyUI Workflow Validator', () => {
  describe('validateWorkflow - Structure Validation', () => {
    it('should reject null workflows', () => {
      const result = validateWorkflow(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow cannot be null or undefined');
    });

    it('should reject undefined workflows', () => {
      const result = validateWorkflow(undefined);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow cannot be null or undefined');
    });

    it('should reject array workflows', () => {
      const result = validateWorkflow([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Workflow must be an object, not an array');
    });

    it('should reject primitive type workflows', () => {
      const result = validateWorkflow('string');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Workflow must be an object');
    });

    it('should accept valid empty workflow', () => {
      const result = validateWorkflow({});
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateWorkflow - Node Structure Validation', () => {
    it('should reject nodes without class_type', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          inputs: {},
        } as any,
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Node '1': Missing required field 'class_type'");
    });

    it('should reject nodes without inputs', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
        } as any,
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Node '1': Missing required field 'inputs'");
    });

    it('should reject nodes with non-object inputs', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: 'not an object' as any,
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Node '1': Field 'inputs' must be an object");
    });

    it('should accept valid nodes', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {
            model_name: 'model.safetensors',
          },
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateWorkflow - Node ID Validation', () => {
    it('should reject duplicate node IDs', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
      };
      // Add duplicate
      (workflow as any)['1'] = {
        class_type: 'LoadImage',
        inputs: {},
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
    });

    it('should accept unique node IDs', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'LoadImage',
          inputs: {},
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateWorkflow - Connection Validation', () => {
    it('should accept valid connections', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'KSampler',
          inputs: {
            model: ['1', 0],
          },
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(true);
    });

    it('should reject connections to non-existent nodes', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'KSampler',
          inputs: {
            model: ['999', 0],
          },
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('node 999 does not exist'))).toBe(true);
    });

    it('should reject connections with invalid slot indices', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'KSampler',
          inputs: {
            model: ['1', 'not a number' as any],
          },
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('slot index'))).toBe(true);
    });

    it('should reject negative slot indices', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'KSampler',
          inputs: {
            model: ['1', -1],
          },
        },
      };
      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
    });
  });

  describe('detectCycles', () => {
    it('should detect simple cycles', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'Node1',
          inputs: {
            input: ['2', 0],
          },
        },
        '2': {
          class_type: 'Node2',
          inputs: {
            input: ['1', 0],
          },
        },
      };
      const cycles = detectCycles(workflow);
      expect(cycles.length).toBeGreaterThan(0);
      expect(cycles[0]).toContain('Circular dependency detected');
    });

    it('should detect complex cycles', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'Node1',
          inputs: {
            input: ['2', 0],
          },
        },
        '2': {
          class_type: 'Node2',
          inputs: {
            input: ['3', 0],
          },
        },
        '3': {
          class_type: 'Node3',
          inputs: {
            input: ['1', 0],
          },
        },
      };
      const cycles = detectCycles(workflow);
      expect(cycles.length).toBeGreaterThan(0);
    });

    it('should not detect cycles in acyclic graphs', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'KSampler',
          inputs: {
            model: ['1', 0],
          },
        },
        '3': {
          class_type: 'SaveImage',
          inputs: {
            images: ['2', 0],
          },
        },
      };
      const cycles = detectCycles(workflow);
      expect(cycles.length).toBe(0);
    });

    it('should handle self-loops', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'Node1',
          inputs: {
            input: ['1', 0],
          },
        },
      };
      const cycles = detectCycles(workflow);
      expect(cycles.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeWorkflow', () => {
    it('should remove script tags from string values', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CLIPTextEncode',
          inputs: {
            text: '<script>alert("xss")</script>harmless text',
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(sanitized['1'].inputs.text).toBe('');
    });

    it('should clamp numeric values', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'KSampler',
          inputs: {
            steps: 1e9,
            cfg: -1e9,
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(sanitized['1'].inputs.steps).toBeLessThanOrEqual(1e8);
      expect(sanitized['1'].inputs.cfg).toBeGreaterThanOrEqual(-1e8);
    });

    it('should handle non-finite numbers', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'KSampler',
          inputs: {
            steps: Infinity,
            cfg: NaN,
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(Number.isFinite(sanitized['1'].inputs.steps)).toBe(true);
      expect(Number.isFinite(sanitized['1'].inputs.cfg)).toBe(true);
    });

    it('should truncate long strings', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CLIPTextEncode',
          inputs: {
            text: 'a'.repeat(20000),
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect((sanitized['1'].inputs.text as string).length).toBeLessThanOrEqual(10000);
    });

    it('should preserve valid connection tuples', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'KSampler',
          inputs: {
            model: ['1', 0],
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(sanitized['2'].inputs.model).toEqual(['1', 0]);
    });

    it('should sanitize nested objects', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CustomNode',
          inputs: {
            config: {
              nested: '<script>alert("xss")</script>text',
              count: 1e10,
            },
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      const config = sanitized['1'].inputs.config as any;
      expect(config.nested).toBe('');
      expect(config.count).toBeLessThanOrEqual(1e8);
    });

    it('should remove dangerous patterns', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CLIPTextEncode',
          inputs: {
            text: 'javascript:alert("xss")',
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(sanitized['1'].inputs.text).toBe('');
    });

    it('should limit object key count', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CustomNode',
          inputs: (() => {
            const obj: Record<string, unknown> = {};
            for (let i = 0; i < 1500; i++) {
              obj[`key${i}`] = i;
            }
            return obj;
          })(),
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(Object.keys(sanitized['1'].inputs).length).toBeLessThanOrEqual(1000);
    });

    it('should limit array size', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CustomNode',
          inputs: {
            values: Array(1500).fill(0),
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect((sanitized['1'].inputs.values as any[]).length).toBeLessThanOrEqual(1000);
    });

    it('should handle boolean values', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CustomNode',
          inputs: {
            enabled: true,
            disabled: false,
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(sanitized['1'].inputs.enabled).toBe(true);
      expect(sanitized['1'].inputs.disabled).toBe(false);
    });

    it('should preserve null and undefined', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'CustomNode',
          inputs: {
            nullValue: null,
            undefinedValue: undefined,
          },
        },
      };
      const sanitized = sanitizeWorkflow(workflow);
      expect(sanitized['1'].inputs.nullValue).toBeNull();
      expect(sanitized['1'].inputs.undefinedValue).toBeUndefined();
    });
  });

  describe('validateAndSanitizeWorkflow', () => {
    it('should return invalid if validation fails', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'KSampler',
          inputs: {
            model: ['999', 0],
          },
        },
      };
      const result = validateAndSanitizeWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.sanitized).toBeUndefined();
      expect(result.validation.valid).toBe(false);
    });

    it('should return sanitized workflow if validation passes', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {},
        },
        '2': {
          class_type: 'KSampler',
          inputs: {
            model: ['1', 0],
            steps: 1e10,
            prompt: '<script>xss</script>text',
          },
        },
      };
      const result = validateAndSanitizeWorkflow(workflow);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
      expect(result.sanitized!['2'].inputs.steps).toBeLessThanOrEqual(1e8);
      expect(result.sanitized!['2'].inputs.prompt).toBe('');
    });

    it('should preserve valid data during sanitization', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadModel',
          inputs: {
            model_name: 'sd-model.safetensors',
          },
        },
      };
      const result = validateAndSanitizeWorkflow(workflow);
      expect(result.valid).toBe(true);
      expect(result.sanitized!['1'].inputs.model_name).toBe('sd-model.safetensors');
    });
  });

  describe('Complex Workflow Scenarios', () => {
    it('should validate a complete image generation workflow', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'LoadCheckpoint',
          inputs: {
            ckpt_name: 'model.safetensors',
          },
        },
        '2': {
          class_type: 'CLIPTextEncode',
          inputs: {
            text: 'a beautiful landscape',
            clip: ['1', 1],
          },
        },
        '3': {
          class_type: 'CLIPTextEncode',
          inputs: {
            text: 'blurry, low quality',
            clip: ['1', 1],
          },
        },
        '4': {
          class_type: 'KSampler',
          inputs: {
            seed: 123456,
            steps: 20,
            cfg: 7.0,
            model: ['1', 0],
            positive: ['2', 0],
            negative: ['3', 0],
            latent_image: ['5', 0],
          },
        },
        '5': {
          class_type: 'VAEEncode',
          inputs: {
            pixels: ['6', 0],
            vae: ['1', 2],
          },
        },
        '6': {
          class_type: 'LoadImage',
          inputs: {
            image: 'input.png',
          },
        },
        '7': {
          class_type: 'VAEDecode',
          inputs: {
            samples: ['4', 0],
            vae: ['1', 2],
          },
        },
        '8': {
          class_type: 'SaveImage',
          inputs: {
            images: ['7', 0],
            filename_prefix: 'output',
          },
        },
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch multiple validation errors', () => {
      const workflow: ComfyUIWorkflow = {
        '1': {
          class_type: 'KSampler',
          inputs: {
            model: ['999', 0], // Invalid reference
          },
        },
        '2': {
          class_type: 'LoadModel',
          // Missing inputs
        } as any,
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
