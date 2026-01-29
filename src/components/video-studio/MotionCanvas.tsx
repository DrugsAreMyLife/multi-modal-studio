'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, MousePointer2, Move, Paintbrush, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MotionCanvasProps {
  backgroundImage: string | null;
  onUpdate?: (maskBase64: string, vectors: any[]) => void;
  className?: string;
}

export function MotionCanvas({ backgroundImage, onUpdate, className }: MotionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'path'>('brush');
  const [vectors, setVectors] = useState<
    { start: { x: number; y: number }; end: { x: number; y: number } }[]
  >([]);
  const [activeVector, setActiveVector] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and set dimensions
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVectors([]);
  }, [backgroundImage]);

  useEffect(() => {
    drawOverlay();
  }, [vectors, activeVector]);

  const drawOverlay = () => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed vectors
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    [...vectors, ...(activeVector ? [activeVector] : [])].forEach((v) => {
      // Draw line
      ctx.beginPath();
      ctx.moveTo(v.start.x, v.start.y);
      ctx.lineTo(v.end.x, v.end.y);
      ctx.stroke();

      // Draw arrow head
      const angle = Math.atan2(v.end.y - v.start.y, v.end.x - v.start.x);
      ctx.beginPath();
      ctx.moveTo(v.end.x, v.end.y);
      ctx.lineTo(
        v.end.x - 10 * Math.cos(angle - Math.PI / 6),
        v.end.y - 10 * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        v.end.x - 10 * Math.cos(angle + Math.PI / 6),
        v.end.y - 10 * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
    });
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e as any).clientX || (e as any).touches?.[0]?.clientX) - rect.left;
    const y = ((e as any).clientY || (e as any).touches?.[0]?.clientY) - rect.top;

    if (tool === 'path') {
      setActiveVector({ start: { x, y }, end: { x, y } });
    }
    setIsDrawing(true);
    if (tool !== 'path') draw(e);
  };

  const stopDrawing = () => {
    if (tool === 'path' && activeVector) {
      setVectors((prev) => [...prev, activeVector]);
      setActiveVector(null);
    }
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas) {
      onUpdate?.(canvas.toDataURL(), vectors);
    }
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    if (tool === 'path') {
      setActiveVector((prev) => (prev ? { ...prev, end: { x, y } } : null));
      return;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'brush' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 1)';
    ctx.globalCompositeOperation = tool === 'brush' ? 'source-over' : 'destination-out';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setVectors([]);
      onUpdate?.('', []);
    }
  };

  return (
    <div className={cn('relative flex flex-col gap-3', className)}>
      <div className="bg-background/40 relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
        {backgroundImage && (
          <img
            src={backgroundImage}
            className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale"
          />
        )}
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="relative h-full w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <canvas
          ref={overlayRef}
          width={640}
          height={360}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />

        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            size="icon"
            variant={tool === 'brush' ? 'default' : 'secondary'}
            className="h-8 w-8"
            onClick={() => setTool('brush')}
          >
            <Paintbrush size={14} />
          </Button>
          <Button
            size="icon"
            variant={tool === 'path' ? 'default' : 'secondary'}
            className="h-8 w-8"
            onClick={() => setTool('path')}
          >
            <Move size={14} />
          </Button>
          <Button
            size="icon"
            variant={tool === 'eraser' ? 'default' : 'secondary'}
            className="h-8 w-8"
            onClick={() => setTool('eraser')}
          >
            <Eraser size={14} />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={clearCanvas}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-medium uppercase opacity-60">
          {tool === 'path' ? 'Drag to draw motion path' : 'Brush Size'}
        </span>
        {tool !== 'path' && (
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="accent-primary h-1 w-32 rounded-full"
          />
        )}
      </div>
    </div>
  );
}
