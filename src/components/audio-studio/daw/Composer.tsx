'use client';

import { useDawStore } from '@/lib/store/daw-store';
import { TrackHeader } from './TrackHeader';
import { TimelineGrid } from './TimelineGrid';
import { Mixer } from './Mixer';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Composer() {
  const { tracks, isPlaying, setIsPlaying, addTrack, currentTime, setCurrentTime } = useDawStore();

  const [showMixer, setShowMixer] = useState(false);

  return (
    <div className="bg-background/40 relative flex h-full flex-col overflow-hidden rounded-lg border border-white/5 backdrop-blur-md">
      {/* Toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-white/5 bg-black/20 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)}>
            <SkipBack size={16} />
          </Button>
          <Button
            size="icon"
            className={cn('rounded-full', isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-primary')}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </Button>
          <div className="text-primary ml-2 rounded border border-white/5 bg-black/40 px-3 py-1 font-mono text-xs">
            {new Date(currentTime * 1000).toISOString().substr(14, 5)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addTrack('audio')}
            className="gap-2 text-xs"
          >
            <Plus size={14} /> Add Track
          </Button>
          <Button
            variant={showMixer ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowMixer(!showMixer)}
            className="gap-2 text-xs"
          >
            <Settings2 size={14} /> Mixer
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Track Headers */}
        <div className="bg-background/30 z-10 flex w-64 flex-col border-r border-white/5">
          {tracks.map((track) => (
            <TrackHeader key={track.id} track={track} />
          ))}
          <div className="flex-1 bg-black/10" />
        </div>

        {/* Timeline Grid */}
        <div className="no-scrollbar relative flex-1 overflow-auto bg-black/20">
          <TimelineGrid />
        </div>

        {/* Overlay Mixer */}
        {showMixer && (
          <div className="bg-background/95 animate-in slide-in-from-bottom-10 absolute right-0 bottom-0 left-0 z-20 h-64 border-t border-white/10 shadow-2xl backdrop-blur-xl transition-transform">
            <Mixer onClose={() => setShowMixer(false)} />
          </div>
        )}
      </div>
    </div>
  );
}
