'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Volume2, AudioLines } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

export interface AudioVisualizerProps {
  url: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  barWidth?: number;
  gap?: number;
}

export function AudioVisualizer({
  url,
  height = 120,
  waveColor = '#64748b',
  progressColor = '#3b82f6',
  barWidth = 2,
  gap = 3,
}: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      height: height,
      barWidth: barWidth,
      barGap: gap,
      cursorWidth: 1,
      cursorColor: '#ef4444',
      barRadius: 3,
      normalize: true,
      backend: 'WebAudio',
    });

    // Load the audio file
    wavesurfer.current.load(url);

    wavesurfer.current.on('ready', () => {
      setDuration(wavesurfer.current?.getDuration() || 0);
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current?.getCurrentTime() || 0);
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url, height, waveColor, progressColor]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const handleVolumeChange = (vals: number[]) => {
    const newVol = vals[0];
    setVolume(newVol);
    wavesurfer.current?.setVolume(newVol);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="bg-muted/20 flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary rounded-lg p-2">
            <AudioLines size={20} />
          </div>
          <div>
            <h4 className="text-sm font-medium">Audio Track</h4>
            <p className="text-muted-foreground font-mono text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-muted-foreground" />
          <Slider
            value={[volume]}
            max={1}
            step={0.01}
            className="w-24"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>

      <div className="group relative">
        <div ref={containerRef} className="w-full" />

        {/* Overlay Play Button */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className="pointer-events-auto h-12 w-12 rounded-full shadow-lg"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="fill-current" />
            ) : (
              <Play className="fill-current pl-1" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex justify-end p-2">
        <Button variant="ghost" size="sm" className="gap-2 text-xs">
          <Download size={14} />
          Export
        </Button>
      </div>
    </div>
  );
}
