'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export function Timeline() {
    const { clips, currentTime, setCurrentTime } = useVideoStudioStore();
    const duration = Math.max(10, ...clips.map(c => c.startOffset + c.duration));

    return (
        <div className="h-48 border-t border-border bg-background/80 backdrop-blur-md flex flex-col">
            {/* Controls */}
            <div className="h-10 flex items-center justify-between px-4 border-b border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-xs font-mono">{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><SkipBack size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><Play size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><SkipForward size={14} /></Button>
                </div>
                <div className="w-20" /> {/* Spacer */}
            </div>

            {/* Tracks Area */}
            <div className="flex-1 relative p-4 overflow-x-auto">
                {/* Time Ruler */}
                <div className="absolute top-0 left-4 right-4 h-6 flex items-center border-b border-white/5">
                    {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
                        <div key={i} className="flex-1 border-l border-white/5 h-full text-[10px] text-muted-foreground pl-1">
                            {i}s
                        </div>
                    ))}
                </div>

                {/* Scrubber Line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                />

                {/* Tracks */}
                <div className="mt-8 space-y-2">
                    {/* Video Track */}
                    <div className="h-12 bg-muted/10 rounded-lg relative overflow-hidden">
                        {clips.map(clip => (
                            <div
                                key={clip.id}
                                className="absolute top-1 bottom-1 bg-primary/20 border border-primary/50 rounded flex items-center justify-center p-2 text-xs truncate"
                                style={{
                                    left: `${(clip.startOffset / duration) * 100}%`,
                                    width: `${(clip.duration / duration) * 100}%`
                                }}
                            >
                                {clip.prompt}
                            </div>
                        ))}
                    </div>

                    {/* Audio Track (Mock) */}
                    <div className="h-8 bg-muted/5 rounded-lg border-2 border-dashed border-muted/20 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">Audio Track (Drag Audio Here)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
