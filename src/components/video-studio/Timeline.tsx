'use client';

import { useVideoStudioStore } from '@/lib/store/video-studio-store';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, GripVertical } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Timeline() {
  const { clips, currentTime, setCurrentTime } = useVideoStudioStore();
  const duration = Math.max(10, ...clips.map((c) => c.startOffset + c.duration));

  const [isPlaying, setIsPlaying] = useState(false);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(currentTime);

  // Playback Loop
  const animate = useCallback(
    (time: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = time;
      }

      // Calculate delta to advance time smoothly
      // In a real app we'd sync this to audio context or video element
      const delta = (time - (startTimeRef.current || time)) / 1000;

      // But since we just want to advance start time from "last play position":
      // Actually standard loop:
      // currentTime = startTime + (now - loopStart)

      // Simplified incremental approach for this mock timeline:
      setCurrentTime(Math.min(lastTimeRef.current + 0.016, duration));
      lastTimeRef.current = Math.min(lastTimeRef.current + 0.016, duration);

      if (lastTimeRef.current >= duration) {
        setIsPlaying(false);
        return;
      }

      requestRef.current = requestAnimationFrame(animate);
    },
    [duration, setCurrentTime],
  );

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = undefined;
      lastTimeRef.current = currentTime;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, animate]); // Dependency on currentTime handled via ref to avoid re-triggering

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    setCurrentTime(newTime);
    lastTimeRef.current = newTime;
  };

  return (
    <div className="border-border bg-background/80 flex h-52 flex-col border-t backdrop-blur-md select-none">
      {/* Controls */}
      <div className="border-border/50 flex h-12 items-center justify-between border-b bg-zinc-900/50 px-4">
        <div className="text-muted-foreground flex items-center gap-4">
          <span className="text-primary font-mono text-xs font-semibold">
            {currentTime.toFixed(2)}s
          </span>
          <span className="font-mono text-xs opacity-50">/ {duration.toFixed(2)}s</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/10"
            onClick={() => {
              setCurrentTime(0);
              lastTimeRef.current = 0;
            }}
          >
            <SkipBack size={16} />
          </Button>
          <Button
            variant="default"
            size="icon"
            className="shadow-primary/20 bg-primary hover:bg-primary/90 h-10 w-10 rounded-full shadow-lg"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause size={18} className="fill-current" />
            ) : (
              <Play size={18} className="ml-0.5 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/10"
            onClick={() => {
              setCurrentTime(duration);
              lastTimeRef.current = duration;
            }}
          >
            <SkipForward size={16} />
          </Button>
        </div>

        <div className="text-muted-foreground w-24 text-right text-[10px] font-medium tracking-widest uppercase">
          Timeline
        </div>
      </div>

      {/* Tracks Area */}
      <div className="group relative flex-1 overflow-hidden p-4" onClick={handleScrub}>
        {/* Time Ruler */}
        <div className="pointer-events-none absolute top-0 right-4 left-4 flex h-6 items-end border-b border-white/5">
          {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="text-muted-foreground absolute -ml-px flex h-2 items-start border-l border-white/20 pt-3 pl-1 text-[9px]"
              style={{ left: `${(i / duration) * 100}%` }}
            >
              {i % 2 === 0 ? (
                <span className="-mt-4 -ml-1 block">{i}s</span>
              ) : (
                <div className="h-1" />
              )}
            </div>
          ))}
        </div>

        {/* Scrubber Line */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-50 w-px bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-75"
          style={{ left: `calc(${(currentTime / duration) * 100}% + 16px)` }} // 16px padding offset calculation is tricky, simplifying:
        >
          <div className="absolute -top-1 -left-1.5 h-3 w-3 rotate-45 transform rounded-[1px] bg-red-500" />
        </div>
        {/* Correct alignment wrapper for scrubber matching track padding */}
        <div className="pointer-events-none absolute inset-x-4 top-0 bottom-0">
          <div
            className="absolute top-0 bottom-0 z-20 w-px bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-0 -left-1.5 h-0 w-0 border-t-[8px] border-r-[6px] border-l-[6px] border-t-red-500 border-r-transparent border-l-transparent" />
          </div>
        </div>

        {/* Tracks Container */}
        <div className="relative z-10 mx-4 mt-8 space-y-3">
          {/* Video Track */}
          <div className="relative h-14 overflow-hidden rounded-lg border border-white/5 bg-zinc-900/50 ring-1 ring-white/5">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            {clips.map((clip) => (
              <motion.div
                key={clip.id}
                layoutId={clip.id}
                className="group/clip absolute top-1 bottom-1 flex cursor-grab items-center justify-center overflow-hidden rounded-md border border-blue-500/30 bg-gradient-to-br from-blue-900/50 to-purple-900/50 shadow-sm active:cursor-grabbing"
                style={{
                  left: `${(clip.startOffset / duration) * 100}%`,
                  width: `${(clip.duration / duration) * 100}%`,
                }}
              >
                <div className="absolute top-1/2 left-1 -translate-y-1/2 opacity-0 group-hover/clip:opacity-50">
                  <GripVertical size={12} />
                </div>
                <div className="w-full truncate px-3 text-center text-xs font-medium text-blue-100">
                  {clip.prompt}
                </div>
                {/* Trim Handles Mock */}
                <div className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize bg-white/20 opacity-0 transition-all group-hover/clip:opacity-100 hover:bg-white/50" />
                <div className="absolute top-0 right-0 bottom-0 w-1 cursor-e-resize bg-white/20 opacity-0 transition-all group-hover/clip:opacity-100 hover:bg-white/50" />
              </motion.div>
            ))}
            {clips.length === 0 && (
              <div className="text-muted-foreground/30 flex h-full w-full items-center justify-center text-xs italic">
                No clips generated yet
              </div>
            )}
          </div>

          {/* Audio Track (Mock) */}
          <div className="group/audio relative flex h-10 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/5 bg-zinc-900/30 transition-colors hover:bg-zinc-900/50">
            <span className="text-muted-foreground/50 group-hover/audio:text-muted-foreground text-[10px] font-semibold tracking-wider uppercase transition-colors">
              Drop Audio / Music
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
