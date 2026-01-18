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
      tracks.forEach((t) => {
        newLevels[t.id] = Math.random() * t.volume * 100;
      });
      setMeterLevels(newLevels);
    }, 100);
    return () => clearInterval(interval);
  }, [tracks]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 items-center justify-between border-b border-white/10 bg-black/20 px-4">
        <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
          Mixer Console
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      <div className="flex flex-1 gap-2 overflow-x-auto p-4">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="group relative flex w-20 flex-col items-center gap-2 rounded-lg border border-white/5 bg-black/20 p-2"
          >
            {/* Meter */}
            <div className="relative flex h-32 w-full gap-1 overflow-hidden rounded bg-black/40 p-1">
              <div className="flex h-full w-full flex-col-reverse gap-0.5 opacity-30">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-full flex-1 rounded-[1px]',
                      i > 9 ? 'bg-red-500' : 'bg-emerald-500',
                    )}
                  />
                ))}
              </div>
              {/* Active Meter */}
              <div
                className="absolute right-1 bottom-1 left-1 flex flex-col-reverse gap-0.5"
                style={{ height: `${meterLevels[track.id] || 0}%`, transition: 'height 0.1s' }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-full flex-1 rounded-[1px]',
                      i > 9 ? 'bg-red-500' : 'bg-emerald-500',
                    )}
                  />
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
            <div className="flex w-full justify-center gap-1">
              <button
                onClick={() => toggleMute(track.id)}
                className={cn(
                  'h-6 w-6 rounded border border-white/10 text-[10px]',
                  track.muted ? 'bg-red-500 text-white' : 'bg-black/40',
                )}
              >
                M
              </button>
              <button
                onClick={() => toggleSolo(track.id)}
                className={cn(
                  'h-6 w-6 rounded border border-white/10 text-[10px]',
                  track.soloed ? 'bg-yellow-500 text-white' : 'bg-black/40',
                )}
              >
                S
              </button>
            </div>

            <div className="mt-1 max-w-full truncate text-[10px] font-medium">{track.name}</div>
            <div
              className="absolute inset-x-0 top-0 h-1 rounded-t-lg"
              style={{ backgroundColor: track.color }}
            />
          </div>
        ))}

        {/* Master */}
        <div className="ml-4 flex w-24 flex-col items-center gap-2 rounded-lg border border-white/10 bg-black/40 p-2">
          <div className="text-muted-foreground text-[10px] uppercase">Master</div>
          <div className="relative w-full flex-1 rounded bg-black/40">
            {/* Simple Master Meter */}
          </div>
          <Slider
            orientation="vertical"
            defaultValue={[0.9]}
            max={1}
            step={0.01}
            className="h-24"
          />
        </div>
      </div>
    </div>
  );
}
