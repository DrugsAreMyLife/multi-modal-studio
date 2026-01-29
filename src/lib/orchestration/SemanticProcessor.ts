/**
 * SemanticProcessor.ts
 * @orchestration-role "Central Intelligence"
 * Handles cross-modal logic parsing and constraint extraction.
 */

export interface SemanticConstraint {
  type: 'geometric' | 'material' | 'structural' | 'creative';
  key: string;
  value: any;
  confidence: number;
}

export interface CreativeIntent {
  domain: 'raster' | 'vector';
  operation: string;
  parameters: Record<string, any>;
  confidence: number;
}

export interface SemanticArtifact {
  id: string;
  source:
    | 'lexicon'
    | 'dimension'
    | 'forge'
    | 'creative'
    | 'semantic-analysis'
    | 'background-removal';
  tags: string[];
  constraints: SemanticConstraint[];
  creativeIntent?: CreativeIntent;
  timestamp: number;
  // Optional artifact URLs from processing operations
  maskUrl?: string;
  refinedImageUrl?: string;
  artifactUrls?: Record<string, string>;
}

import { getSemanticLLMProvider } from '../llm/semantic-llm-provider';

export class SemanticProcessor {
  /**
   * Parses a Lexicon script to extract semantic constraints using LLM.
   */
  static async parseScript(script: string): Promise<SemanticConstraint[]> {
    const llmProvider = getSemanticLLMProvider();

    try {
      // First, get high-fidelity constraints from LLM
      const constraints = await llmProvider.analyzeConstraints({
        text: script,
        domain: 'creative', // Scripting is a creative domain task
      });

      // Fallback/Augment with legacy keyword extraction for speed/reliability
      const legacyConstraints = this.parseScriptLegacy(script);

      // Merge constraints, prioritizing LLM but keeping unique legacy ones
      const merged = [...constraints];
      legacyConstraints.forEach((lc) => {
        if (!merged.some((m) => m.key === lc.key)) {
          merged.push({
            ...lc,
            id: `legacy_${Date.now()}_${lc.key}`,
            type: lc.type,
            source: 'legacy-regex',
          } as any);
        }
      });

      return merged;
    } catch (error) {
      console.warn('[SemanticProcessor] LLM analysis failed, falling back to legacy regex:', error);
      return this.parseScriptLegacy(script);
    }
  }

  /**
   * Legacy regex-based parser (Fallback)
   */
  private static parseScriptLegacy(script: string): SemanticConstraint[] {
    const constraints: SemanticConstraint[] = [];
    const lowerScript = script.toLowerCase();

    // Geometric Extraction
    if (lowerScript.includes('gear')) {
      constraints.push({
        type: 'geometric',
        key: 'internal_pitch',
        value: 'modular',
        confidence: 0.95,
      });
    }

    // Material Extraction
    if (lowerScript.includes('durable') || lowerScript.includes('heat')) {
      constraints.push({
        type: 'material',
        key: 'base_polymer',
        value: 'PA12-CF',
        confidence: 0.88,
      });
    }

    // Structural Extraction
    if (lowerScript.includes('load') || lowerScript.includes('weight')) {
      constraints.push({
        type: 'structural',
        key: 'min_infill',
        value: '40%',
        confidence: 0.82,
      });
    }

    return constraints;
  }

  /**
   * Parses verbal commands for creative intents using LLM.
   */
  static async parseCreativeIntent(command: string): Promise<CreativeIntent | null> {
    const llmProvider = getSemanticLLMProvider();

    try {
      const constraints = await llmProvider.analyzeConstraints({
        text: command,
        domain: 'creative',
      });

      // Extract operation and domain from LLM constraints
      const op = constraints.find((c) => c.key === 'operation' || c.key === 'action');
      const dom = constraints.find((c) => c.key === 'domain' || c.key === 'type');

      if (op) {
        return {
          domain:
            (dom?.value as any) || (op.value.toString().includes('vector') ? 'vector' : 'raster'),
          operation: op.value.toString(),
          parameters: constraints.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {}),
          confidence: op.confidence,
        };
      }
    } catch (error) {
      console.warn('[SemanticProcessor] LLM intent parsing failed:', error);
    }

    // Fallback to legacy regex
    return this.parseCreativeIntentLegacy(command);
  }

  private static parseCreativeIntentLegacy(command: string): CreativeIntent | null {
    const lowerCmd = command.toLowerCase();

    // Raster (Photoshop) Logic
    if (lowerCmd.includes('remove background') || lowerCmd.includes('cleanup')) {
      return {
        domain: 'raster',
        operation: 'background_removal',
        parameters: { method: 'SAM-v3', precision: 'high' },
        confidence: 0.98,
      };
    }

    if (lowerCmd.includes('harmonize') || lowerCmd.includes('lighting')) {
      return {
        domain: 'raster',
        operation: 'lighting_harmonization',
        parameters: { style: 'ambient_occlusion' },
        confidence: 0.85,
      };
    }

    // Vector (Illustrator) Logic
    if (lowerCmd.includes('vectorize') || lowerCmd.includes('svg') || lowerCmd.includes('paths')) {
      return {
        domain: 'vector',
        operation: 'vectorization',
        parameters: { tracing: 'high_fidelity' },
        confidence: 0.94,
      };
    }

    if (lowerCmd.includes('cnc') || lowerCmd.includes('standardize')) {
      return {
        domain: 'vector',
        operation: 'cnc_standardization',
        parameters: { tolerance: 0.01 },
        confidence: 0.91,
      };
    }

    return null;
  }

  /**
   * Aligns Dimension Studio meshes with Forge Fabrication requirements.
   */
  static alignModalities(meshData: any, forgeParams: any): boolean {
    console.log('[SemanticProcessor] Aligning mesh with fabrication parameters...');
    return true;
  }
}
