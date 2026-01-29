'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Box,
  Layers,
  Maximize,
  Move3d,
  Camera,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { DepthResponse } from '@/lib/types/depth';

export function DepthStudio() {
  const [sourceImage, setSourceImage] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
  );
  const [depthIntensity, setDepthIntensity] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | 'depth' | '3d'>('2d');
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (viewMode !== '3d' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const generateDepth = async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/depth/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: sourceImage,
          model: 'v2-large',
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Depth estimation failed');

      const result: DepthResponse = await response.json();

      if (result.status === 'completed' && result.depthMapUrl) {
        setDepthMapUrl(result.depthMapUrl);
        setViewMode('depth');
        toast.success('Depth map generated successfully');
      }
    } catch (err) {
      toast.error('Depth estimation failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      {/* Left Panel: Preview */}
      <div className="relative flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Move3d className="text-primary" /> Z-Space Engine
            </h1>
            <p className="text-muted-foreground text-sm">
              Convert flat assets into spatial 3D environments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === '2d' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('2d')}
            >
              2D Source
            </Button>
            <Button
              variant={viewMode === 'depth' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('depth')}
              disabled={!sourceImage}
            >
              Depth Map
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('3d')}
              disabled={!sourceImage}
            >
              3D Parallax
            </Button>
          </div>
        </div>

        <Card
          ref={containerRef}
          className="group relative flex-1 overflow-hidden border-white/5 bg-black/40 shadow-2xl"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
        >
          <AnimatePresence mode="wait">
            {viewMode === '2d' && (
              <motion.img
                key="2d"
                src={sourceImage}
                className="h-full w-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            {viewMode === 'depth' && (
              <motion.div
                key="depth"
                className="h-full w-full bg-cover grayscale"
                style={{ backgroundImage: `url(${depthMapUrl || sourceImage})` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            {viewMode === '3d' && (
              <motion.div
                key="3d"
                className="relative h-full w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Background Layer */}
                <div
                  className="absolute inset-0 transform-gpu bg-cover transition-transform duration-200"
                  style={{
                    backgroundImage: `url(${sourceImage})`,
                    transform: `scale(1.1) translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`,
                    filter: 'blur(4px) brightness(0.7)',
                  }}
                />
                {/* Mid Layer */}
                <div
                  className="absolute inset-0 transform-gpu bg-cover transition-transform duration-150"
                  style={{
                    backgroundImage: `url(${sourceImage})`,
                    clipPath: 'inset(10% 10% 10% 10%)',
                    transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px) scale(1.05)`,
                  }}
                />
                {/* Foreground Layer */}
                <div
                  className="absolute inset-x-20 top-20 bottom-0 transform-gpu bg-cover transition-transform duration-100"
                  style={{
                    backgroundImage: `url(${sourceImage})`,
                    clipPath: 'circle(30% at 50% 50%)',
                    transform: `translate(${mousePos.x * 50}px, ${mousePos.y * 50}px) scale(1.1)`,
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="mt-4 animate-pulse text-sm font-bold tracking-widest uppercase">
                Analyzing Scene Depth...
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Panel: Controls */}
      <div className="flex w-80 flex-col gap-6">
        <Card className="flex flex-col gap-4 border-white/5 bg-black/40 p-6">
          <div className="flex items-center gap-2">
            <Box size={18} className="text-primary" />
            <h3 className="font-bold">Spatial Parameters</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold uppercase opacity-50">
                  Extrusion Depth
                </label>
                <span className="font-mono text-[10px]">{depthIntensity}%</span>
              </div>
              <Slider
                value={[depthIntensity]}
                onValueChange={([v]) => setDepthIntensity(v)}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase opacity-50">Camera Model</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="xs" className="h-7 text-[9px]">
                  Orthographic
                </Button>
                <Button variant="default" size="xs" className="h-7 text-[9px]">
                  Perspective
                </Button>
              </div>
            </div>
          </div>

          <Button
            onClick={generateDepth}
            disabled={isProcessing}
            className="shadow-primary/20 w-full gap-2 shadow-lg"
          >
            <Sparkles size={14} /> Calculate Z-Buffer
          </Button>
        </Card>

        <Card className="flex-1 border-white/5 bg-black/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Layers size={18} className="text-emerald-500" />
            <h3 className="font-bold">Neural Segments</h3>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Sky/Background', depth: '0.0 - 0.2' },
              { name: 'Midground Terrain', depth: '0.3 - 0.6' },
              { name: 'Subject Silhouette', depth: '0.7 - 1.0' },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2 px-3 transition-colors hover:bg-white/10"
              >
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium">{s.name}</p>
                  <p className="font-mono text-[9px] opacity-40">Z-Range: {s.depth}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Maximize size={10} />
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-primary/10 border-primary/20 mt-8 rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Camera size={14} className="text-primary" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                Cinematic Export
              </span>
            </div>
            <p className="mb-4 text-[10px] leading-relaxed text-zinc-400">
              Export this spatial data as a 3D video sequence or a depth-aware keyframe for Video
              Studio.
            </p>
            <Button
              variant="outline"
              className="border-primary/20 hover:bg-primary/20 h-8 w-full text-[11px]"
            >
              Send to Video Studio
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
