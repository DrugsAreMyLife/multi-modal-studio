export const SEMANTIC_DOMAINS = ['geometric', 'material', 'structural', 'creative'] as const;
export type SemanticDomain = (typeof SEMANTIC_DOMAINS)[number];

export interface DomainPromptConfig {
  systemPrompt: string;
  exampleOutput: string;
  requiredFields: string[];
}

export const DOMAIN_PROMPTS: Record<SemanticDomain, DomainPromptConfig> = {
  geometric: {
    systemPrompt: `You are a geometric constraint extraction specialist for industrial design.
Analyze the input text and extract geometric constraints including:
- Pitch: spacing between elements (e.g., "modular", "tight", "4mm pitch")
- Tolerances: manufacturing precision requirements (e.g., "±0.1mm", "precision")
- Dimensions: sizes, lengths, widths, heights (e.g., "50mm diameter", "100mm length")
- Spatial relationships: positions, alignments, orientations (e.g., "centered", "perpendicular")
- Symmetry: rotational, bilateral, radial (e.g., "4-fold symmetry")

Return a JSON array of constraint objects. Each object must have:
- key: the constraint type (pitch, tolerance, dimension, spatial, symmetry)
- value: the extracted value
- confidence: your confidence level (0.0 to 1.0)`,
    exampleOutput: `[
  {"key": "pitch", "value": "modular", "confidence": 0.9},
  {"key": "dimension", "value": {"diameter": 50, "unit": "mm"}, "confidence": 0.95},
  {"key": "tolerance", "value": "±0.1mm", "confidence": 0.8}
]`,
    requiredFields: ['key', 'value', 'confidence'],
  },

  material: {
    systemPrompt: `You are a material properties extraction specialist for manufacturing.
Analyze the input text and extract material constraints including:
- Polymer type: PA12-CF, PLA, ABS, PETG, nylon, etc.
- Density: material density in g/cm³ or kg/m³
- Thermal properties: melting point, glass transition, heat deflection
- Mechanical properties: tensile strength, flexural modulus, impact resistance
- Surface finish: matte, glossy, textured
- Color specifications: hex codes, Pantone, material names

Return a JSON array of constraint objects.`,
    exampleOutput: `[
  {"key": "polymer", "value": "PA12-CF", "confidence": 0.95},
  {"key": "density", "value": {"value": 1.4, "unit": "g/cm³"}, "confidence": 0.8},
  {"key": "thermal", "value": {"hdt": 180, "unit": "°C"}, "confidence": 0.7}
]`,
    requiredFields: ['key', 'value', 'confidence'],
  },

  structural: {
    systemPrompt: `You are a structural requirements extraction specialist for engineering.
Analyze the input text and extract structural constraints including:
- Load requirements: static loads, dynamic loads, impact loads
- Safety factors: minimum safety margins (e.g., SF 2.0, 1.5x)
- Stress limits: maximum allowable stress, yield stress
- Deflection limits: maximum allowable deflection
- Fatigue requirements: cycle counts, endurance limits
- Connection specifications: weld, bolt, adhesive requirements

Return a JSON array of constraint objects.`,
    exampleOutput: `[
  {"key": "load", "value": {"static": 500, "unit": "N"}, "confidence": 0.9},
  {"key": "safety_factor", "value": 2.0, "confidence": 0.95},
  {"key": "deflection", "value": {"max": 0.5, "unit": "mm"}, "confidence": 0.8}
]`,
    requiredFields: ['key', 'value', 'confidence'],
  },

  creative: {
    systemPrompt: `You are a creative intent extraction specialist for digital media.
Analyze the input text and extract creative operations including:
- Image operations: background removal, color correction, cropping, resizing
- Filters: blur, sharpen, denoise, stylize
- Transformations: rotate, flip, perspective, warp
- Effects: shadows, highlights, vignette, gradients
- Vectorization: trace, outline, simplify
- Compositing: layer, blend, mask, overlay

Return a JSON array of operation objects with the intended action.`,
    exampleOutput: `[
  {"key": "operation", "value": "background_removal", "confidence": 0.95},
  {"key": "filter", "value": "sharpen", "confidence": 0.7},
  {"key": "transformation", "value": "crop", "confidence": 0.8}
]`,
    requiredFields: ['key', 'value', 'confidence'],
  },
};

export function getPromptForDomain(domain: SemanticDomain): string {
  return DOMAIN_PROMPTS[domain].systemPrompt;
}

export function getExampleForDomain(domain: SemanticDomain): string {
  return DOMAIN_PROMPTS[domain].exampleOutput;
}

export function validateDomain(domain: string): domain is SemanticDomain {
  return SEMANTIC_DOMAINS.includes(domain as SemanticDomain);
}
