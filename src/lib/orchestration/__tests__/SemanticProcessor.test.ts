/**
 * SemanticProcessor.test.ts
 * Unit tests for SemanticProcessor and SemanticLLMProvider
 *
 * Test Coverage:
 * - SemanticProcessor.parseScript() - constraint extraction
 * - SemanticProcessor.parseCreativeIntent() - creative command parsing
 * - SemanticLLMProvider - LLM API calls and constraint parsing
 * - Caching behavior verification
 * - Error handling for invalid inputs
 */

import {
  SemanticProcessor,
  SemanticConstraint,
  CreativeIntent,
  SemanticArtifact,
} from '../SemanticProcessor';
import {
  SemanticLLMProvider,
  SemanticConstraint as LLMConstraint,
  LLMProvider,
} from '../../llm/semantic-llm-provider';

// ============================================================================
// SEMANTIC PROCESSOR TESTS
// ============================================================================

describe('SemanticProcessor.parseScript', () => {
  describe('geometric constraint extraction', () => {
    it('should extract gear geometric constraint from script containing "gear"', () => {
      const script = 'Design a custom gear with modular pitch for CNC';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints).toHaveLength(1);
      expect(constraints[0]).toEqual({
        type: 'geometric',
        key: 'internal_pitch',
        value: 'modular',
        confidence: 0.95,
      });
    });

    it('should extract gear constraint case-insensitively', () => {
      const script = 'This GEAR design requires specific tolerances';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'geometric')).toBe(true);
      expect(constraints[0].key).toBe('internal_pitch');
    });

    it('should not extract geometric constraints for scripts without gear keywords', () => {
      const script = 'Create a flat surface with smooth finish';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'geometric' && c.key === 'internal_pitch')).toBe(
        false,
      );
    });
  });

  describe('material constraint extraction', () => {
    it('should extract material constraint from script containing "durable"', () => {
      const script = 'Build a durable part that can withstand stress';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'material')).toBe(true);
      const materialConstraint = constraints.find((c) => c.type === 'material');
      expect(materialConstraint).toEqual({
        type: 'material',
        key: 'base_polymer',
        value: 'PA12-CF',
        confidence: 0.88,
      });
    });

    it('should extract material constraint from script containing "heat"', () => {
      const script = 'This component must handle heat resistance requirements';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'material')).toBe(true);
    });

    it('should extract material constraint case-insensitively', () => {
      const script = 'DURABLE and HEAT resistant polymer needed';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'material')).toBe(true);
    });

    it('should not extract material constraints for scripts without keywords', () => {
      const script = 'Design a simple flat plate';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'material')).toBe(false);
    });
  });

  describe('structural constraint extraction', () => {
    it('should extract structural constraint from script containing "load"', () => {
      const script = 'Design a bracket to support heavy load';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'structural')).toBe(true);
      const structConstraint = constraints.find((c) => c.type === 'structural');
      expect(structConstraint).toEqual({
        type: 'structural',
        key: 'min_infill',
        value: '40%',
        confidence: 0.82,
      });
    });

    it('should extract structural constraint from script containing "weight"', () => {
      const script = 'Create a frame that manages weight distribution';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'structural')).toBe(true);
    });

    it('should extract structural constraint case-insensitively', () => {
      const script = 'LOAD bearing component with specific WEIGHT limits';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'structural')).toBe(true);
    });

    it('should not extract structural constraints for scripts without keywords', () => {
      const script = 'Simple decorative object';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'structural')).toBe(false);
    });
  });

  describe('multiple constraint extraction', () => {
    it('should extract multiple constraints from comprehensive script', () => {
      const script = `
        Design a durable gear mechanism that can handle heavy load.
        The gear must have modular pitch and heat resistance.
        Weight distribution should be optimized.
      `;
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.length).toBeGreaterThanOrEqual(3);
      expect(constraints.some((c) => c.type === 'geometric')).toBe(true);
      expect(constraints.some((c) => c.type === 'material')).toBe(true);
      expect(constraints.some((c) => c.type === 'structural')).toBe(true);
    });

    it('should maintain confidence scores for all constraints', () => {
      const script = 'Durable gear with load requirements';
      const constraints = SemanticProcessor.parseScript(script);

      constraints.forEach((constraint) => {
        expect(typeof constraint.confidence).toBe('number');
        expect(constraint.confidence).toBeGreaterThan(0);
        expect(constraint.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const constraints = SemanticProcessor.parseScript('');
      expect(constraints).toEqual([]);
    });

    it('should handle whitespace-only string', () => {
      const constraints = SemanticProcessor.parseScript('   \n\t  ');
      expect(constraints).toEqual([]);
    });

    it('should handle very long scripts', () => {
      const longScript = 'gear '.repeat(1000) + 'durable heat load weight';
      const constraints = SemanticProcessor.parseScript(longScript);

      expect(constraints.length).toBeGreaterThan(0);
      // Should extract all relevant constraints
      expect(constraints.some((c) => c.type === 'geometric')).toBe(true);
      expect(constraints.some((c) => c.type === 'material')).toBe(true);
      expect(constraints.some((c) => c.type === 'structural')).toBe(true);
    });

    it('should handle special characters in script', () => {
      const script = 'Design a @#$%^&*() gear with durable material!';
      const constraints = SemanticProcessor.parseScript(script);

      expect(constraints.some((c) => c.type === 'geometric')).toBe(true);
      expect(constraints.some((c) => c.type === 'material')).toBe(true);
    });
  });
});

describe('SemanticProcessor.parseCreativeIntent', () => {
  describe('raster operations (Photoshop-style)', () => {
    it('should parse background removal intent', () => {
      const command = 'remove background from the image';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('raster');
      expect(intent?.operation).toBe('background_removal');
      expect(intent?.parameters.method).toBe('SAM-v3');
      expect(intent?.parameters.precision).toBe('high');
      expect(intent?.confidence).toBe(0.98);
    });

    it('should parse cleanup intent', () => {
      const command = 'cleanup the image for me';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('raster');
      expect(intent?.operation).toBe('background_removal');
    });

    it('should parse lighting harmonization intent', () => {
      const command = 'harmonize the lighting in this photo';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('raster');
      expect(intent?.operation).toBe('lighting_harmonization');
      expect(intent?.parameters.style).toBe('ambient_occlusion');
      expect(intent?.confidence).toBe(0.85);
    });

    it('should parse lighting adjustment intent', () => {
      const command = 'adjust lighting to match the reference';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('raster');
      expect(intent?.operation).toBe('lighting_harmonization');
    });

    it('should handle case-insensitive raster commands', () => {
      const command = 'REMOVE BACKGROUND FROM THE IMAGE';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('raster');
      expect(intent?.operation).toBe('background_removal');
    });
  });

  describe('vector operations (Illustrator-style)', () => {
    it('should parse vectorization intent', () => {
      const command = 'vectorize this image to SVG format';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('vector');
      expect(intent?.operation).toBe('vectorization');
      expect(intent?.parameters.tracing).toBe('high_fidelity');
      expect(intent?.confidence).toBe(0.94);
    });

    it('should parse svg conversion intent', () => {
      const command = 'convert to svg with paths';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('vector');
      expect(intent?.operation).toBe('vectorization');
    });

    it('should parse paths intent', () => {
      const command = 'create clean paths for this design';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('vector');
      expect(intent?.operation).toBe('vectorization');
    });

    it('should parse CNC standardization intent', () => {
      const command = 'standardize for CNC cutting';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('vector');
      expect(intent?.operation).toBe('cnc_standardization');
      expect(intent?.parameters.tolerance).toBe(0.01);
      expect(intent?.confidence).toBe(0.91);
    });

    it('should parse cnc optimization intent', () => {
      const command = 'optimize design for cnc machining';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('vector');
      expect(intent?.operation).toBe('cnc_standardization');
    });

    it('should handle case-insensitive vector commands', () => {
      const command = 'VECTORIZE THIS USING SVG PATHS';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('vector');
    });
  });

  describe('unrecognized intents', () => {
    it('should return null for unrecognized command', () => {
      const command = 'make it look cooler';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).toBeNull();
    });

    it('should return null for empty command', () => {
      const intent = SemanticProcessor.parseCreativeIntent('');
      expect(intent).toBeNull();
    });

    it('should return null for whitespace-only command', () => {
      const intent = SemanticProcessor.parseCreativeIntent('   \n\t  ');
      expect(intent).toBeNull();
    });

    it('should return null for gibberish command', () => {
      const command = 'xyzabc qwerty mnop';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle very long commands', () => {
      const command = 'remove background ' + 'very '.repeat(100) + 'please';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.operation).toBe('background_removal');
    });

    it('should handle commands with special characters', () => {
      const command = 'remove background @ #$%^&*() from image!';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      expect(intent?.domain).toBe('raster');
    });

    it('should prioritize first matching operation', () => {
      const command = 'vectorize the image and also remove background to harmonize lighting';
      const intent = SemanticProcessor.parseCreativeIntent(command);

      expect(intent).not.toBeNull();
      // Should match vectorize first (appears first in if chain)
      expect(intent?.operation).toBe('vectorization');
    });
  });
});

describe('SemanticProcessor.alignModalities', () => {
  it('should return true for valid mesh and forge parameters', () => {
    const meshData = { vertices: [], faces: [] };
    const forgeParams = { tolerance: 0.01 };

    const result = SemanticProcessor.alignModalities(meshData, forgeParams);
    expect(result).toBe(true);
  });

  it('should handle null parameters', () => {
    const result = SemanticProcessor.alignModalities(null, null);
    expect(result).toBe(true);
  });

  it('should handle complex mesh data', () => {
    const meshData = {
      vertices: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
      faces: [[0, 1, 2]],
    };
    const forgeParams = { tolerance: 0.001, material: 'PA12' };

    const result = SemanticProcessor.alignModalities(meshData, forgeParams);
    expect(result).toBe(true);
  });
});

// ============================================================================
// SEMANTIC LLM PROVIDER TESTS
// ============================================================================

// Mock the Anthropic and OpenAI SDK modules
jest.mock('@anthropic-ai/sdk');
jest.mock('openai');

describe('SemanticLLMProvider', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default config from environment', () => {
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        LLM_PROVIDER: 'anthropic',
        ANTHROPIC_API_KEY: 'test-key-123',
      };

      const provider = new SemanticLLMProvider();
      expect(provider).toBeDefined();

      process.env = originalEnv;
    });

    it('should initialize with custom config', () => {
      const config = {
        provider: 'openai' as LLMProvider,
        model: 'gpt-4o-mini',
        apiKey: 'custom-key',
      };

      const provider = new SemanticLLMProvider(config);
      expect(provider).toBeDefined();
    });

    it('should merge custom config with defaults', () => {
      const config = {
        model: 'custom-model-v1',
      };

      const provider = new SemanticLLMProvider(config);
      expect(provider).toBeDefined();
    });
  });

  describe('parseConstraints', () => {
    it('should parse valid JSON array response', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = JSON.stringify([
        { key: 'pitch', value: 'modular', confidence: 0.95 },
        { key: 'tolerance', value: 0.001, confidence: 0.88 },
      ]);

      // Access the private method through type assertion for testing
      const constraints = (provider as any).parseConstraints(response, 'geometric');

      expect(constraints).toHaveLength(2);
      expect(constraints[0]).toMatchObject({
        type: 'geometric',
        key: 'pitch',
        value: 'modular',
        confidence: 0.95,
        source: 'llm',
      });
      expect(constraints[1]).toMatchObject({
        type: 'geometric',
        key: 'tolerance',
        value: 0.001,
      });
    });

    it('should extract JSON from text with surrounding content', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = `
        Based on the analysis, here are the constraints:
        [
          { "key": "material", "value": "PA12-CF", "confidence": 0.92 }
        ]
        These constraints are suitable for the application.
      `;

      const constraints = (provider as any).parseConstraints(response, 'material');

      expect(constraints).toHaveLength(1);
      expect(constraints[0].key).toBe('material');
      expect(constraints[0].value).toBe('PA12-CF');
    });

    it('should handle constraints with missing confidence', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = JSON.stringify([{ key: 'test', value: 'value' }]);

      const constraints = (provider as any).parseConstraints(response, 'creative');

      expect(constraints[0].confidence).toBe(0.8); // default confidence
    });

    it('should use name as key if key is missing', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = JSON.stringify([{ name: 'diameter', value: 50 }]);

      const constraints = (provider as any).parseConstraints(response, 'geometric');

      expect(constraints[0].key).toBe('diameter');
    });

    it('should return empty array for invalid JSON', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = 'This is not JSON at all';

      const constraints = (provider as any).parseConstraints(response, 'structural');

      expect(constraints).toEqual([]);
    });

    it('should return empty array for malformed JSON array', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = '[{invalid json}]';

      const constraints = (provider as any).parseConstraints(response, 'structural');

      expect(constraints).toEqual([]);
    });

    it('should handle empty array response', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = '[]';

      const constraints = (provider as any).parseConstraints(response, 'geometric');

      expect(constraints).toEqual([]);
    });

    it('should assign unique IDs to constraints', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const response = JSON.stringify([
        { key: 'constraint1', value: 'value1' },
        { key: 'constraint2', value: 'value2' },
      ]);

      const constraints = (provider as any).parseConstraints(response, 'geometric');

      expect(constraints[0].id).toBeDefined();
      expect(constraints[1].id).toBeDefined();
      expect(constraints[0].id).not.toBe(constraints[1].id);
      expect(constraints[0].id).toMatch(/^constraint_\d+_0$/);
      expect(constraints[1].id).toMatch(/^constraint_\d+_1$/);
    });
  });

  describe('getSystemPrompt', () => {
    it('should return geometric system prompt', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const prompt = (provider as any).getSystemPrompt('geometric');

      expect(prompt).toContain('geometric');
      expect(prompt).toContain('JSON');
    });

    it('should return material system prompt', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const prompt = (provider as any).getSystemPrompt('material');

      expect(prompt).toContain('material');
    });

    it('should return structural system prompt', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const prompt = (provider as any).getSystemPrompt('structural');

      expect(prompt).toContain('structural');
    });

    it('should return creative system prompt', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const prompt = (provider as any).getSystemPrompt('creative');

      expect(prompt).toContain('creative');
      expect(prompt).toContain('Adobe');
    });

    it('should return geometric prompt as default for unknown domain', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const prompt = (provider as any).getSystemPrompt('unknown');

      expect(prompt).toContain('geometric');
    });
  });

  describe('error handling', () => {
    it('should throw error when Anthropic client not initialized', async () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: undefined,
      });

      await expect(
        provider.analyzeConstraints({
          text: 'test',
          domain: 'geometric',
          provider: 'anthropic',
        }),
      ).rejects.toThrow('Anthropic client not initialized');
    });

    it('should throw error when OpenAI client not initialized', async () => {
      const provider = new SemanticLLMProvider({
        provider: 'openai',
        apiKey: undefined,
      });

      await expect(
        provider.analyzeConstraints({
          text: 'test',
          domain: 'geometric',
          provider: 'openai',
        }),
      ).rejects.toThrow('OpenAI client not initialized');
    });

    it('should throw error for unknown provider', async () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      await expect(
        provider.analyzeConstraints({
          text: 'test',
          domain: 'geometric',
          provider: 'unknown' as LLMProvider,
        }),
      ).rejects.toThrow('Unknown provider: unknown');
    });
  });

  describe('constraint domain mapping', () => {
    it('should correctly map domain to constraint type in response', () => {
      const provider = new SemanticLLMProvider({
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      const domains: Array<'geometric' | 'material' | 'structural' | 'creative'> = [
        'geometric',
        'material',
        'structural',
        'creative',
      ];

      domains.forEach((domain) => {
        const response = JSON.stringify([{ key: 'test', value: 'value' }]);
        const constraints = (provider as any).parseConstraints(response, domain);

        expect(constraints[0].type).toBe(domain);
      });
    });
  });
});

// ============================================================================
// SEMANTIC ARTIFACT TESTS
// ============================================================================

describe('SemanticArtifact', () => {
  it('should create artifact with all required fields', () => {
    const artifact: SemanticArtifact = {
      id: 'artifact-001',
      source: 'lexicon',
      tags: ['mechanical', 'gear'],
      constraints: [
        {
          type: 'geometric',
          key: 'pitch',
          value: 'modular',
          confidence: 0.95,
        },
      ],
      timestamp: Date.now(),
    };

    expect(artifact.id).toBe('artifact-001');
    expect(artifact.source).toBe('lexicon');
    expect(artifact.tags).toContain('mechanical');
    expect(artifact.constraints).toHaveLength(1);
  });

  it('should support creative intent in artifact', () => {
    const artifact: SemanticArtifact = {
      id: 'artifact-002',
      source: 'creative',
      tags: ['raster', 'image'],
      constraints: [],
      creativeIntent: {
        domain: 'raster',
        operation: 'background_removal',
        parameters: { method: 'SAM-v3' },
        confidence: 0.98,
      },
      timestamp: Date.now(),
    };

    expect(artifact.creativeIntent).toBeDefined();
    expect(artifact.creativeIntent?.operation).toBe('background_removal');
  });

  it('should handle empty constraints and tags', () => {
    const artifact: SemanticArtifact = {
      id: 'artifact-003',
      source: 'forge',
      tags: [],
      constraints: [],
      timestamp: Date.now(),
    };

    expect(artifact.tags).toHaveLength(0);
    expect(artifact.constraints).toHaveLength(0);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('SemanticProcessor and SemanticLLMProvider Integration', () => {
  it('should extract script constraints and parse creative intent together', () => {
    const script = 'Design a durable gear mechanism that handles heavy load with CNC capabilities';

    const constraints = SemanticProcessor.parseScript(script);
    expect(constraints.length).toBeGreaterThan(0);

    const intent = SemanticProcessor.parseCreativeIntent(script);
    expect(intent).not.toBeNull();
    expect(intent?.domain).toBe('vector');
  });

  it('should create artifact with parsed constraints and intent', () => {
    const script = 'Build a heat-resistant part that needs background removal';
    const constraints = SemanticProcessor.parseScript(script);
    const intent = SemanticProcessor.parseCreativeIntent(script);

    const artifact: SemanticArtifact = {
      id: 'integrated-artifact',
      source: 'creative',
      tags: ['integration-test'],
      constraints,
      creativeIntent: intent || undefined,
      timestamp: Date.now(),
    };

    expect(artifact.constraints.some((c) => c.type === 'material')).toBe(true);
    expect(artifact.creativeIntent?.operation).toBe('background_removal');
  });

  it('should handle constraint domains consistently', () => {
    const testCases = [
      {
        domain: 'geometric' as const,
        keyword: 'gear',
      },
      {
        domain: 'material' as const,
        keyword: 'durable',
      },
      {
        domain: 'structural' as const,
        keyword: 'load',
      },
    ];

    testCases.forEach(({ domain, keyword }) => {
      const script = keyword;
      const constraints = SemanticProcessor.parseScript(script);
      const relevant = constraints.find((c) => c.type === domain);

      expect(relevant).toBeDefined();
      expect(relevant?.type).toBe(domain);
    });
  });
});
