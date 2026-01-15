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
    const {
        tracks,
        isPlaying,
        setIsPlaying,
        addTrack,
        currentTime,
        setCurrentTime
    } = useDawStore();

    const [showMixer, setShowMixer] = useState(false);

    return (
        <div className="flex flex-col h-full bg-background/40 backdrop-blur-md border border-white/5 rounded-lg overflow-hidden relative">
            {/* Toolbar */}
            <div className="h-12 border-b border-white/5 px-4 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)}>
                        <SkipBack size={16} />
                    </Button>
                    <Button
                        size="icon"
                        className={cn("rounded-full", isPlaying ? "bg-red-500 hover:bg-red-600" : "bg-primary")}
                        onClick={() => setIsPlaying(!isPlaying)}
                    >
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                    </Button>
                    <div className="bg-black/40 px-3 py-1 rounded font-mono text-xs text-primary ml-2 border border-white/5">
                        {new Date(currentTime * 1000).toISOString().substr(14, 5)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => addTrack('audio')} className="gap-2 text-xs">
                        <Plus size={14} /> Add Track
                    </Button>
                    <Button
                        variant={showMixer ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setShowMixer(!showMixer)}
                        className="gap-2 text-xs"
                    >
                        <Settings2 size={14} /> Mixer
                    </Button>
                </div>
            </div>

            {/* Timeline View */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Track Headers */}
                <div className="w-64 border-r border-white/5 bg-background/30 flex flex-col z-10">
                    {tracks.map(track => (
                        <TrackHeader key={track.id} track={track} />
                    ))}
                    <div className="flex-1 bg-black/10" />
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 overflow-auto bg-black/20 relative no-scrollbar">
                    <TimelineGrid />
                </div>

                {/* Overlay Mixer */}
                {showMixer && (
                    <div className="absolute bottom-0 left-0 right-0 h-64 border-t border-white/10 bg-background/95 backdrop-blur-xl z-20 shadow-2xl transition-transform animate-in slide-in-from-bottom-10">
                        <Mixer onClose={() => setShowMixer(false)} />
                    </div>
                )}
            </div>
        </div>
    );
}
