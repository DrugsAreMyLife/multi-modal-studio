/**
 * Style DNA System
 * Allows for extraction, mixing, and application of visual aesthetics across models.
 */

export interface StyleDNA {
  id: string;
  name: string;
  // Visual Vectors (0-100)
  aesthetics: {
    complexity: number; // 0 = minimalist, 100 = maximalist
    curviness: number; // 0 = geometric/brutalist, 100 = organic/fluid
    contrast: number; // 0 = soft/low-con, 100 = hard/punchy
    vibrance: number; // 0 = muted/sepia, 100 = neon/vibrant
    lighting: number; // 0 = dark/moody, 100 = bright/ethereal
  };
  // Thematic Weights
  themes: Record<string, number>; // e.g., { "cyberpunk": 80, "watercolor": 20 }
  // Model-specific hints
  hints?: {
    loras?: { name: string; strength: number }[];
    prompts?: string[];
  };
  createdAt: number;
}

/**
 * Extract DNA from an asset description or VLM analysis
 */
export async function extractDNAFromDescription(description: string): Promise<Partial<StyleDNA>> {
  // In a real implementation, this would call a VLM or LLM to tokenize the style.
  // For now, we return a mock based on keywords.
  const lower = description.toLowerCase();

  return {
    aesthetics: {
      complexity: lower.includes('detailed') || lower.includes('intricate') ? 85 : 50,
      curviness: lower.includes('organic') || lower.includes('fluid') ? 80 : 30,
      contrast: lower.includes('noir') || lower.includes('dramatic') ? 90 : 50,
      vibrance: lower.includes('neon') || lower.includes('colorful') ? 95 : 40,
      lighting: lower.includes('bright') || lower.includes('sunny') ? 85 : 45,
    },
    themes: {
      cyberpunk: lower.includes('cyber') || lower.includes('neon') ? 100 : 0,
      watercolor: lower.includes('water') || lower.includes('painted') ? 100 : 0,
    },
  };
}

/**
 * Mix two DNAs with a specific ratio
 */
export function mixDNA(dnaA: StyleDNA, dnaB: StyleDNA, ratio: number = 0.5): StyleDNA {
  const invRatio = 1 - ratio;

  const mixedAesthetics = {
    complexity: Math.round(
      dnaA.aesthetics.complexity * ratio + dnaB.aesthetics.complexity * invRatio,
    ),
    curviness: Math.round(dnaA.aesthetics.curviness * ratio + dnaB.aesthetics.curviness * invRatio),
    contrast: Math.round(dnaA.aesthetics.contrast * ratio + dnaB.aesthetics.contrast * invRatio),
    vibrance: Math.round(dnaA.aesthetics.vibrance * ratio + dnaB.aesthetics.vibrance * invRatio),
    lighting: Math.round(dnaA.aesthetics.lighting * ratio + dnaB.aesthetics.lighting * invRatio),
  };

  const allThemes = new Set([...Object.keys(dnaA.themes), ...Object.keys(dnaB.themes)]);
  const mixedThemes: Record<string, number> = {};

  allThemes.forEach((theme) => {
    const valA = dnaA.themes[theme] || 0;
    const valB = dnaB.themes[theme] || 0;
    mixedThemes[theme] = Math.round(valA * ratio + valB * invRatio);
  });

  return {
    id: `mix-${Date.now()}`,
    name: `Mix (${dnaA.name} / ${dnaB.name})`,
    aesthetics: mixedAesthetics,
    themes: mixedThemes,
    createdAt: Date.now(),
  };
}

/**
 * Convert DNA to a prompt-suffix for LLMs/Image generators
 */
export function dnaToPrompt(dna: StyleDNA): string {
  const parts: string[] = [];

  // Convert themes to keywords
  Object.entries(dna.themes)
    .filter(([_, weight]) => weight > 10)
    .forEach(([theme, weight]) => {
      parts.push(`${theme} style (${weight}%)`);
    });

  // Convert aesthetics to descriptions
  if (dna.aesthetics.complexity > 70) parts.push('intricate details');
  if (dna.aesthetics.curviness > 70) parts.push('organic fluid shapes');
  if (dna.aesthetics.contrast > 70) parts.push('high contrast dramatic lighting');
  if (dna.aesthetics.vibrance > 70) parts.push('vibrant saturated colors');

  return parts.join(', ');
}

/**
 * Common Style Presets
 */
export const STYLE_PRESETS: StyleDNA[] = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    aesthetics: { complexity: 80, curviness: 30, contrast: 90, vibrance: 100, lighting: 40 },
    themes: { cyberpunk: 100, futuristic: 80 },
    hints: { prompts: ['neon lights', 'night city', 'high tech', 'low life'] },
    createdAt: Date.now(),
  },
  {
    id: 'minimalist-zen',
    name: 'Minimalist Zen',
    aesthetics: { complexity: 10, curviness: 20, contrast: 40, vibrance: 20, lighting: 90 },
    themes: { minimalist: 100, japanese: 60 },
    hints: { prompts: ['clean lines', 'white space', 'serene', 'natural light'] },
    createdAt: Date.now(),
  },
  {
    id: 'watercolor-dream',
    name: 'Watercolor Dream',
    aesthetics: { complexity: 60, curviness: 95, contrast: 30, vibrance: 80, lighting: 70 },
    themes: { watercolor: 100, impressionist: 70 },
    hints: { prompts: ['soft edges', 'ink bleeds', 'ethereal', 'dreamy'] },
    createdAt: Date.now(),
  },
  {
    id: 'brutalist-mono',
    name: 'Brutalist Mono',
    aesthetics: { complexity: 40, curviness: 0, contrast: 100, vibrance: 0, lighting: 50 },
    themes: { brutalist: 100, monochrome: 100 },
    hints: { prompts: ['raw concrete', 'geometric', 'stark', 'black and white'] },
    createdAt: Date.now(),
  },
];
