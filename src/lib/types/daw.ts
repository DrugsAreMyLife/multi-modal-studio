export interface TimelineClip {
  id: string;
  trackId: string;
  audioClipId: string; // Reference to the source audio
  startTime: number; // In seconds
  duration: number; // In seconds
  offset: number; // Start offset into the source audio
  name: string;
}

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi';
  volume: number; // 0-1
  pan: number; // -1 to 1
  muted: boolean;
  soloed: boolean;
  color?: string;
}

export interface ProjectState {
  tracks: Track[];
  clips: Record<string, TimelineClip>; // ID -> Clip
  isPlaying: boolean;
  currentTime: number; // In seconds
  zoomLevel: number; // Pixels per second
  loop: boolean;
  loopStart: number;
  loopEnd: number;
}
