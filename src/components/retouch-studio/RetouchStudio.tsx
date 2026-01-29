'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eraser,
  Sparkles,
  Scissors,
  Play,
  Pause,
  Undo2,
  Layers,
  Wand2,
  Trash2,
  Scan,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import type { RetouchInpaintResponse } from '@/lib/types/retouch';

export function RetouchStudio() {
  const [videoUrl, setVideoUrl] = useState(
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  );
  const [inpaintedUrl, setInpaintedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tool, setTool] = useState<'roto' | 'inpaint'>('inpaint');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleRetouch = async () => {
    if (tool !== 'inpaint') {
      toast.info('Auto-Roto will be implemented in Phase 4');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/retouch/inpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: videoUrl,
          maskUrl: 'https://example.com/mock-mask.png', // Placeholder mask
          prompt: 'Remove object and fill background',
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Inpainting failed');

      const result: RetouchInpaintResponse = await response.json();

      if (result.status === 'completed' && result.inpaintedImageUrl) {
        setInpaintedUrl(result.inpaintedImageUrl);
        toast.success('Temporal in-painting complete. Artifacts suppressed.');
      }
    } catch (err) {
      toast.error('Retouch failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Eraser className="text-primary" /> Neural Retouch
            </h1>
            <p className="text-muted-foreground text-sm">
              Magic eraser and auto-roto for consistent motion
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={tool === 'inpaint' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setTool('inpaint')}
              className="gap-2"
            >
              <Wand2 size={14} /> In-painting
            </Button>
            <Button
              variant={tool === 'roto' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setTool('roto')}
              className="gap-2"
            >
              <Scissors size={14} /> Auto-Roto
            </Button>
          </div>
        </div>

        <Card className="group relative flex-1 overflow-hidden border-white/5 bg-black/60 shadow-inner">
          <video
            ref={videoRef}
            src={inpaintedUrl || videoUrl}
            className="h-full w-full object-contain"
            onTimeUpdate={() =>
              setProgress(
                ((videoRef.current?.currentTime || 0) / (videoRef.current?.duration || 1)) * 100,
              )
            }
          />

          {/* Overlay Mask Canvas (Visual representation) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border-primary/50 bg-primary/10 h-32 w-32 rounded-full border-2 border-dashed transition-transform group-hover:scale-110" />
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </Button>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="bg-primary h-full" style={{ width: `${progress}%` }} />
              </div>
              <span className="font-mono text-[10px] text-white opacity-60">
                00:
                {Math.floor(videoRef.current?.currentTime || 0)
                  .toString()
                  .padStart(2, '0')}{' '}
                / 00:10
              </span>
            </div>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <RefreshCw className="text-primary h-12 w-12 animate-spin" />
              <p className="mt-4 text-sm font-bold tracking-widest uppercase">
                Temporal Propagation...
              </p>
            </div>
          )}
        </Card>
      </div>

      <div className="flex w-80 flex-col gap-6">
        <Card className="flex flex-col gap-4 border-white/5 bg-black/40 p-6">
          <div className="flex items-center gap-2">
            <Scan size={18} className="text-primary" />
            <h3 className="font-bold">Object Isolation</h3>
          </div>

          <p className="text-[10px] leading-relaxed text-zinc-400">
            Identify and track subjects across the entire sequence to apply non-destructive edits.
          </p>

          <div className="space-y-3">
            <Label className="text-[10px] font-bold tracking-widest uppercase opacity-40">
              Active Masks
            </Label>
            <div className="bg-primary/5 border-primary/20 flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 text-primary mt-0.5 flex h-8 w-8 items-center justify-center rounded text-xs font-bold">
                  #1
                </div>
                <div>
                  <p className="text-[11px] font-bold italic">Foreground Glitch</p>
                  <p className="text-[9px] opacity-40">Frames 0-120 • 98% Conf.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          <Button onClick={handleRetouch} className="shadow-primary/20 mt-2 w-full gap-2 shadow-lg">
            <Sparkles size={14} /> Execute Neural Repair
          </Button>
        </Card>

        <Card className="flex-1 border-white/5 bg-black/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Layers size={18} className="text-amber-500" />
            <h3 className="font-bold">Refinement Stack</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold uppercase opacity-50">
                  Edge Feathering
                </label>
                <span className="font-mono text-[10px]">12px</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div className="h-full w-1/3 bg-white/20" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold uppercase opacity-50">
                  Temporal Smoothness
                </label>
                <span className="font-mono text-[10px]">High</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5">
                <div className="bg-primary h-full w-[85%]" />
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-white/5 bg-zinc-800/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Undo2 size={14} className="text-zinc-500" />
              <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
                Version History
              </span>
            </div>
            <div className="mt-4 space-y-2 opacity-40">
              <div className="h-3 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/10" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
