import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  StyleDNA,
  IconConcept,
  IconAsset,
  GenerationPass,
  IconStudioTab,
  IconGenerationSettings,
} from '@/lib/types/icon-system';
import { v4 as uuidv4 } from 'uuid';

interface IconStudioStore {
  // State
  activeTab: IconStudioTab;
  selectedModelId: string;
  styleDNA: StyleDNA;
  generationSettings: IconGenerationSettings;
  concepts: IconConcept[];
  assets: IconAsset[];
  pipelineSteps: GenerationPass[];
  isGenerating: boolean;

  // Actions
  setModel: (id: string) => void;
  setActiveTab: (tab: IconStudioTab) => void;
  updateStyleDNA: (updates: Partial<StyleDNA>) => void;
  updateGenerationSettings: (updates: Partial<IconGenerationSettings>) => void;
  addConcept: (input: string) => void;
  removeConcept: (id: string) => void;
  runGeneration: () => Promise<void>;
  resetPipeline: () => void;
}

// Registry
export const AVAILABLE_ICON_MODELS = [
  {
    id: 'recraft-v3',
    name: 'Recraft v3 (SOTA SVG)',
    provider: 'cloud',
    capabilities: { vector: true, raster: true, style_mixing: true },
  },
  {
    id: 'firefly-vector',
    name: 'Adobe Firefly Vector',
    provider: 'cloud',
    capabilities: { vector: true, raster: false, style_mixing: false },
  },
  {
    id: 'flux-pro-vector',
    name: 'Flux 1.1 Pro (Vector LoRA)',
    provider: 'cloud',
    capabilities: { vector: false, raster: true, style_mixing: true },
  },
  {
    id: 'svg-turbo-local',
    name: 'SVG Turbo (Local)',
    provider: 'local',
    capabilities: { vector: true, raster: false, style_mixing: false },
  },
];

const DEFAULT_STYLE_DNA: StyleDNA = {
  geometry: {
    stroke_width: '2px',
    corner_radius: '4px',
    cap_style: 'round',
    join_style: 'round',
    optical_corrections: true,
  },
  composition: {
    max_objects: 3,
    symmetry_bias: 0.7,
    negative_space_ratio: 0.25,
    icon_density: 'medium',
  },
  grid_system: {
    canvas: '24x24',
    safe_area: '12.5%',
    baseline_offset: '1px',
  },
  material_model: {
    surface: 'glass',
    blur_radius: '8px',
    transparency: 0.18,
    refraction: true,
  },
  lighting_model: {
    light_direction: 'top-left',
    highlight_intensity: 0.6,
    shadow_depth: 0.3,
  },
  color_system: {
    primary_palette: ['#F5F7FA'],
    accent_palette: ['#4F8CFF'],
    disabled_opacity: 0.4,
    semantic_colors: {
      error: '#E5533D',
      success: '#3DBE73',
      warning: '#F59E0B',
    },
  },
  nuance: {
    complexity: 0,
    weight: 0,
    depth: 0,
  },
};

const INITIAL_PIPELINE: GenerationPass[] = [
  { id: '1', name: 'Semantic Interpretation', status: 'pending', progress: 0, logs: [] },
  { id: '2', name: 'Primitive Shape Gen', status: 'pending', progress: 0, logs: [] },
  { id: '3', name: 'Style Application', status: 'pending', progress: 0, logs: [] },
  { id: '4', name: 'Normalization', status: 'pending', progress: 0, logs: [] },
  { id: '5', name: 'State Variant Gen', status: 'pending', progress: 0, logs: [] },
  { id: '6', name: 'Resolution Scaling', status: 'pending', progress: 0, logs: [] },
  { id: '7', name: 'QA & Validation', status: 'pending', progress: 0, logs: [] },
  { id: '8', name: 'Documentation Write', status: 'pending', progress: 0, logs: [] },
];

export const useIconStudioStore = create<IconStudioStore>()(
  persist(
    (set, get) => ({
      activeTab: 'dna',
      selectedModelId: 'recraft-v3',
      styleDNA: DEFAULT_STYLE_DNA,
      generationSettings: {
        outputFormat: 'svg',
        background: 'transparent',
        paletteOverride: null,
      },
      concepts: [],
      assets: [],
      pipelineSteps: INITIAL_PIPELINE,
      isGenerating: false,

      setModel: (id: string) => set({ selectedModelId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      updateStyleDNA: (updates) =>
        set((state) => ({
          styleDNA: { ...state.styleDNA, ...updates },
        })),

      updateGenerationSettings: (updates) =>
        set((state) => ({
          generationSettings: { ...state.generationSettings, ...updates },
        })),

      addConcept: (input) => {
        // Basic parser for "name {tags}" syntax could go here
        // For now, simple creation
        const id = uuidv4();
        const newConcept: IconConcept = {
          id,
          name: input.split(' ')[0],
          aliases: [],
          tags: [],
          priority: 'standard',
          states: ['default'],
          exclusions: [],
          relationships: {},
          definition_string: input,
        };
        set((state) => ({ concepts: [...state.concepts, newConcept] }));
      },

      removeConcept: (id) =>
        set((state) => ({
          concepts: state.concepts.filter((c) => c.id !== id),
        })),

      resetPipeline: () => set({ pipelineSteps: INITIAL_PIPELINE, isGenerating: false }),

      runGeneration: async () => {
        set({ isGenerating: true, pipelineSteps: INITIAL_PIPELINE });

        // Simulator for the 8-pass pipeline
        const steps = get().pipelineSteps;

        for (let i = 0; i < steps.length; i++) {
          const stepId = steps[i].id;

          // Set running
          set((state) => ({
            pipelineSteps: state.pipelineSteps.map((s) =>
              s.id === stepId ? { ...s, status: 'running', progress: 0 } : s,
            ),
          }));

          // Simulate work (progress bar)
          await new Promise((r) => setTimeout(r, 600));

          set((state) => ({
            pipelineSteps: state.pipelineSteps.map((s) =>
              s.id === stepId ? { ...s, status: 'completed', progress: 100 } : s,
            ),
          }));
        }

        set({ isGenerating: false });

        // Add mock assets
        const mockAsset: IconAsset = {
          id: uuidv4(),
          conceptId: get().concepts[0]?.id || 'unknown',
          state: 'default',
          svgContent: '<svg>...</svg>',
          resolution: '24px',
          qualityScore: 98,
          driftScore: 2,
          issues: [],
          createdAt: Date.now(),
        };

        set((state) => ({ assets: [...state.assets, mockAsset] }));
      },
    }),
    {
      name: 'icon-studio-storage',
    },
  ),
);
