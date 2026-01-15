'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Play, Pause, Plus, Settings2, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for initial tracks
const INITIAL_TRACKS = [
    { id: 't1', name: 'Main Video', type: 'video', clips: [{ id: 'c1', start: 0, duration: 10, name: 'Scene 1.mp4', color: 'bg-blue-500' }] },
    { id: 't2', name: 'Overlay', type: 'video', clips: [{ id: 'c2', start: 5, duration: 3, name: 'Logo_Anim.mov', color: 'bg-purple-500' }] },
    { id: 't3', name: 'Audio', type: 'audio', clips: [{ id: 'c3', start: 0, duration: 15, name: 'Background.mp3', color: 'bg-emerald-500' }] },
];

export function Timeline() {
    const [tracks, setTracks] = useState(INITIAL_TRACKS);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoom, setZoom] = useState(20); // pixels per second
    const duration = 30; // seconds

    const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - bounds.left;
        const time = Math.max(0, x / zoom);
        setCurrentTime(time);
    };

    return (
        <div className="flex flex-col h-full bg-background border-t">
            {/* Toolbar */}
            <div className="h-10 border-b flex items-center px-4 justify-between bg-muted/40 text-xs">
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-6 w-6"><Play size={12} /></Button>
                    <span className="font-mono">{currentTime.toFixed(2)}s</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-6 w-6"><Scissors size={12} /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6"><Settings2 size={12} /></Button>
                    <div className="flex items-center gap-1 ml-2">
                        <span className="text-muted-foreground">-</span>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-20"
                        />
                        <span className="text-muted-foreground">+</span>
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Track Headers */}
                <div className="w-48 border-r bg-muted/20 flex flex-col pt-6">
                    {tracks.map(track => (
                        <div key={track.id} className="h-16 border-b px-4 flex items-center justify-between text-sm font-medium group hover:bg-muted/50">
                            <span>{track.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button size="icon" variant="ghost" className="h-5 w-5"><Settings2 size={10} /></Button>
                            </div>
                        </div>
                    ))}
                    <div className="h-12 flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs"><Plus size={12} className="mr-1" /> Add Track</Button>
                    </div>
                </div>

                {/* Track Content */}
                <div className="flex-1 overflow-x-auto relative" onMouseDown={handleScrub}>
                    {/* Time Ruler */}
                    <div className="h-6 border-b bg-muted/10 sticky top-0 z-10 min-w-full" style={{ width: duration * zoom }}>
                        {Array.from({ length: duration }).map((_, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-l border-border/50 text-[10px] pl-1 text-muted-foreground select-none" style={{ left: i * zoom }}>
                                {i}s
                            </div>
                        ))}
                    </div>

                    {/* Tracks */}
                    <div className="min-w-full" style={{ width: duration * zoom }}>
                        {tracks.map(track => (
                            <div key={track.id} className="h-16 border-b relative group bg-background/50">
                                {/* Grid lines */}
                                {Array.from({ length: duration }).map((_, i) => (
                                    <div key={i} className="absolute top-0 bottom-0 border-l border-border/10" style={{ left: i * zoom }} />
                                ))}

                                {track.clips.map(clip => (
                                    <motion.div
                                        key={clip.id}
                                        drag="x"
                                        dragMomentum={false}
                                        dragConstraints={{ left: 0, right: (duration - clip.duration) * zoom }}
                                        className={cn(
                                            "absolute top-2 bottom-2 rounded-md border border-white/10 shadow-sm flex items-center px-2 text-xs text-white overflow-hidden cursor-grab active:cursor-grabbing",
                                            clip.color
                                        )}
                                        style={{
                                            left: clip.start * zoom,
                                            width: clip.duration * zoom
                                        }}
                                    >
                                        <span className="truncate drop-shadow-md">{clip.name}</span>
                                        {/* Resize Handles */}
                                        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize hover:bg-white/20" />
                                        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-white/20" />
                                    </motion.div>
                                ))}
                            </div>
                        ))}

                        {/* Playhead */}
                        <div
                            className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-20 pointer-events-none"
                            style={{ left: currentTime * zoom }}
                        >
                            <div className="w-3 h-3 -ml-1.5 bg-red-500 transform rotate-45 -mt-1.5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
