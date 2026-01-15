'use client';

import { useDawStore } from '@/lib/store/daw-store';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface MixerProps {
    onClose: () => void;
}

export function Mixer({ onClose }: MixerProps) {
    const { tracks, setVolume, toggleMute, toggleSolo } = useDawStore();
    const [meterLevels, setMeterLevels] = useState<Record<string, number>>({});

    // Mock Audio Metering Animation
    useEffect(() => {
        const interval = setInterval(() => {
            const newLevels: Record<string, number> = {};
            tracks.forEach(t => {
                newLevels[t.id] = Math.random() * t.volume * 100;
            });
            setMeterLevels(newLevels);
        }, 100);
        return () => clearInterval(interval);
    }, [tracks]);

    return (
        <div className="h-full flex flex-col">
            <div className="h-8 border-b border-white/10 flex items-center justify-between px-4 bg-black/20">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mixer Console</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X size={14} />
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto p-4 flex gap-2">
                {tracks.map(track => (
                    <div key={track.id} className="w-20 bg-black/20 rounded-lg border border-white/5 p-2 flex flex-col items-center gap-2 relative group">
                        {/* Meter */}
                        <div className="w-full flex gap-1 h-32 bg-black/40 rounded overflow-hidden p-1 relative">
                            <div className="w-full flex flex-col-reverse gap-0.5 h-full opacity-30">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={cn("w-full flex-1 rounded-[1px]", i > 9 ? "bg-red-500" : "bg-emerald-500")} />
                                ))}
                            </div>
                            {/* Active Meter */}
                            <div className="absolute bottom-1 left-1 right-1 flex flex-col-reverse gap-0.5" style={{ height: `${meterLevels[track.id] || 0}%`, transition: 'height 0.1s' }}>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className={cn("w-full flex-1 rounded-[1px]", i > 9 ? "bg-red-500" : "bg-emerald-500")} />
                                ))}
                            </div>
                        </div>

                        {/* Fader */}
                        <div className="h-24 py-2">
                            <Slider
                                orientation="vertical"
                                value={[track.volume]}
                                max={1}
                                step={0.01}
                                onValueChange={([v]) => setVolume(track.id, v)}
                                className="h-full"
                            />
                        </div>

                        {/* Controls */}
                        <div className="flex gap-1 w-full justify-center">
                            <button
                                onClick={() => toggleMute(track.id)}
                                className={cn("w-6 h-6 text-[10px] rounded border border-white/10", track.muted ? "bg-red-500 text-white" : "bg-black/40")}
                            >
                                M
                            </button>
                            <button
                                onClick={() => toggleSolo(track.id)}
                                className={cn("w-6 h-6 text-[10px] rounded border border-white/10", track.soloed ? "bg-yellow-500 text-white" : "bg-black/40")}
                            >
                                S
                            </button>
                        </div>

                        <div className="text-[10px] truncate max-w-full font-medium mt-1">{track.name}</div>
                        <div
                            className="absolute top-0 inset-x-0 h-1 rounded-t-lg"
                            style={{ backgroundColor: track.color }}
                        />
                    </div>
                ))}

                {/* Master */}
                <div className="w-24 bg-black/40 rounded-lg border border-white/10 p-2 flex flex-col items-center gap-2 ml-4">
                    <div className="text-[10px] text-muted-foreground uppercase">Master</div>
                    <div className="flex-1 w-full bg-black/40 rounded relative">
                        {/* Simple Master Meter */}
                    </div>
                    <Slider orientation="vertical" defaultValue={[0.9]} max={1} step={0.01} className="h-24" />
                </div>
            </div>
        </div>
    );
}
