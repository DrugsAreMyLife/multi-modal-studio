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
    <div className="relative flex h-full min-w-full flex-col" ref={containerRef}>
      {/* Time Ruler */}
      <div className="bg-background/50 sticky top-0 z-20 flex h-6 border-b border-white/5">
        {markers.map((sec) => (
          <div
            key={sec}
            className="text-muted-foreground flex-shrink-0 border-l border-white/10 pl-1 text-[10px] select-none"
            style={{ width: `${zoomLevel}px` }}
          >
            {sec}s
          </div>
        ))}
      </div>

      {/* Playhead */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 z-30 w-px bg-red-500"
        style={{ left: `${currentTime * zoomLevel}px` }}
      >
        <div className="-mt-1.5 -ml-1.5 h-3 w-3 rotate-45 transform bg-red-500" />
      </div>

      {/* Tracks */}
      <div className="relative flex-1">
        {tracks.map((track) => {
          const trackClips = Object.values(clips).filter((c) => c.trackId === track.id);

          return (
            <div key={track.id} className="relative h-24 border-b border-white/5 bg-white/[0.02]">
              {/* Grid Lines */}
              <div className="pointer-events-none absolute inset-0 flex">
                {markers.map((sec) => (
                  <div
                    key={sec}
                    className="h-full flex-shrink-0 border-l border-white/5"
                    style={{ width: `${zoomLevel}px` }}
                  />
                ))}
              </div>

              {/* Clips */}
              {trackClips.map((clip) => (
                <motion.div
                  key={clip.id}
                  className="absolute top-2 bottom-2 cursor-move overflow-hidden rounded-md border border-white/10"
                  style={{
                    left: clip.startTime * zoomLevel,
                    width: clip.duration * zoomLevel,
                    backgroundColor: `${track.color}40`, // 25% opacity
                    borderColor: track.color,
                  }}
                  drag="x"
                  dragMomentum={false}
                  whileHover={{ scale: 1.02, zIndex: 10 }}
                  whileTap={{ cursor: 'grabbing' }}
                >
                  <div className="flex h-full w-full flex-col justify-center p-2">
                    <span className="truncate text-xs font-medium text-white drop-shadow-md">
                      {clip.name}
                    </span>
                    {/* Fake Waveform */}
                    <div className="mt-1 flex h-4 items-center gap-px opacity-60">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-white/50"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
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
