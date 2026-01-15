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
            className="h-24 border-b border-white/5 p-3 flex flex-col gap-2 relative group bg-background/40 hover:bg-background/60 transition-colors"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-1 h-full absolute left-0 top-0 bottom-0"
                    style={{ backgroundColor: track.color }}
                />
                <div className="p-1.5 rounded bg-white/5 text-muted-foreground">
                    {track.type === 'audio' ? <Mic size={14} /> : <Music size={14} />}
                </div>
                <input
                    className="bg-transparent text-sm font-medium w-full focus:outline-none focus:bg-white/5 rounded px-1"
                    value={track.name}
                    onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeTrack(track.id)}
                >
                    <div className="text-[10px]">✕</div>
                </Button>
            </div>

            <div className="flex items-center gap-2 mt-auto">
                <div className="flex gap-1">
                    <button
                        onClick={() => toggleMute(track.id)}
                        className={cn(
                            "w-6 h-6 rounded text-[10px] font-bold border border-white/10 transition-colors",
                            track.muted ? "bg-red-500/20 text-red-500 border-red-500/50" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        M
                    </button>
                    <button
                        onClick={() => toggleSolo(track.id)}
                        className={cn(
                            "w-6 h-6 rounded text-[10px] font-bold border border-white/10 transition-colors",
                            track.soloed ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : "bg-black/20 text-muted-foreground hover:bg-white/5"
                        )}
                    >
                        S
                    </button>
                </div>

                <div className="flex-1 flex items-center gap-2">
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
