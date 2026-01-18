'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface WaveformDisplayProps {
  data: number[];
  progress?: number; // 0-1 for playback position
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function WaveformDisplay({
  data,
  progress = 0,
  color = 'hsl(var(--primary))',
  backgroundColor = 'hsl(var(--muted))',
  className,
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerY = height / 2;
    const barWidth = Math.max(2, width / data.length - 1);
    const gap = 1;

    ctx.clearRect(0, 0, width, height);

    data.forEach((value, i) => {
      const x = (i / data.length) * width;
      const barHeight = value * (height * 0.8);
      const y = centerY - barHeight / 2;

      // Determine if this bar is before or after playback position
      const isPlayed = i / data.length <= progress;

      ctx.fillStyle = isPlayed ? color : backgroundColor;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Draw playhead
    if (progress > 0 && progress < 1) {
      ctx.fillStyle = color;
      ctx.fillRect(progress * width - 1, 0, 2, height);
    }
  }, [data, progress, color, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('h-full w-full', className)}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// Generate mock waveform data for preview
export function generateMockWaveform(length = 100): number[] {
  return Array.from({ length }, () => Math.random() * 0.5 + 0.25);
}
