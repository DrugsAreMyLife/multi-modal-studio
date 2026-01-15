export interface VideoClip {
    id: string;
    src?: string; // URL if generated
    thumbnail?: string;
    duration: number; // in seconds
    startOffset: number; // position on timeline
    prompt: string;
}

export interface CameraParams {
    pan: { x: number; y: number }; // -1 to 1
    zoom: number; // -1 (zoom out) to 1 (zoom in)
    tilt: number; // -1 to 1
    roll: number; // -1 to 1
}

export interface VideoState {
    clips: VideoClip[];
    currentTime: number; // Playhead position in seconds
    selectedClipId: string | null;

    // Generation Settings for the next shot
    startFrame: string | null; // Image ID or URL
    endFrame: string | null;
    camera: CameraParams;
    duration: number; // Target duration for generation
    tunes: VideoTunes; // Fine tuning
    seed: number;
    loopMode: boolean;
    interpolate: boolean;
    selectedModelId: string;
}

export interface VideoTunes {
    stability: number; // -5 to 5
    amplitude: number; // -5 to 5
    coherence: number; // -5 to 5
}
