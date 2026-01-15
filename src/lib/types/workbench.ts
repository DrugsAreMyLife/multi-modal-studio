export type MediaType = 'image' | 'video' | 'audio' | 'text';

export interface Asset {
    id: string;
    type: MediaType;
    url: string; // Blob URL or remote URL
    aspectRatio?: string;
    createdAt: number;
}

export interface GenerationRun {
    id: string;
    prompt: string;
    modelId: string;
    timestamp: number;
    assets: Asset[]; // The outputs (e.g. 4 images)

    // Lineage
    parentId?: string;
    branchType?: 'variation' | 'edit' | 'expand' | 'remix';

    // UI State
    isPinned?: boolean;
    tags?: string[];

    // Params snapshot
    params?: Record<string, any>;
}

export interface WorkbenchState {
    runs: Record<string, GenerationRun>;
    pinnedIds: string[];
    filter: {
        query: string;
        type?: MediaType;
    };
}
