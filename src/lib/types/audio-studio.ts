export type AudioGenerationMode = 'speech' | 'music' | 'sfx';

export interface VoiceProfile {
    id: string;
    name: string;
    provider: 'local' | 'cloud' | 'cloned';
    previewUrl?: string;
    tags: string[]; // e.g., "Deep", "Energetic", "British"
}

export interface AudioClip {
    id: string;
    url: string; // Blob URL or remote URL
    waveform: number[]; // Array of heights for visualization
    duration: number;
    prompt: string;
    mode: AudioGenerationMode;
    createdAt: number;
    voiceId?: string;
    settings?: any;
}

export interface AudioStudioState {
    mode: AudioGenerationMode;
    activeClipId: string | null;
    selectedVoiceId: string | null;

    // Generation Parameters
    prompt: string;
    stability: number; // 0-1
    similarity: number; // 0-1

    isPlaying: boolean;
}
