'use client';

import { useDawStore } from '@/lib/store/daw-store';
import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export function TimelineGrid() {
    const { tracks, clips, zoomLevel, currentTime } = useDawStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Mock timeline markers
    const markers = Array.from({ length: 20 }, (_, i) => i); // 0-20 seconds

    return (
        <div className="min-w-full h-full flex flex-col relative" ref={containerRef}>
            {/* Time Ruler */}
            <div className="h-6 border-b border-white/5 bg-background/50 sticky top-0 z-20 flex">
                {markers.map(sec => (
                    <div
                        key={sec}
                        className="flex-shrink-0 border-l border-white/10 text-[10px] text-muted-foreground pl-1 select-none"
                        style={{ width: `${zoomLevel}px` }}
                    >
                        {sec}s
                    </div>
                ))}
            </div>

            {/* Playhead */}
            <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                style={{ left: `${currentTime * zoomLevel}px` }}
            >
                <div className="w-3 h-3 -ml-1.5 bg-red-500 transform rotate-45 -mt-1.5" />
            </div>

            {/* Tracks */}
            <div className="flex-1 relative">
                {tracks.map(track => {
                    const trackClips = Object.values(clips).filter(c => c.trackId === track.id);

                    return (
                        <div key={track.id} className="h-24 border-b border-white/5 relative bg-white/[0.02]">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {markers.map(sec => (
                                    <div
                                        key={sec}
                                        className="flex-shrink-0 border-l border-white/5 h-full"
                                        style={{ width: `${zoomLevel}px` }}
                                    />
                                ))}
                            </div>

                            {/* Clips */}
                            {trackClips.map(clip => (
                                <motion.div
                                    key={clip.id}
                                    className="absolute top-2 bottom-2 rounded-md overflow-hidden border border-white/10 cursor-move"
                                    style={{
                                        left: clip.startTime * zoomLevel,
                                        width: clip.duration * zoomLevel,
                                        backgroundColor: `${track.color}40`, // 25% opacity
                                        borderColor: track.color
                                    }}
                                    drag="x"
                                    dragMomentum={false}
                                    whileHover={{ scale: 1.02, zIndex: 10 }}
                                    whileTap={{ cursor: "grabbing" }}
                                >
                                    <div className="h-full w-full p-2 flex flex-col justify-center">
                                        <span className="text-xs font-medium truncate text-white drop-shadow-md">{clip.name}</span>
                                        {/* Fake Waveform */}
                                        <div className="flex items-center gap-px mt-1 opacity-60 h-4">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <div key={i} className="flex-1 bg-white/50" style={{ height: `${Math.random() * 100}%` }} />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    );
                })}


            </div>
        </div>
    );
}
