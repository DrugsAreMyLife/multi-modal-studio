export type AudioGenerationMode = 'speech' | 'music' | 'sfx';

// Qwen3-TTS specific modes
export type QwenTTSMode = 'custom' | 'clone' | 'design' | 'train';

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

// Voice cloning reference audio
export interface VoiceCloneRef {
  audioUrl: string; // Blob URL or uploaded file URL
  audioFile?: File; // Original file for upload
  transcript: string; // Text transcript of the reference audio
  duration?: number; // Duration in seconds (minimum 3s recommended)
}

// Voice training job
export interface VoiceTrainingJob {
  id: string;
  name: string; // Custom voice name
  status: 'pending' | 'uploading' | 'training' | 'completed' | 'failed';
  progress: number; // 0-100
  datasetSize: number; // Number of audio samples
  createdAt: number;
  completedAt?: number;
  modelPath?: string; // Path to trained LoRA
  error?: string;
}

// Training dataset sample
export interface TrainingSample {
  id: string;
  audioFile: File;
  audioUrl: string; // Blob URL for preview
  transcript: string;
  duration: number;
  validated: boolean;
}

export interface AudioStudioState {
  mode: AudioGenerationMode;
  activeClipId: string | null;
  voices: VoiceProfile[]; // [NEW] Dynamic voice list
  selectedVoiceId: string | null;

  // Generation Parameters
  prompt: string;
  stability: number; // 0-1
  similarity: number; // 0-1

  isPlaying: boolean;

  // Qwen3-TTS specific state
  qwenMode: QwenTTSMode;

  // Voice Clone state
  cloneRef: VoiceCloneRef | null;
  xVectorOnlyMode: boolean; // Faster but lower quality cloning

  // Voice Design state
  voiceDescription: string; // Natural language description for voice design

  // Custom Voice state
  styleInstruction: string; // e.g., "very angry tone", "whisper softly"
  selectedLanguage: string; // Target language for generation

  // Training state
  trainingSamples: TrainingSample[];
  activeTrainingJob: VoiceTrainingJob | null;
  trainedVoices: VoiceProfile[]; // User's trained LoRA voices
}
