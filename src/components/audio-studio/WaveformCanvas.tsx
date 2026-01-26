'use client';

import { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  isPlaying: boolean;
  analyser?: AnalyserNode | null;
}

export function WaveformCanvas({ isPlaying, analyser }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const dataArray = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

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
      const bars = 64;
      const barWidth = width / bars;

      if (analyser && dataArray && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      for (let i = 0; i < bars; i++) {
        let h = 4;

        if (isPlaying && dataArray && analyser) {
          // Use real data
          const idx = Math.floor((i / bars) * dataArray.length * 0.5); // Focus on lower/mid frequencies
          const value = dataArray[idx];
          h = (value / 255) * height * 0.9;
          h = Math.max(h, 4);
        } else if (isPlaying) {
          // Fallback to simpler oscillation if no analyser
          const t = performance.now() / 200;
          h = Math.abs(Math.sin(i * 0.2 + t)) * height * 0.5;
        }

        const x = i * barWidth;
        const y = (height - h) / 2;

        // Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + h);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;

        // Slightly rounded bars
        const radius = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x + 1, y, barWidth - 2, h, radius);
        } else {
          ctx.rect(x + 1, y, barWidth - 2, h);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="h-full w-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] filter"
    />
  );
}
