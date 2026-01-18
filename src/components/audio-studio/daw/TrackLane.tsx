'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Headphones } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'effect';
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: any[];
}

interface TrackLaneProps {
  track: Track;
  currentTime: number;
  onUpdate: (updates: Partial<Track>) => void;
}

export function TrackLane({ track, currentTime, onUpdate }: TrackLaneProps) {
  return (
    <div className="border-border hover:bg-muted/20 flex border-b transition-colors">
      {/* Track Controls */}
      <div className="bg-card flex w-48 shrink-0 flex-col gap-2 border-r p-2">
        <div className="truncate text-sm font-medium">{track.name}</div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={track.muted ? 'destructive' : 'ghost'}
            className="h-6 w-6"
            onClick={() => onUpdate({ muted: !track.muted })}
          >
            {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </Button>
          <Button
            size="icon"
            variant={track.solo ? 'default' : 'ghost'}
            className="h-6 w-6"
            onClick={() => onUpdate({ solo: !track.solo })}
          >
            <Headphones size={12} />
          </Button>
          <Slider
            value={[track.volume]}
            onValueChange={([v]) => onUpdate({ volume: v })}
            max={100}
            className="flex-1"
            disabled={track.muted}
          />
        </div>
      </div>

      {/* Clip Area */}
      <div className="bg-muted/10 relative h-16 flex-1">
        {/* Playhead indicator */}
        <div
          className="bg-primary absolute top-0 bottom-0 z-10 w-px"
          style={{ left: `${(currentTime / 60) * 100}%` }}
        />
        {/* Clips would render here */}
        {track.clips.map((clip, i) => (
          <div
            key={i}
            className="bg-primary/30 border-primary/50 absolute top-1 bottom-1 rounded border"
            style={{
              left: `${(clip.startTime / 60) * 100}%`,
              width: `${(clip.duration / 60) * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
