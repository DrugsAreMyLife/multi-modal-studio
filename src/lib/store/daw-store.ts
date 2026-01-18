import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectState, Track, TimelineClip } from '@/lib/types/daw';
import { v4 as uuidv4 } from 'uuid';

interface DawStore extends ProjectState {
  // Actions
  addTrack: (type?: 'audio' | 'midi') => string;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;

  addClip: (
    trackId: string,
    audioClipId: string,
    name: string,
    duration: number,
    startTime: number,
  ) => void;
  moveClip: (clipId: string, startTime: number, trackId?: string) => void;
  removeClip: (clipId: string) => void;

  setVolume: (trackId: string, volume: number) => void;
  setPan: (trackId: string, pan: number) => void;
  toggleMute: (trackId: string) => void;
  toggleSolo: (trackId: string) => void;

  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setZoom: (zoom: number) => void;
}

export const useDawStore = create<DawStore>()(
  persist(
    (set, get) => ({
      tracks: [
        {
          id: 't1',
          name: 'Vocals',
          type: 'audio',
          volume: 0.8,
          pan: 0,
          muted: false,
          soloed: false,
          color: '#ec4899',
        },
        {
          id: 't2',
          name: 'Drums',
          type: 'audio',
          volume: 0.7,
          pan: 0,
          muted: false,
          soloed: false,
          color: '#3b82f6',
        },
        {
          id: 't3',
          name: 'Synth',
          type: 'audio',
          volume: 0.6,
          pan: 0,
          muted: false,
          soloed: false,
          color: '#a855f7',
        },
        {
          id: 't4',
          name: 'Bass',
          type: 'audio',
          volume: 0.75,
          pan: 0,
          muted: false,
          soloed: false,
          color: '#eab308',
        },
      ],
      clips: {},
      isPlaying: false,
      currentTime: 0,
      zoomLevel: 50, // 50px per second
      loop: false,
      loopStart: 0,
      loopEnd: 16,

      addTrack: (type = 'audio') => {
        const id = uuidv4();
        const newTrack: Track = {
          id,
          name: `Track ${get().tracks.length + 1}`,
          type,
          volume: 0.8,
          pan: 0,
          muted: false,
          soloed: false,
          color: '#8b5cf6',
        };
        set((state) => ({ tracks: [...state.tracks, newTrack] }));
        return id;
      },

      removeTrack: (id) =>
        set((state) => ({
          tracks: state.tracks.filter((t) => t.id !== id),
          clips: Object.fromEntries(
            Object.entries(state.clips).filter(([_, c]) => c.trackId !== id),
          ),
        })),

      updateTrack: (id, updates) =>
        set((state) => ({
          tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      addClip: (trackId, audioClipId, name, duration, startTime) => {
        const id = uuidv4();
        const newClip: TimelineClip = {
          id,
          trackId,
          audioClipId,
          name,
          duration,
          startTime,
          offset: 0,
        };
        set((state) => ({ clips: { ...state.clips, [id]: newClip } }));
      },

      moveClip: (clipId, startTime, trackId) =>
        set((state) => {
          const clip = state.clips[clipId];
          if (!clip) return state;
          return {
            clips: {
              ...state.clips,
              [clipId]: {
                ...clip,
                startTime: Math.max(0, startTime),
                trackId: trackId || clip.trackId,
              },
            },
          };
        }),

      removeClip: (clipId) =>
        set((state) => {
          const { [clipId]: removed, ...rest } = state.clips;
          return { clips: rest };
        }),

      setVolume: (trackId, volume) => get().updateTrack(trackId, { volume }),
      setPan: (trackId, pan) => get().updateTrack(trackId, { pan }),
      toggleMute: (trackId) => {
        const track = get().tracks.find((t) => t.id === trackId);
        if (track) get().updateTrack(trackId, { muted: !track.muted });
      },
      toggleSolo: (trackId) => {
        const track = get().tracks.find((t) => t.id === trackId);
        if (track) get().updateTrack(trackId, { soloed: !track.soloed });
      },

      setIsPlaying: (playing) => set({ isPlaying: playing }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setZoom: (zoom) => set({ zoomLevel: zoom }),
    }),
    {
      name: 'daw-project-storage',
    },
  ),
);
