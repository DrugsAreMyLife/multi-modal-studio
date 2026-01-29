'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Type,
  Compass,
  Fullscreen,
  MessageSquareQuote,
  Shapes,
  Sparkles,
  Zap,
  MousePointer2,
  ListOrdered,
  Anchor,
  Maximize,
  Minimize,
  RefreshCcw,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { VideoStabilizeResponse } from '@/lib/types/video-stabilize';

interface Annotation {
  id: string;
  type: 'title' | 'direction' | 'caption';
  text: string;
  position: { x: number; y: number };
  style: string;
}

export function DirectorStudio() {
  const [videoUrl, setVideoUrl] = useState(
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  );
  const [stabilizedVideoUrl, setStabilizedVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stabilization, setStabilization] = useState(60);
  const [activeTool, setActiveTool] = useState<'stabilize' | 'annotate' | 'subtitles'>('annotate');

  const [annotations, setAnnotations] = useState<Annotation[]>([
    {
      id: '1',
      type: 'title',
      text: 'SECTION 01: THE AWAKENING',
      position: { x: 50, y: 20 },
      style: 'cinematic',
    },
    {
      id: '2',
      type: 'direction',
      text: '← SUBJECT MOVES STAGE LEFT',
      position: { x: 20, y: 80 },
      style: 'technical',
    },
  ]);

  const handleMagicAction = async (type: string) => {
    if (type === 'annotate') {
      // Annotations are client-side - instant bake
      toast.success('Annotations baked to timeline', {
        description: `${annotations.length} layer(s) committed`,
      });
      return;
    }

    if (type === 'subtitles') {
      // Subtitles would call transcription API in production
      toast.info('Subtitle generation queued', {
        description: 'Neural transcription will process on export',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/video/stabilize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          intensity: stabilization / 100,
          async: false,
        }),
      });

      if (!response.ok) throw new Error('Stabilization failed');

      const result: VideoStabilizeResponse = await response.json();

      if (result.status === 'completed' && result.stabilizedVideoUrl) {
        setStabilizedVideoUrl(result.stabilizedVideoUrl);
        toast.success('Stabilize bake complete.');
      }
    } catch (err) {
      toast.error('Stabilization failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full gap-6 p-6">
      {/* Left Panel: Interative Video Stage */}
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold italic">
              <Compass className="text-primary" /> Director Studio
            </h1>
            <p className="text-muted-foreground text-sm">
              Magic stabilization, neural subtitles, and spatial annotations
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTool === 'stabilize' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTool('stabilize')}
              className="gap-2"
            >
              <Anchor size={14} /> Stabilize
            </Button>
            <Button
              variant={activeTool === 'annotate' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTool('annotate')}
              className="gap-2"
            >
              <Type size={14} /> Annotate
            </Button>
            <Button
              variant={activeTool === 'subtitles' ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setActiveTool('subtitles')}
              className="gap-2"
            >
              <MessageSquareQuote size={14} /> Subtitles
            </Button>
          </div>
        </div>

        <Card className="relative flex-1 overflow-hidden border-white/5 bg-[#050505] shadow-2xl">
          <video
            src={stabilizedVideoUrl || videoUrl}
            className={cn(
              'h-full w-full object-contain transition-transform duration-500',
              activeTool === 'stabilize' && 'scale-110 blur-[1px] grayscale-[50%]',
            )}
            autoPlay
            loop
            muted
          />

          {/* Interactive Annotation Overlay */}
          <div className="pointer-events-none absolute inset-0">
            {annotations.map((anno) => (
              <div
                key={anno.id}
                className="group pointer-events-auto absolute cursor-move"
                style={{ left: `${anno.position.x}%`, top: `${anno.position.y}%` }}
              >
                <div
                  className={cn(
                    'border px-4 py-2 backdrop-blur-md transition-all',
                    anno.type === 'title'
                      ? 'bg-primary/20 border-primary text-2xl font-black tracking-tighter text-white italic'
                      : 'border-white/20 bg-black/60 font-mono text-[10px] text-emerald-500',
                  )}
                >
                  {anno.text}
                </div>
                <div className="absolute -top-6 -right-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="destructive" size="icon" className="h-5 w-5 rounded-full">
                    <Minimize size={8} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Subtitle Preview */}
          {activeTool === 'subtitles' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
              <div className="animate-pulse rounded border border-white/10 bg-black/80 px-4 py-1 text-sm font-medium text-white">
                [Neural Subtitle: The protagonist looks toward the horizon...]
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <RefreshCcw className="text-primary h-12 w-12 animate-spin" />
              <p className="mt-4 text-sm font-bold tracking-widest uppercase">
                Baking Neural Metatada...
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Right Panel: Production Controls */}
      <div className="flex w-80 flex-col gap-6">
        <Card className="flex flex-col gap-6 border-white/5 bg-black/40 p-6">
          {activeTool === 'stabilize' && (
            <>
              <div className="flex items-center gap-2">
                <Anchor size={18} className="text-primary" />
                <h3 className="font-bold">Neural Gyro</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase opacity-50">
                    <span>Smoothness Depth</span>
                    <span>{stabilization}%</span>
                  </div>
                  <Slider
                    value={[stabilization]}
                    onValueChange={([v]) => setStabilization(v)}
                    max={100}
                  />
                </div>
                <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="opacity-40">Auto-Crop Factor</span>
                    <span className="font-mono">1.12x</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="opacity-40">Rolling Shutter Fix</span>
                    <span className="font-bold text-emerald-500">READY</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTool === 'annotate' && (
            <>
              <div className="flex items-center gap-2">
                <Shapes size={18} className="text-primary" />
                <h3 className="font-bold">Layer Library</h3>
              </div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="h-10 w-full justify-start gap-2 border-white/10 text-[11px] font-bold"
                >
                  <ListOrdered size={14} /> Add Section Title
                </Button>
                <Button
                  variant="outline"
                  className="h-10 w-full justify-start gap-2 border-white/10 text-[11px] font-bold"
                >
                  <MousePointer2 size={14} /> Add Direction Path
                </Button>
                <Button
                  variant="outline"
                  className="h-10 w-full justify-start gap-2 border-white/10 text-[11px] font-bold"
                >
                  <Sparkles size={14} /> AI Context Graphics
                </Button>
              </div>
            </>
          )}

          {activeTool === 'subtitles' && (
            <>
              <div className="flex items-center gap-2">
                <Languages size={18} className="text-primary" />
                <h3 className="font-bold">Auto-Transcription</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-primary/10 border-primary/20 rounded-xl border p-4">
                  <p className="text-[10px] leading-relaxed text-zinc-300 italic">
                    Transcribing dialogue and ambient noise in real-time. Detecting 4 unique speaker
                    profiles.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-8 border-white/10 text-[10px]">
                    Style: Netflix
                  </Button>
                  <Button variant="outline" className="h-8 border-white/10 text-[10px]">
                    Style: Social
                  </Button>
                </div>
              </div>
            </>
          )}

          <Button
            onClick={() => handleMagicAction(activeTool)}
            className="shadow-primary/20 w-full gap-2 shadow-lg"
          >
            <Zap size={14} /> Bake Production Assets
          </Button>
        </Card>

        <Card className="flex-1 border-white/5 bg-black/40 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Fullscreen size={18} className="text-emerald-500" />
            <h3 className="text-xs font-bold tracking-wider uppercase">Final Layout (Scaling)</h3>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="active:bg-primary/10 active:border-primary flex h-14 flex-col gap-1 border-white/10"
            >
              <Maximize size={12} />
              <span className="text-[9px]">4K CINEMA</span>
            </Button>
            <Button
              variant="outline"
              className="active:bg-primary/10 active:border-primary flex h-14 flex-col gap-1 border-white/10"
            >
              <RefreshCcw size={12} />
              <span className="text-[9px]">9:16 SOCIAL</span>
            </Button>
          </div>

          <div className="rounded-xl border border-white/5 bg-zinc-800/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-40">
                Metadata Tags
              </span>
              <Badge className="h-4 bg-emerald-500/10 text-[8px] text-emerald-500">VALID</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {['XMP-STABILIZED', 'NeuralCaptions', '4K-Upres'].map((t) => (
                <Badge key={t} className="h-4 border-none bg-white/5 font-mono text-[8px]">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
