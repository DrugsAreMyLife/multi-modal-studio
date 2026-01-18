'use client';

export interface AudioClip {
  id: string;
  audioBuffer: AudioBuffer | null;
  url: string;
  startTime: number; // in seconds
  duration: number;
  volume: number;
  pan: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  clips: AudioClip[];
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  gainNode?: GainNode;
  panNode?: StereoPannerNode;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private tracks: Map<string, AudioTrack> = new Map();
  private activeNodes: Map<string, AudioBufferSourceNode[]> = new Map();
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private animationFrame: number | null = null;
  private onTimeUpdate?: (time: number) => void;

  async init() {
    if (this.context) return;
    this.context = new AudioContext();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);
  }

  async loadClip(url: string): Promise<AudioBuffer> {
    if (!this.context) await this.init();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.context!.decodeAudioData(arrayBuffer);
  }

  addTrack(track: Omit<AudioTrack, 'gainNode' | 'panNode'>): void {
    if (!this.context || !this.masterGain) return;

    const gainNode = this.context.createGain();
    const panNode = this.context.createStereoPanner();

    gainNode.gain.value = track.muted ? 0 : track.volume / 100;
    panNode.pan.value = track.pan / 100;

    panNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    this.tracks.set(track.id, { ...track, gainNode, panNode });
  }

  updateTrack(trackId: string, updates: Partial<AudioTrack>): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    Object.assign(track, updates);

    if (track.gainNode) {
      track.gainNode.gain.value = track.muted ? 0 : track.volume / 100;
    }
    if (track.panNode && updates.pan !== undefined) {
      track.panNode.pan.value = track.pan / 100;
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = volume / 100;
    }
  }

  play(fromTime = 0): void {
    if (!this.context || this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = this.context.currentTime - fromTime;

    // Schedule all clips
    this.tracks.forEach((track, trackId) => {
      if (track.muted) return;

      const nodes: AudioBufferSourceNode[] = [];
      track.clips.forEach((clip) => {
        if (!clip.audioBuffer || !track.panNode) return;

        const source = this.context!.createBufferSource();
        source.buffer = clip.audioBuffer;
        source.connect(track.panNode);

        const clipStartTime = Math.max(0, clip.startTime - fromTime);
        const offset = Math.max(0, fromTime - clip.startTime);

        if (fromTime < clip.startTime + clip.duration) {
          source.start(this.context!.currentTime + clipStartTime, offset);
          nodes.push(source);
        }
      });
      this.activeNodes.set(trackId, nodes);
    });

    this.startTimeUpdate();
  }

  pause(): void {
    if (!this.context || !this.isPlaying) return;

    this.pauseTime = this.context.currentTime - this.startTime;
    this.stop();
  }

  stop(): void {
    this.isPlaying = false;

    // Stop all active nodes
    this.activeNodes.forEach((nodes) => {
      nodes.forEach((node) => {
        try {
          node.stop();
        } catch {}
      });
    });
    this.activeNodes.clear();

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  getCurrentTime(): number {
    if (!this.context) return 0;
    if (!this.isPlaying) return this.pauseTime;
    return this.context.currentTime - this.startTime;
  }

  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  private startTimeUpdate(): void {
    const update = () => {
      if (!this.isPlaying) return;
      this.onTimeUpdate?.(this.getCurrentTime());
      this.animationFrame = requestAnimationFrame(update);
    };
    update();
  }

  async generateWaveform(audioBuffer: AudioBuffer, width: number): Promise<number[]> {
    const rawData = audioBuffer.getChannelData(0);
    const samples = width;
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }

    // Normalize
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map((n) => n * multiplier);
  }

  dispose(): void {
    this.stop();
    this.context?.close();
    this.context = null;
    this.masterGain = null;
    this.tracks.clear();
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();
