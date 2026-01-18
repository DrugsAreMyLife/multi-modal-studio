'use client';

import { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  isPlaying: boolean;
}

export function WaveformCanvas({ isPlaying }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const render = () => {
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw baseline
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.stroke();

      // Draw waveform bars
      const bars = 50;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        // Mock dynamic data
        const t = performance.now() / 200; // Speed
        const noise = isPlaying ? Math.sin(i * 0.5 + t) * Math.cos(i * 0.2 + offset) : 0.1;
        const h = isPlaying ? Math.abs(noise) * (height * 0.8) : 4;

        const x = i * barWidth;
        const y = (height - h) / 2;

        // Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#3b82f6'); // Blue
        gradient.addColorStop(1, '#a855f7'); // Purple

        ctx.fillStyle = gradient;

        // Rounded rect calc (simple rect for now)
        ctx.fillRect(x + 1, y, barWidth - 2, h);
      }

      offset += 0.1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="h-full w-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] filter"
    />
  );
}
