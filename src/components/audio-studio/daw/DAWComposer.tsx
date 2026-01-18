'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Mic } from 'lucide-react';
import { TrackLane } from './TrackLane';
import { Timeline } from './Timeline';
import {
  audioEngine,
  type AudioClip,
  type AudioTrack as AudioEngineTrack,
} from '@/lib/audio/AudioEngine';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'effect';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: Clip[];
}

interface Clip {
  id: string;
  startTime: number;
  duration: number;
  audioUrl?: string;
  color: string;
}

export function DAWComposer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(80);
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: '1',
      name: 'Lead Vocal',
      type: 'audio',
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    },
    {
      id: '2',
      name: 'Background',
      type: 'audio',
      volume: 60,
      pan: -20,
      muted: false,
      solo: false,
      clips: [],
    },
    {
      id: '3',
      name: 'Effects',
      type: 'effect',
      volume: 50,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    },
  ]);

  const engineInitializedRef = useRef(false);

  useEffect(() => {
    const initializeEngine = async () => {
      await audioEngine.init();
      audioEngine.setMasterVolume(masterVolume);

      // Set up time update callback
      audioEngine.setOnTimeUpdate((time) => {
        setCurrentTime(time);
      });

      // Add initial tracks to engine
      tracks.forEach((track) => {
        audioEngine.addTrack({
          id: track.id,
          name: track.name,
          clips: track.clips.map((clip) => ({
            id: clip.id,
            audioBuffer: null,
            url: clip.audioUrl || '',
            startTime: clip.startTime,
            duration: clip.duration,
            volume: track.volume,
            pan: track.pan,
          })),
          volume: track.volume,
          pan: track.pan,
          muted: track.muted,
          solo: track.solo,
        });
      });

      engineInitializedRef.current = true;
    };

    if (!engineInitializedRef.current) {
      initializeEngine();
    }

    return () => {
      // Don't dispose on unmount - could be used elsewhere
    };
  }, []);

  // Update master volume in engine
  useEffect(() => {
    if (engineInitializedRef.current) {
      audioEngine.setMasterVolume(masterVolume);
    }
  }, [masterVolume]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play(currentTime);
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime]);

  const stop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const addTrack = () => {
    const newTrack: Track = {
      id: Date.now().toString(),
      name: `Track ${tracks.length + 1}`,
      type: 'audio',
      volume: 80,
      pan: 0,
      muted: false,
      solo: false,
      clips: [],
    };
    setTracks([...tracks, newTrack]);

    // Add track to audio engine
    audioEngine.addTrack({
      id: newTrack.id,
      name: newTrack.name,
      clips: [],
      volume: newTrack.volume,
      pan: newTrack.pan,
      muted: newTrack.muted,
      solo: newTrack.solo,
    });
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)));

    // Update track in audio engine
    const engineUpdates: Partial<AudioEngineTrack> = {};
    if (updates.volume !== undefined) engineUpdates.volume = updates.volume;
    if (updates.pan !== undefined) engineUpdates.pan = updates.pan;
    if (updates.muted !== undefined) engineUpdates.muted = updates.muted;
    if (updates.solo !== undefined) engineUpdates.solo = updates.solo;

    if (Object.keys(engineUpdates).length > 0) {
      audioEngine.updateTrack(id, engineUpdates);
    }
  };

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="border-b pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Mic size={16} className="text-primary" />
            DAW Composer
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{bpm} BPM</Badge>
            <Badge variant="secondary">{currentTime.toFixed(2)}s</Badge>
          </div>
        </div>
      </CardHeader>

      {/* Transport Controls */}
      <div className="bg-muted/30 flex items-center gap-4 border-b p-3">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => setCurrentTime(0)}>
            <SkipBack size={14} />
          </Button>
          <Button size="sm" variant={isPlaying ? 'default' : 'outline'} onClick={togglePlay}>
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </Button>
          <Button size="sm" variant="outline" onClick={stop}>
            <Square size={14} />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentTime((t) => t + 10)}>
            <SkipForward size={14} />
          </Button>
        </div>

        <div className="flex max-w-xs flex-1 items-center gap-2">
          <Volume2 size={14} className="text-muted-foreground" />
          <Slider
            value={[masterVolume]}
            onValueChange={([v]) => setMasterVolume(v)}
            max={100}
            className="flex-1"
          />
          <span className="text-muted-foreground w-8 text-xs">{masterVolume}%</span>
        </div>

        <Button size="sm" variant="outline" onClick={addTrack}>
          Add Track
        </Button>
      </div>

      {/* Timeline */}
      <Timeline currentTime={currentTime} duration={60} bpm={bpm} />

      {/* Track Lanes */}
      <CardContent className="flex-1 overflow-auto p-0">
        <div className="min-h-full">
          {tracks.map((track) => (
            <TrackLane
              key={track.id}
              track={track}
              currentTime={currentTime}
              onUpdate={(updates) => updateTrack(track.id, updates)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
