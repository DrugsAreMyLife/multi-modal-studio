'use client';

import { Track } from '@/lib/types/daw';
import { useDawStore } from '@/lib/store/daw-store';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Mic, Music, Volume2, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TrackHeaderProps {
  track: Track;
}

export function TrackHeader({ track }: TrackHeaderProps) {
  const { toggleMute, toggleSolo, setVolume, updateTrack, removeTrack } = useDawStore();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-background/40 hover:bg-background/60 relative flex h-24 flex-col gap-2 border-b border-white/5 p-3 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2">
        <div
          className="absolute top-0 bottom-0 left-0 h-full w-1"
          style={{ backgroundColor: track.color }}
        />
        <div className="text-muted-foreground rounded bg-white/5 p-1.5">
          {track.type === 'audio' ? <Mic size={14} /> : <Music size={14} />}
        </div>
        <input
          className="w-full rounded bg-transparent px-1 text-sm font-medium focus:bg-white/5 focus:outline-none"
          value={track.name}
          onChange={(e) => updateTrack(track.id, { name: e.target.value })}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => removeTrack(track.id)}
        >
          <div className="text-[10px]">✕</div>
        </Button>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => toggleMute(track.id)}
            className={cn(
              'h-6 w-6 rounded border border-white/10 text-[10px] font-bold transition-colors',
              track.muted
                ? 'border-red-500/50 bg-red-500/20 text-red-500'
                : 'text-muted-foreground bg-black/20 hover:bg-white/5',
            )}
          >
            M
          </button>
          <button
            onClick={() => toggleSolo(track.id)}
            className={cn(
              'h-6 w-6 rounded border border-white/10 text-[10px] font-bold transition-colors',
              track.soloed
                ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-500'
                : 'text-muted-foreground bg-black/20 hover:bg-white/5',
            )}
          >
            S
          </button>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <Volume2 size={12} className="text-muted-foreground" />
          <Slider
            value={[track.volume]}
            max={1}
            step={0.01}
            onValueChange={([v]) => setVolume(track.id, v)}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
