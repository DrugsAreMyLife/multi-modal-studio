'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Pencil,
  Eraser,
  Square,
  Circle,
  Download,
  Undo,
  Redo,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useImageStudioStore } from '@/lib/store/image-studio-store';

interface CanvasLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  imageData?: ImageData;
}

interface UnifiedCanvasProps {
  width?: number;
  height?: number;
  initialImage?: string;
  onExport?: (dataUrl: string) => void;
  onInpaint?: (image: string, mask: string) => void;
}

type Tool = 'move' | 'brush' | 'eraser' | 'rectangle' | 'ellipse' | 'mask';

export function UnifiedCanvas({ initialImage, onExport, onInpaint }: UnifiedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useImageStudioStore();

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>('brush');
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [layers, setLayers] = useState<CanvasLayer[]>([
    { id: 'base', name: 'Background', visible: true, opacity: 100 },
    { id: 'draw', name: 'Drawing', visible: true, opacity: 100 },
  ]);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size from settings
    const width = settings.width;
    const height = settings.height;

    canvas.width = width;
    canvas.height = height;

    if (maskCanvasRef.current) {
      maskCanvasRef.current.width = width;
      maskCanvasRef.current.height = height;
    }

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Load initial image if provided
    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        saveToHistory();
      };
      img.onerror = () => {
        saveToHistory();
      };
      img.src = initialImage;
    } else {
      saveToHistory();
    }
  }, [settings.width, settings.height, initialImage]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), imageData]);
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom - pan.x,
        y: (e.clientY - rect.top) / zoom - pan.y,
      };
    },
    [zoom, pan],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'move') {
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      setIsDrawing(true);

      const canvas = tool === 'mask' ? maskCanvasRef.current : canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCanvasCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [tool, getCanvasCoords],
  );

  const draw = useCallback(
    (e: React.MouseEvent) => {
      const canvas = tool === 'mask' ? maskCanvasRef.current : canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle pan/move tool
      if (tool === 'move' && e.buttons === 1) {
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        setPan((prev) => ({
          x: prev.x + deltaX / zoom,
          y: prev.y + deltaY / zoom,
        }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (!isDrawing || tool === 'move') return;

      const { x, y } = getCanvasCoords(e);

      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else if (tool === 'mask') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)'; // Translucent Purple for Mask
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
      }

      if (tool === 'brush' || tool === 'eraser' || tool === 'mask') {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    },
    [isDrawing, tool, brushSize, brushColor, getCanvasCoords, zoom],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  }, [isDrawing, saveToHistory]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onExport?.(dataUrl);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `canvas-export-${Date.now()}.png`;
    link.click();
  };

  const handleInpaint = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const imageData = canvas.toDataURL('image/png');
    const maskData = maskCanvas.toDataURL('image/png');

    onInpaint?.(imageData, maskData);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'brush', icon: Pencil, label: 'Brush' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'mask', icon: Sparkles, label: 'Inpaint Mask' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
  ];

  return (
    <Card className="flex h-full flex-col border-zinc-800 bg-zinc-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 p-3">
        <div className="flex items-center gap-1 border-r border-zinc-700 pr-3">
          {tools.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              size="icon"
              variant={tool === id ? 'default' : 'ghost'}
              className="h-8 w-8"
              onClick={() => setTool(id)}
              title={label}
            >
              <Icon size={16} />
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-r border-zinc-700 pr-3">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="h-8 w-8 cursor-pointer rounded border border-zinc-600"
            title="Brush color"
          />
          <div className="w-32">
            <Slider
              value={[brushSize]}
              onValueChange={([v]) => setBrushSize(v)}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
          </div>
          <span className="w-10 text-right text-xs text-zinc-400">{brushSize}px</span>
        </div>

        <div className="flex items-center gap-1 border-r border-zinc-700 pr-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </Button>
          <span className="w-12 text-center text-xs text-zinc-400">{(zoom * 100).toFixed(0)}%</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={resetView}
            title="Reset view"
          >
            <RotateCcw size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r border-zinc-700 pr-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <Undo size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo size={16} />
          </Button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="border-zinc-700 hover:bg-zinc-800"
          title="Export as PNG"
        >
          <Download size={14} className="mr-1" />
          Export
        </Button>

        {tool === 'mask' && (
          <Button
            size="sm"
            onClick={handleInpaint}
            className="border-0 bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-blue-500"
          >
            <Sparkles size={14} className="mr-1" />
            Inpaint Area
          </Button>
        )}
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden bg-zinc-900 p-4"
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center',
            transition: tool === 'move' ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <canvas
            ref={canvasRef}
            className="rounded-lg border border-zinc-700 shadow-2xl"
            style={{
              imageRendering: 'pixelated',
              cursor: tool === 'move' ? 'grab' : 'crosshair',
              backgroundColor: '#ffffff',
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <canvas
            ref={maskCanvasRef}
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              imageRendering: 'pixelated',
              opacity: 0.8,
            }}
          />
        </div>

        {/* Zoom and dimension info */}
        <div className="absolute right-4 bottom-4 rounded border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs text-zinc-500">
          {settings.width}x{settings.height}
        </div>
      </div>
    </Card>
  );
}
