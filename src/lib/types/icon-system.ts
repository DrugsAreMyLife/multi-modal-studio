export interface StyleDNA {
    geometry: {
        stroke_width: string;
        corner_radius: string;
        cap_style: 'round' | 'butt' | 'square';
        join_style: 'round' | 'bevel' | 'miter';
        optical_corrections: boolean;
    };
    composition: {
        max_objects: number;
        symmetry_bias: number; // 0-1
        negative_space_ratio: number; // 0-1
        icon_density: 'low' | 'medium' | 'high';
    };
    grid_system: {
        canvas: string; // e.g., "24x24"
        safe_area: string; // e.g., "12.5%"
        baseline_offset: string;
    };
    material_model: {
        surface: 'flat' | 'glass' | 'metallic';
        blur_radius: string;
        transparency: number;
        refraction: boolean;
    };
    lighting_model: {
        light_direction: 'top-left' | 'top-right' | 'top' | 'front';
        highlight_intensity: number;
        shadow_depth: number;
    };
    color_system: {
        primary_palette: string[];
        accent_palette: string[];
        disabled_opacity: number;
        semantic_colors: {
            error: string;
            success: string;
            warning: string;
        };
    };
    nuance: {
        complexity: number; // -5 (Minimal) to 5 (Detailed)
        weight: number;     // -5 (Light) to 5 (Bold)
        depth: number;      // -5 (Flat) to 5 (Deep)
    };
}

export interface IconGenerationSettings {
    outputFormat: 'svg' | 'png' | 'pdf';
    background: 'transparent' | 'white' | 'colored';
    paletteOverride: string[] | null;
}

export type IconState = 'default' | 'active' | 'hover' | 'disabled' | 'error' | 'success' | 'loading';

export interface IconConcept {
    id: string;
    name: string;
    aliases: string[];
    tags: string[];
    priority: 'critical' | 'standard' | 'low';
    states: IconState[];
    exclusions: string[]; // e.g. "!critical"
    relationships: {
        parent?: string;
        compound_of?: string[];
    };
    definition_string: string; // Raw input like "user + shield"
}

export interface IconAsset {
    id: string;
    conceptId: string;
    state: IconState;
    svgContent: string;
    pngUrl?: string;
    resolution: '16px' | '24px' | '32px' | '64px';
    qualityScore: number;
    driftScore: number;
    issues: string[];
    createdAt: number;
}

export interface GenerationPass {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number; // 0-100
    logs: string[];
}

export type IconStudioTab = 'dna' | 'concepts' | 'pipeline' | 'qa';
